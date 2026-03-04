'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';
import type {
    Product,
    ProductListItem,
    Collection,
    Category,
    Order,
    Review,
    ReviewStats,
    Pagination,
    CheckoutFormData
} from './types';

// ========================
// PRODUCTS
// ========================

interface ProductsResponse {
    products: ProductListItem[];
    pagination: Pagination;
}

interface ProductQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    collection?: string;
    tag?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: 'title' | 'price' | 'createdAt' | 'featured';
    order?: 'asc' | 'desc';
    featured?: boolean;
}

export function useProducts(params: ProductQueryParams = {}) {
    return useQuery<ProductsResponse>({
        queryKey: ['products', params],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    searchParams.append(key, String(value));
                }
            });
            const response = await api.get(`/products?${searchParams.toString()}`);
            return response.data;
        },
    });
}

export function useProduct(slug: string) {
    return useQuery<Product>({
        queryKey: ['product', slug],
        queryFn: async () => {
            const response = await api.get(`/products/slug/${slug}`);
            return response.data;
        },
        enabled: !!slug,
    });
}

export function useFeaturedProducts() {
    return useProducts({ featured: true, limit: 8 });
}

// ========================
// COLLECTIONS
// ========================

interface CollectionsResponse {
    collections: Collection[];
    pagination: Pagination;
}

export function useCollections() {
    return useQuery<Collection[]>({
        queryKey: ['collections'],
        queryFn: async () => {
            const response = await api.get('/collections');
            return response.data.collections || response.data;
        },
    });
}

export function useFeaturedCollections() {
    return useQuery<Collection[]>({
        queryKey: ['collections', 'featured'],
        queryFn: async () => {
            const response = await api.get('/collections/featured');
            return response.data;
        },
    });
}

export function useCollection(slug: string) {
    return useQuery<Collection>({
        queryKey: ['collection', slug],
        queryFn: async () => {
            const response = await api.get(`/collections/slug/${slug}`);
            return response.data;
        },
        enabled: !!slug,
    });
}

// ========================
// CATEGORIES
// ========================

export function useCategories() {
    return useQuery<Category[]>({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await api.get('/categories');
            return response.data;
        },
    });
}

export function useCategory(slug: string) {
    return useQuery<Category>({
        queryKey: ['category', slug],
        queryFn: async () => {
            const response = await api.get(`/categories/slug/${slug}`);
            return response.data;
        },
        enabled: !!slug,
    });
}

// ========================
// REVIEWS
// ========================

interface ReviewsResponse {
    reviews: Review[];
    pagination: Pagination;
    stats: ReviewStats;
}

export function useProductReviews(productId: string, page = 1, limit = 10) {
    return useQuery<ReviewsResponse>({
        queryKey: ['reviews', productId, page, limit],
        queryFn: async () => {
            const response = await api.get(`/reviews/product/${productId}?page=${page}&limit=${limit}`);
            return response.data;
        },
        enabled: !!productId,
    });
}

export function useCreateReview() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { productId: string; rating: number; title?: string; content?: string }) => {
            const response = await api.post('/reviews', data);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['reviews', variables.productId] });
        },
    });
}

// ========================
// ORDERS
// ========================

interface OrdersResponse {
    orders: Order[];
    pagination: Pagination;
}

export function useMyOrders(params: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 10 } = params;
    return useQuery<OrdersResponse>({
        queryKey: ['my-orders', page, limit],
        queryFn: async () => {
            const response = await api.get(`/orders/my-orders?page=${page}&limit=${limit}`);
            return response.data;
        },
    });
}

export function useOrder(id: string) {
    return useQuery<Order>({
        queryKey: ['order', id],
        queryFn: async () => {
            const response = await api.get(`/orders/${id}`);
            return response.data;
        },
        enabled: !!id,
    });
}

export function useOrderByNumber(orderNumber: string) {
    return useQuery<Order>({
        queryKey: ['order', 'number', orderNumber],
        queryFn: async () => {
            const response = await api.get(`/orders/number/${orderNumber}`);
            return response.data;
        },
        enabled: !!orderNumber,
    });
}

// ========================
// WISHLIST
// ========================

interface WishlistItem {
    id: string;
    addedAt: string;
    product: {
        id: string;
        title: string;
        slug: string;
        price: number;
        compareAtPrice: number | null;
        image: string | null;
        inStock: boolean;
    };
}

export function useWishlist() {
    return useQuery<WishlistItem[]>({
        queryKey: ['wishlist'],
        queryFn: async () => {
            const response = await api.get('/wishlist');
            return response.data.items || response.data;
        },
    });
}

export function useAddToWishlist() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (productId: string) => {
            const response = await api.post(`/wishlist/${productId}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wishlist'] });
        },
    });
}

export function useRemoveFromWishlist() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (productId: string) => {
            const response = await api.delete(`/wishlist/${productId}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wishlist'] });
        },
    });
}

export function useCheckWishlist(productId: string) {
    return useQuery<{ inWishlist: boolean }>({
        queryKey: ['wishlist', 'check', productId],
        queryFn: async () => {
            const response = await api.get(`/wishlist/check/${productId}`);
            return response.data;
        },
        enabled: !!productId,
    });
}

// ========================
// CHECKOUT
// ========================

interface CheckoutPreview {
    items: Array<{ productTitle: string; quantity: number; price: number }>;
    itemCount: number;
    subtotal: number;
    discount: number;
    discountType: string | null;
    shipping: number;
    freeShippingThreshold: number | null;
    tax: number;
    taxRate: number;
    total: number;
}

export function useCheckoutPreview(discountCode?: string) {
    return useQuery<CheckoutPreview>({
        queryKey: ['checkout-preview', discountCode],
        queryFn: async () => {
            const response = await api.post('/checkout/preview', { discountCode });
            return response.data;
        },
        // POST inside useQuery — disable automatic refetching to prevent unintended mutations
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
    });
}

export function useApplyDiscount() {
    return useMutation({
        mutationFn: async (code: string) => {
            const response = await api.post('/checkout/discount', { code });
            return response.data;
        },
    });
}

export function useCheckout() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CheckoutFormData) => {
            const response = await api.post('/checkout', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
    });
}
