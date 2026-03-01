import { z } from 'zod';

// Common schemas
const decimalSchema = z.union([z.string(), z.number()]).transform((val) =>
    typeof val === 'string' ? parseFloat(val) : val
);

const positiveDecimal = decimalSchema.refine((val) => val >= 0, 'Must be a positive number');

// Product schemas
export const createProductSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255),
    slug: z.string().optional(),
    description: z.string().min(1, 'Description is required'),
    shortDescription: z.string().optional().nullable(),
    status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).default('DRAFT'),
    featured: z.boolean().default(false),
    vendor: z.string().optional().nullable(),
    productType: z.string().optional().nullable(),
    seoTitle: z.string().optional().nullable(),
    seoDescription: z.string().optional().nullable(),
    options: z.array(z.object({
        name: z.string().min(1),
        values: z.array(z.string().min(1)).min(1),
    })).optional(),
    variants: z.array(z.object({
        title: z.string().optional(),
        sku: z.string().optional(),
        barcode: z.string().optional(),
        price: positiveDecimal,
        compareAtPrice: positiveDecimal.optional(),
        costPrice: positiveDecimal.optional(),
        inventoryQty: z.number().int().min(0).default(0),
        weight: positiveDecimal.optional(),
        weightUnit: z.string().default('kg'),
        optionValues: z.array(z.string()).optional(),
    })).min(1, 'At least one variant is required'),
    images: z.array(z.object({
        url: z.string().url(),
        alt: z.string().optional(),
        position: z.number().int().min(0).optional(),
    })).optional(),
    tags: z.array(z.string()).optional(),
    categoryIds: z.array(z.string()).optional(),
    collectionIds: z.array(z.string()).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
    page: z.string().optional().transform((val) => parseInt(val || '1', 10)),
    limit: z.string().optional().transform((val) => parseInt(val || '20', 10)),
    search: z.string().optional(),
    status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
    category: z.string().optional(),
    collection: z.string().optional(),
    tag: z.string().optional(),
    minPrice: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
    maxPrice: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
    sort: z.enum(['title', 'price', 'createdAt', 'updatedAt', 'featured']).optional().default('createdAt'),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
    featured: z.string().optional().transform((val) => val === 'true' ? true : val === 'false' ? false : undefined),
});

export const productIdSchema = z.object({
    id: z.string().min(1, 'Product ID is required'),
});

export const productSlugSchema = z.object({
    slug: z.string().min(1, 'Product slug is required'),
});

// Variant schemas
export const updateVariantSchema = z.object({
    title: z.string().optional(),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    price: positiveDecimal.optional(),
    compareAtPrice: positiveDecimal.optional(),
    costPrice: positiveDecimal.optional(),
    inventoryQty: z.number().int().min(0).optional(),
    weight: positiveDecimal.optional(),
});

export const updateInventorySchema = z.object({
    variantId: z.string().min(1),
    quantity: z.number().int(),
    reason: z.string().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;

export const inventoryUpdateSchema = z.object({
    variantId: z.string().min(1),
    quantity: z.number().int().min(0, 'Quantity must be non-negative'),
});

export const inventoryAdjustmentSchema = z.object({
    variantId: z.string().min(1),
    adjustment: z.number().int(),
});

