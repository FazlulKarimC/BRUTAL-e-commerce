import { Router, Request, Response, NextFunction } from 'express';
import { orderService } from '../services/order.service';
import { cartService } from '../services/cart.service';
import { prisma } from '../config/database';
import { validateBody } from '../middleware/validate';
import { optionalAuth } from '../middleware/auth';
import { checkoutSchema, applyDiscountSchema } from '../validators';
import { ApiError } from '../middleware/errorHandler';

const router = Router();

// Apply discount code (check validity)
router.post(
    '/discount',
    optionalAuth,
    validateBody(applyDiscountSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Get subtotal from cart
            const sessionId = req.headers['x-session-id'] as string;
            const customerId = req.user?.userId;

            const cart = await cartService.getOrCreateCart(customerId, sessionId);

            if (cart.subtotal === 0) {
                res.status(400).json({ error: 'Cart is empty' });
                return;
            }

            // Resolve Customer ID from User ID
            let resolvedCustomerId: string | undefined;
            if (customerId) {
                const customer = await prisma.customer.findUnique({ where: { userId: customerId } });
                if (customer) resolvedCustomerId = customer.id;
            }

            const result = await orderService.applyDiscount(req.body.code, cart.subtotal, resolvedCustomerId);

            res.json({
                valid: true,
                code: req.body.code.toUpperCase(),
                type: result.type,
                discount: result.discount,
                subtotal: cart.subtotal,
                newSubtotal: cart.subtotal - result.discount,
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
                return;
            }
            next(error);
        }
    }
);

// Process checkout
router.post(
    '/',
    optionalAuth,
    validateBody(checkoutSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const sessionId = req.headers['x-session-id'] as string;
            const userId = req.user?.userId;

            // Get cart
            const cart = await cartService.getOrCreateCart(userId, sessionId);

            if (cart.items.length === 0) {
                res.status(400).json({ error: 'Cart is empty' });
                return;
            }

            // Resolve Customer ID from User ID (Order's FK is to Customer, not User)
            let customerId: string | undefined;
            if (userId) {
                let customer = await prisma.customer.findUnique({ where: { userId } });
                if (!customer) {
                    customer = await prisma.customer.create({ data: { userId } });
                }
                customerId = customer.id;
            }

            // Process checkout
            const order = await orderService.checkout(cart.id, req.body, customerId);

            res.status(201).json({
                message: 'Order placed successfully',
                order,
            });
        } catch (error) {
            if (error instanceof Error) {
                // Handle known errors
                if (
                    error.message.includes('Cart is empty') ||
                    error.message.includes('Insufficient inventory') ||
                    error.message.includes('Payment failed') ||
                    error.message.includes('Card declined') ||
                    error.message.includes('discount')
                ) {
                    next(new ApiError(400, error.message));
                    return;
                }
            }
            next(error);
        }
    }
);

// Get checkout preview (calculate totals without placing order)
router.post(
    '/preview',
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const sessionId = req.headers['x-session-id'] as string;
            const customerId = req.user?.userId;

            const cart = await cartService.getOrCreateCart(customerId, sessionId);

            if (cart.items.length === 0) {
                res.status(400).json({ error: 'Cart is empty' });
                return;
            }

            // Resolve Customer ID from User ID
            let resolvedCustomerId: string | undefined;
            if (customerId) {
                const customer = await prisma.customer.findUnique({ where: { userId: customerId } });
                if (customer) resolvedCustomerId = customer.id;
            }

            let discount = 0;
            let discountType = null;

            if (req.body.discountCode) {
                try {
                    const discountResult = await orderService.applyDiscount(req.body.discountCode, cart.subtotal, resolvedCustomerId);
                    discount = discountResult.discount;
                    discountType = discountResult.type;
                } catch {
                    // Ignore invalid discount codes in preview
                }
            }

            // Get store settings
            const settings = await prisma.storeSettings.findUnique({
                where: { id: 'default' },
            });

            const shippingCost = settings?.shippingRate ? parseFloat(settings.shippingRate.toString()) : 0;
            const freeShippingThreshold = settings?.freeShippingThreshold
                ? parseFloat(settings.freeShippingThreshold.toString())
                : null;

            const hasFreeShippingDiscount = discountType === 'FREE_SHIPPING';
            const meetsFreeShippingThreshold = freeShippingThreshold !== null && cart.subtotal >= freeShippingThreshold;
            const finalShipping = (hasFreeShippingDiscount || meetsFreeShippingThreshold) ? 0 : shippingCost;

            const taxRate = settings?.defaultTaxRate ? parseFloat(settings.defaultTaxRate.toString()) : 0;
            const tax = (cart.subtotal - discount) * (taxRate / 100);
            const total = cart.subtotal - discount + finalShipping + tax;

            res.json({
                items: cart.items,
                itemCount: cart.itemCount,
                subtotal: cart.subtotal,
                discount,
                discountType,
                shipping: finalShipping,
                freeShippingThreshold,
                tax,
                taxRate,
                total,
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
