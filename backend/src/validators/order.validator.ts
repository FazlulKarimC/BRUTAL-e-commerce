import { z } from 'zod';

const shippingAddressSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    company: z.string().optional(),
    line1: z.string().min(1, 'Address is required'),
    line2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().default('US'),
    phone: z.string().optional(),
});

/**
 * Payment info schema - MOCK IMPLEMENTATION FOR DEVELOPMENT ONLY.
 * 
 * ⚠️ PRODUCTION WARNING: Before going live, replace this with tokenized payments!
 * Raw card data (cardNumber, CVV, expiry) must NEVER be collected in production.
 * Use Stripe Elements, PayPal SDK, or similar PCI-compliant solutions.
 */
const paymentInfoSchema = z.object({
    // For mock payments - accepts any card-like format for testing
    cardNumber: z.string().min(1, 'Card number is required'),
    expiryMonth: z.string().min(1, 'Expiry month is required'),
    expiryYear: z.string().min(1, 'Expiry year is required'),
    cvv: z.string().min(1, 'CVV is required'),
    cardholderName: z.string().min(1, 'Cardholder name is required'),
});

// Base checkout schema
const checkoutBaseSchema = z.object({
    email: z.string().email('Invalid email'),
    phone: z.string().optional(),
    shippingAddress: shippingAddressSchema,
    billingAddress: shippingAddressSchema.optional(),
    sameAsShipping: z.boolean().default(true),
    paymentInfo: paymentInfoSchema,
    discountCode: z.string().optional(),
    customerNotes: z.string().optional(),
    saveAddress: z.boolean().default(true),
    createAccount: z.boolean().default(false),
    password: z.string().min(8, 'Password must be at least 8 characters').optional(),
});

// Add conditional validation for createAccount + password
export const checkoutSchema = checkoutBaseSchema.superRefine((data, ctx) => {
    // When createAccount is true, password is required
    if (data.createAccount && !data.password) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Password is required when creating an account',
            path: ['password'],
        });
    }

    // Also validate password length when createAccount is true (belt and suspenders)
    if (data.createAccount && data.password && data.password.length < 8) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Password must be at least 8 characters',
            path: ['password'],
        });
    }
});

export const updateOrderStatusSchema = z.object({
    status: z.enum(['PENDING', 'PROCESSING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
    notes: z.string().optional(),
});

export const addFulfillmentSchema = z.object({
    carrier: z.string().optional(),
    trackingNumber: z.string().optional(),
    trackingUrl: z.string().url().optional(),
    estimatedDelivery: z.string().datetime().optional(),
});

export const cancelOrderSchema = z.object({
    reason: z.string().min(1, 'Cancellation reason is required'),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type AddFulfillmentInput = z.infer<typeof addFulfillmentSchema>;

