import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from './api';
import { generateSessionId } from './utils';

// Debounce timeouts
const updateTimeouts: Record<string, NodeJS.Timeout> = {};

export interface CartItem {
    id: string;
    variantId: string;
    quantity: number;
    product: {
        id: string;
        title: string;
        slug: string;
        image: string | null;
    };
    variant: {
        id: string;
        title: string;
        sku: string | null;
        price: number;
        compareAtPrice: number | null;
        inventoryQty: number;
        options: Array<{ name: string; value: string }>;
    };
    lineTotal: number;
}

export interface Cart {
    id: string;
    items: CartItem[];
    itemCount: number;
    subtotal: number;
}

interface CartState {
    cart: Cart | null;
    isLoading: boolean;
    isOpen: boolean;

    // Actions
    fetchCart: () => Promise<void>;
    addItem: (variantId: string, quantity?: number) => Promise<void>;
    updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
    removeItem: (itemId: string) => Promise<void>;
    clearCart: () => Promise<void>;
    mergeAndFetch: () => Promise<void>;
    setIsOpen: (isOpen: boolean) => void;
    closeCart: () => void;
    toggleCart: () => void;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            cart: null,
            isLoading: false,
            isOpen: false,

            fetchCart: async () => {
                set({ isLoading: true });
                try {
                    generateSessionId(); // Ensure session ID exists
                    const response = await api.get('/cart');

                    // Store session ID if returned
                    if (response.data.sessionId) {
                        localStorage.setItem('sessionId', response.data.sessionId);
                    }

                    set({ cart: response.data, isLoading: false });
                } catch (error) {
                    console.error('Failed to fetch cart:', error);
                    set({ isLoading: false });
                }
            },

            addItem: async (variantId: string, quantity = 1) => {
                set({ isLoading: true });
                try {
                    generateSessionId();
                    const response = await api.post('/cart/items', { variantId, quantity });

                    if (response.data.sessionId) {
                        localStorage.setItem('sessionId', response.data.sessionId);
                    }

                    set({ cart: response.data, isLoading: false, isOpen: true });
                } catch (error: unknown) {
                    set({ isLoading: false });
                    const axiosErr = error as { response?: { data?: { error?: string } } };
                    throw new Error(axiosErr.response?.data?.error || 'Failed to add item');
                }
            },

            updateItemQuantity: async (itemId: string, quantity: number) => {
                const { cart } = get();
                if (!cart) return;

                // Clear existing timeout
                if (updateTimeouts[itemId]) {
                    clearTimeout(updateTimeouts[itemId]);
                }

                // Optimistic update
                const updatedItems = cart.items.map((item) =>
                    item.id === itemId
                        ? { ...item, quantity, lineTotal: item.variant.price * quantity }
                        : item
                );
                const newSubtotal = updatedItems.reduce((sum, item) => sum + item.lineTotal, 0);
                const newItemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

                set({
                    cart: {
                        ...cart,
                        items: quantity === 0 ? updatedItems.filter((i) => i.id !== itemId) : updatedItems,
                        subtotal: newSubtotal,
                        itemCount: newItemCount,
                    },
                });

                // Debounce API call (500ms)
                updateTimeouts[itemId] = setTimeout(async () => {
                    try {
                        const response = await api.patch(`/cart/items/${itemId}`, { quantity });
                        set({ cart: response.data });
                        delete updateTimeouts[itemId];
                    } catch (error) {
                        // Revert on error
                        get().fetchCart();
                    }
                }, 500);
            },

            removeItem: async (itemId: string) => {
                const { cart } = get();
                if (!cart) return;

                // Clear any pending update timeout for this item
                if (updateTimeouts[itemId]) {
                    clearTimeout(updateTimeouts[itemId]);
                    delete updateTimeouts[itemId];
                }

                // Optimistic update
                const updatedItems = cart.items.filter((item) => item.id !== itemId);
                const newSubtotal = updatedItems.reduce((sum, item) => sum + item.lineTotal, 0);
                const newItemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

                set({
                    cart: {
                        ...cart,
                        items: updatedItems,
                        subtotal: newSubtotal,
                        itemCount: newItemCount,
                    },
                });

                try {
                    const response = await api.delete(`/cart/items/${itemId}`);
                    set({ cart: response.data });
                } catch (error) {
                    get().fetchCart();
                }
            },

            clearCart: async () => {
                // Clear any pending update timeouts to prevent stale API requests
                Object.keys(updateTimeouts).forEach((key) => {
                    clearTimeout(updateTimeouts[key]);
                    delete updateTimeouts[key];
                });
                try {
                    const response = await api.delete('/cart');
                    set({ cart: response.data });
                } catch (error) {
                    console.error('Failed to clear cart:', error);
                }
            },

            mergeAndFetch: async () => {
                set({ isLoading: true });
                try {
                    // Get the session ID that was used for guest cart
                    const sessionId = localStorage.getItem('sessionId');

                    if (sessionId) {
                        // Merge guest cart into customer cart
                        const response = await api.post('/cart/merge', { sessionId });
                        set({ cart: response.data, isLoading: false });

                        // Clear sessionId since we're now authenticated
                        localStorage.removeItem('sessionId');
                    } else {
                        // No guest cart to merge, just fetch the customer cart
                        const response = await api.get('/cart');
                        set({ cart: response.data, isLoading: false });
                    }
                } catch (error) {
                    console.error('Failed to merge/fetch cart:', error);
                    // Fallback to regular fetch
                    try {
                        const response = await api.get('/cart');
                        set({ cart: response.data, isLoading: false });
                    } catch (err) {
                        set({ isLoading: false });
                    }
                }
            },

            setIsOpen: (isOpen) => set({ isOpen }),
            closeCart: () => set({ isOpen: false }),
            toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
        }),
        {
            name: 'cart-storage',
            partialize: (state) => ({
                cart: state.cart,
            }),
        }
    )
);
