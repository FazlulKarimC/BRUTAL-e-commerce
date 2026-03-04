import { prisma } from '../config/database';
import { CheckoutInput } from '../validators/order.validator';
import { generateOrderNumber } from '../utils/helpers';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { emailService } from './email.service';

export class OrderService {
    /**
     * Process checkout and create order
     */
    async checkout(cartId: string, input: CheckoutInput, customerId?: string) {
        // Get cart with items
        const cart = await prisma.cart.findUnique({
            where: { id: cartId },
            include: {
                items: {
                    include: {
                        variant: {
                            include: {
                                product: {
                                    include: { images: { where: { deletedAt: null }, take: 1 } },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!cart || cart.items.length === 0) {
            throw new Error('Cart is empty');
        }

        // Note: Inventory will be validated inside the transaction to prevent race conditions

        // Calculate totals
        const subtotal = cart.items.reduce(
            (sum, item) => sum + parseFloat(item.variant.price.toString()) * item.quantity,
            0
        );

        // Apply discount if provided
        let discount = 0;
        let discountCodeId: string | null = null;
        let discountType: string | null = null;

        if (input.discountCode) {
            const discountResult = await this.applyDiscount(input.discountCode, subtotal, customerId);
            discount = discountResult.discount;
            discountCodeId = discountResult.discountCodeId;
            discountType = discountResult.type;
        }

        // Get store settings for shipping and tax
        const settings = await prisma.storeSettings.findUnique({
            where: { id: 'default' },
        });

        const shippingCost = settings?.shippingRate ? parseFloat(settings.shippingRate.toString()) : 0;
        const freeShippingThreshold = settings?.freeShippingThreshold
            ? parseFloat(settings.freeShippingThreshold.toString())
            : null;

        // Check if free shipping via discount code OR threshold
        const hasFreeShippingDiscount = discountType === 'FREE_SHIPPING';
        const meetsFreeShippingThreshold = freeShippingThreshold !== null && subtotal >= freeShippingThreshold;
        const finalShipping = (hasFreeShippingDiscount || meetsFreeShippingThreshold) ? 0 : shippingCost;

        const taxRate = settings?.defaultTaxRate ? parseFloat(settings.defaultTaxRate.toString()) : 0;
        const tax = (subtotal - discount) * (taxRate / 100);
        const total = subtotal - discount + finalShipping + tax;

        // Process mock payment - THIS IS NOW HANDLED IN PHASE 2
        // Calculate total is complete

        // Phase 1: Create Order and Reserve Inventory (Transaction 1)
        const { order, rollbackData } = await prisma.$transaction(async (tx) => {
            // 1. Atomically deduct inventory to prevent overselling
            const rollbackItems: Array<{ id: string; quantity: number }> = [];
            for (const item of cart.items) {
                // Read current state to ensure valid
                const currentVariant = await tx.productVariant.findUnique({
                    where: { id: item.variantId },
                });
                if (!currentVariant || currentVariant.inventoryQty < item.quantity) {
                    throw new Error(`Insufficient inventory for ${item.variant.product.title}`);
                }

                // Atomic decrement
                const updatedVariant = await tx.productVariant.update({
                    where: {
                        id: item.variantId,
                        // Optimistic concurrency control guard (optional safety layer)
                        inventoryQty: { gte: item.quantity }
                    },
                    data: { inventoryQty: { decrement: item.quantity } },
                });
                rollbackItems.push({ id: item.variantId, quantity: item.quantity });
            }

            // 2. Atomically increment discount usage if applicable
            let usedDiscountId: string | null = null;
            if (discountCodeId) {
                const dc = await tx.discountCode.findUnique({ where: { id: discountCodeId } });
                if (!dc || !dc.active) throw new Error('Discount code is no longer active');
                if (dc.maxUses && dc.usedCount >= dc.maxUses) throw new Error('Discount code has reached its usage limit');

                // Enforce per-customer limits atomically if logged in
                if (dc.usesPerCustomer && customerId) {
                    const pastUses = await tx.order.count({
                        where: { customerId, discountCodeId: dc.id, status: { notIn: ['CANCELLED', 'REFUNDED'] } }
                    });
                    if (pastUses >= dc.usesPerCustomer) {
                        throw new Error('You have already used this discount code the maximum number of times');
                    }
                }

                await tx.discountCode.update({
                    where: { id: discountCodeId },
                    data: { usedCount: { increment: 1 } },
                });
                usedDiscountId = discountCodeId;
            }

            // 3. Create Address (if applicable)
            let shippingAddressId: string | null = null;
            if (customerId) {
                const address = await tx.address.create({
                    data: {
                        customerId,
                        ...input.shippingAddress,
                        isDefault: false,
                    },
                });
                shippingAddressId = address.id;
            }

            // 4. Create Order in PENDING state
            const createdOrder = await tx.order.create({
                data: {
                    orderNumber: generateOrderNumber(),
                    customerId,
                    email: input.email,
                    phone: input.phone,
                    status: OrderStatus.PENDING,
                    financialStatus: 'pending',
                    subtotal,
                    discount,
                    shippingCost: finalShipping,
                    tax,
                    total,
                    shippingAddressId,
                    discountCodeId,
                    customerNotes: input.customerNotes,
                },
            });

            // 5. Create Order Items
            for (const item of cart.items) {
                await tx.orderItem.create({
                    data: {
                        orderId: createdOrder.id,
                        variantId: item.variantId,
                        productTitle: item.variant.product.title,
                        variantTitle: item.variant.title,
                        sku: item.variant.sku,
                        quantity: item.quantity,
                        price: item.variant.price,
                        originalPrice: item.variant.compareAtPrice || item.variant.price,
                        imageUrl: item.variant.product.images[0]?.url,
                    },
                });
            }

            return {
                order: createdOrder,
                rollbackData: { items: rollbackItems, discountId: usedDiscountId }
            };
        });

        // Phase 2: Process mock payment (outside transaction, since it's an external API call)
        let paymentResult;
        try {
            paymentResult = await this.processPayment(input.paymentInfo, total);
        } catch (error) {
            paymentResult = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }

        // Phase 3: Finalize or Rollback Order
        if (!paymentResult.success) {
            // Payment failed: Roll back inventory, discount count, mark order failed
            await prisma.$transaction(async (tx) => {
                for (const item of rollbackData.items) {
                    await tx.productVariant.update({
                        where: { id: item.id },
                        data: { inventoryQty: { increment: item.quantity } },
                    });
                }

                if (rollbackData.discountId) {
                    await tx.discountCode.update({
                        where: { id: rollbackData.discountId },
                        data: { usedCount: { decrement: 1 } },
                    });
                }

                await tx.order.update({
                    where: { id: order.id },
                    data: { status: 'CANCELLED', financialStatus: 'failed', cancelReason: paymentResult.error },
                });
            });

            throw new Error(paymentResult.error || 'Payment failed');
        }

        // Payment succeeded: Mark order paid and clear cart
        await prisma.$transaction(async (tx) => {
            await tx.order.update({
                where: { id: order.id },
                data: { status: OrderStatus.PAID, financialStatus: 'paid' },
            });

            await tx.payment.create({
                data: {
                    orderId: order.id,
                    amount: total,
                    status: PaymentStatus.COMPLETED,
                    provider: 'mock',
                    transactionId: paymentResult.transactionId,
                    cardLast4: input.paymentInfo.cardNumber.slice(-4),
                    cardBrand: this.detectCardBrand(input.paymentInfo.cardNumber),
                },
            });

            await tx.cartItem.deleteMany({ where: { cartId } });
        });


        // Get the full order with all data for email
        const fullOrder = await this.findById(order.id);

        // Send order confirmation email
        const emailData = {
            orderNumber: fullOrder.orderNumber,
            email: input.email,
            customerName: input.shippingAddress.firstName,
            items: fullOrder.items.map((item: { productTitle: string; variantTitle: string | null; quantity: number; price: { toString(): string } }) => ({
                productTitle: item.productTitle,
                variantTitle: item.variantTitle,
                quantity: item.quantity,
                price: parseFloat(item.price.toString()),
            })),
            subtotal,
            discount,
            shippingCost: finalShipping,
            tax,
            total,
            shippingAddress: input.shippingAddress,
        };

        // Send email asynchronously (don't block checkout response)
        emailService.sendOrderConfirmation(emailData).catch((err) => {
            console.error('[EMAIL] Failed to send order confirmation:', err);
        });

        return fullOrder;
    }

    /**
     * Apply discount code
     */
    async applyDiscount(code: string, subtotal: number, customerId?: string) {
        const discountCode = await prisma.discountCode.findUnique({
            where: { code: code.toUpperCase() },
        });

        if (!discountCode) {
            throw new Error('Invalid discount code');
        }

        if (!discountCode.active) {
            throw new Error('Discount code is no longer active');
        }

        const now = new Date();
        if (discountCode.startsAt && discountCode.startsAt > now) {
            throw new Error('Discount code is not yet active');
        }

        if (discountCode.endsAt && discountCode.endsAt < now) {
            throw new Error('Discount code has expired');
        }

        if (discountCode.maxUses && discountCode.usedCount >= discountCode.maxUses) {
            throw new Error('Discount code has reached its usage limit');
        }

        if (discountCode.usesPerCustomer && customerId) {
            const pastUses = await prisma.order.count({
                where: {
                    customerId,
                    discountCodeId: discountCode.id,
                    status: { notIn: ['CANCELLED', 'REFUNDED'] }
                }
            });
            if (pastUses >= discountCode.usesPerCustomer) {
                throw new Error('You have already used this discount code the maximum number of times');
            }
        }

        if (discountCode.minOrderAmount && subtotal < parseFloat(discountCode.minOrderAmount.toString())) {
            throw new Error(`Minimum order amount of $${discountCode.minOrderAmount} required`);
        }

        let discount = 0;
        const value = parseFloat(discountCode.value.toString());

        switch (discountCode.type) {
            case 'PERCENTAGE':
                discount = subtotal * (value / 100);
                break;
            case 'FIXED_AMOUNT':
                discount = Math.min(value, subtotal);
                break;
            case 'FREE_SHIPPING':
                // Will be handled in checkout
                discount = 0;
                break;
        }

        return {
            discount,
            discountCodeId: discountCode.id,
            type: discountCode.type,
        };
    }

    /**
     * Find order by ID
     */
    async findById(id: string) {
        const order = await prisma.order.findUnique({
            where: { id },
            include: this.getFullInclude(),
        });

        if (!order) throw new Error('Order not found');
        return order;
    }

    /**
     * Find order by order number
     */
    async findByOrderNumber(orderNumber: string) {
        const order = await prisma.order.findUnique({
            where: { orderNumber },
            include: this.getFullInclude(),
        });

        if (!order) throw new Error('Order not found');
        return order;
    }

    /**
     * List orders
     */
    async findMany(query: {
        page?: number;
        limit?: number;
        status?: OrderStatus;
        customerId?: string;
        startDate?: string;
        endDate?: string;
    }) {
        const { page = 1, limit = 20, status, customerId, startDate, endDate } = query;

        const where: Record<string, unknown> = {
            ...(status && { status }),
            ...(customerId && { customerId }),
        };

        // Build createdAt filter properly to handle both startDate and endDate
        const createdAtFilter: { gte?: Date; lte?: Date } = {};
        if (startDate) {
            const parsedStart = new Date(startDate);
            if (!isNaN(parsedStart.getTime())) {
                createdAtFilter.gte = parsedStart;
            }
        }
        if (endDate) {
            const parsedEnd = new Date(endDate);
            if (!isNaN(parsedEnd.getTime())) {
                createdAtFilter.lte = parsedEnd;
            }
        }
        if (Object.keys(createdAtFilter).length > 0) {
            where.createdAt = createdAtFilter;
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    items: true,
                    customer: { include: { user: { select: { name: true, email: true } } } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.order.count({ where }),
        ]);

        return {
            orders,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    /**
     * Update order status
     */
    async updateStatus(id: string, status: OrderStatus, notes?: string) {
        return prisma.order.update({
            where: { id },
            data: {
                status,
                notes: notes || undefined,
                ...(status === OrderStatus.CANCELLED && { cancelledAt: new Date() }),
            },
            include: this.getFullInclude(),
        });
    }

    /**
     * Add fulfillment info
     */
    async addFulfillment(orderId: string, data: {
        carrier?: string;
        trackingNumber?: string;
        trackingUrl?: string;
        estimatedDelivery?: string;
    }) {
        await prisma.fulfillment.create({
            data: {
                orderId,
                carrier: data.carrier,
                trackingNumber: data.trackingNumber,
                trackingUrl: data.trackingUrl,
                estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery) : null,
                shippedAt: new Date(),
            },
        });

        return prisma.order.update({
            where: { id: orderId },
            data: {
                status: OrderStatus.SHIPPED,
                fulfillmentStatus: 'fulfilled',
            },
            include: this.getFullInclude(),
        });
    }

    /**
     * Get customer orders by user ID
     * First finds the Customer record, then queries orders by Customer.id
     */
    async getCustomerOrders(userId: string, page = 1, limit = 10) {
        // Order.customerId references Customer.id, not User.id
        // We need to find the Customer record first
        const customer = await prisma.customer.findUnique({
            where: { userId },
        });

        if (!customer) {
            // User has no customer profile yet - return empty
            return {
                orders: [],
                pagination: { page, limit, total: 0, totalPages: 0 },
            };
        }

        return this.findMany({ customerId: customer.id, page, limit });
    }

    /**
     * Get revenue stats - efficient server-side aggregation
     */
    async getRevenueStats() {
        const result = await prisma.order.aggregate({
            _sum: { total: true },
            where: {
                status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
            },
        });

        return {
            totalRevenue: result._sum.total ? parseFloat(result._sum.total.toString()) : 0,
        };
    }

    /**
     * Get total order count
     */
    async getOrderCount() {
        return prisma.order.count();
    }

    /**
     * Mock payment processor
     */
    private async processPayment(
        paymentInfo: { cardNumber: string; expiryMonth: string; expiryYear: string; cvv: string },
        amount: number
    ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

        const lastDigit = parseInt(paymentInfo.cardNumber.replace(/\D/g, '').slice(-1), 10);

        // Test card behavior:
        // Ends in 1: Always success
        // Ends in 2: Always declined
        // Other: 80% success rate

        if (lastDigit === 2) {
            return { success: false, error: 'Card declined' };
        }

        if (lastDigit !== 1 && Math.random() > 0.8) {
            return { success: false, error: 'Payment processing failed' };
        }

        return {
            success: true,
            transactionId: `mock_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        };
    }

    private detectCardBrand(cardNumber: string): string {
        const number = cardNumber.replace(/\D/g, '');
        if (number.startsWith('4')) return 'Visa';
        if (/^5[1-5]/.test(number)) return 'Mastercard';
        if (/^3[47]/.test(number)) return 'Amex';
        if (/^6(?:011|5)/.test(number)) return 'Discover';
        return 'Unknown';
    }

    private getFullInclude() {
        return {
            items: {
                include: {
                    variant: {
                        include: {
                            product: { include: { images: { where: { deletedAt: null }, take: 1 } } },
                        },
                    },
                },
            },
            customer: true, // Include full customer to get userId for owner check
            shippingAddress: true,
            payments: true,
            fulfillments: true,
            discountCode: true,
        };
    }
}

export const orderService = new OrderService();
