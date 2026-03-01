'use client';

import { useEffect, useRef } from 'react';
import { useCartStore } from '@/lib/cart';

/**
 * Initializes the cart from the server on app boot.
 * Placed in the root layout so cart badge is accurate on first load.
 */
export function CartInitializer() {
    const fetchCart = useCartStore((s) => s.fetchCart);
    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            fetchCart();
        }
    }, [fetchCart]);

    return null;
}
