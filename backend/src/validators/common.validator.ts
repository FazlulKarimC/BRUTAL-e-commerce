import { z } from 'zod';

// Pagination
export const paginationSchema = z.object({
    page: z.string().optional().transform((val) => { const n = parseInt(val || '1', 10); return isNaN(n) ? 1 : Math.max(1, n); }),
    limit: z.string().optional().transform((val) => { const n = parseInt(val || '20', 10); return isNaN(n) ? 20 : Math.min(100, Math.max(1, n)); }),
});

// ID param
export const idParamSchema = z.object({
    id: z.string().min(1, 'ID is required'),
});

// Slug param
export const slugParamSchema = z.object({
    slug: z.string().min(1, 'Slug is required'),
});

// Cart schemas
export const addToCartSchema = z.object({
    variantId: z.string().min(1, 'Variant ID is required'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
});

export const updateCartItemSchema = z.object({
    quantity: z.number().int().min(0, 'Quantity cannot be negative'),
});

// Address schemas
export const addressSchema = z.object({
    label: z.string().optional(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    company: z.string().optional(),
    line1: z.string().min(1, 'Address line 1 is required'),
    line2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().default('US'),
    phone: z.string().optional(),
    isDefault: z.boolean().default(false),
});

// Customer update schema (admin use)
export const updateCustomerSchema = z.object({
    notes: z.string().optional(),
    phone: z.string().regex(/^\+?[0-9\s\-()]+$/, 'Invalid phone number format').optional(),
});

// Collection schemas
export const createCollectionSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255),
    slug: z.string().optional(),
    description: z.string().optional(),
    image: z.string().url().optional(),
    featured: z.boolean().default(false),
    sortOrder: z.enum(['MANUAL', 'BEST_SELLING', 'PRICE_ASC', 'PRICE_DESC', 'NEWEST', 'OLDEST']).default('MANUAL'),
    productIds: z.array(z.string()).optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
});

export const updateCollectionSchema = createCollectionSchema.partial();

export const addProductToCollectionSchema = z.object({
    productId: z.string().min(1, 'Product ID is required'),
    position: z.number().int().min(0, 'Position must be a non-negative integer').optional(),
});

// Category schemas
export const createCategorySchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    slug: z.string().optional(),
    description: z.string().optional(),
    image: z.string().url().optional(),
    parentId: z.string().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// Discount schemas - base schema without refinements
const discountBaseSchema = z.object({
    code: z.string().min(1, 'Code is required').max(50).transform((val) => val.toUpperCase()),
    title: z.string().optional(),
    type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING']),
    value: z.number().min(0, 'Value must be positive'),
    minOrderAmount: z.number().min(0).optional(),
    maxUses: z.number().int().min(1).optional(),
    usesPerCustomer: z.number().int().min(1).optional(),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional(),
    active: z.boolean().default(true),
});

// Refinement function for discount validation
const discountRefinement = (data: { type?: string; value?: number; startsAt?: string; endsAt?: string }, ctx: z.RefinementCtx) => {
    // Validate percentage value is between 0-100
    if (data.type === 'PERCENTAGE' && data.value !== undefined && data.value > 100) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Percentage discount value cannot exceed 100',
            path: ['value'],
        });
    }

    // Validate endsAt is after startsAt when both are provided
    if (data.startsAt && data.endsAt) {
        const startDate = new Date(data.startsAt);
        const endDate = new Date(data.endsAt);

        if (isFinite(startDate.getTime()) && isFinite(endDate.getTime())) {
            if (endDate <= startDate) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'endsAt must be after startsAt',
                    path: ['endsAt'],
                });
            }
        }
    }
};

export const createDiscountSchema = discountBaseSchema.superRefine(discountRefinement);

export const updateDiscountSchema = discountBaseSchema
    .partial()
    .omit({ code: true })
    .superRefine(discountRefinement);

export const applyDiscountSchema = z.object({
    code: z.string().min(1, 'Discount code is required'),
});

// Review schemas
export const createReviewSchema = z.object({
    productId: z.string().min(1, 'Product ID is required'),
    rating: z.number().int().min(1).max(5),
    title: z.string().optional(),
    content: z.string().optional(),
});

export const updateReviewSchema = z.object({
    rating: z.number().int().min(1).max(5).optional(),
    title: z.string().optional(),
    content: z.string().optional(),
    approved: z.boolean().optional(),
});

// Order query
export const orderQuerySchema = z.object({
    page: z.string().optional().transform((val) => { const n = parseInt(val || '1', 10); return isNaN(n) ? 1 : n; }),
    limit: z.string().optional().transform((val) => { const n = parseInt(val || '20', 10); return isNaN(n) ? 20 : n; }),
    status: z.enum(['PENDING', 'PROCESSING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']).optional(),
    customerId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

// Type exports
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateDiscountInput = z.infer<typeof createDiscountSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
