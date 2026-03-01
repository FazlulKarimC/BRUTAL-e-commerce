import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { validateBody, validateParams } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { requireStaff } from '../middleware/requireRole';
import { createCategorySchema, updateCategorySchema, slugParamSchema, idParamSchema } from '../validators/common.validator';
import { generateSlug, generateUniqueSlug } from '../utils/helpers';

const router = Router();

// ==================== PUBLIC ROUTES ====================

// List categories (hierarchical)
router.get(
    '/',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const categories = await prisma.category.findMany({
                where: { parentId: null },
                include: {
                    children: {
                        include: {
                            children: true,
                            _count: { select: { products: true } },
                        },
                    },
                    _count: { select: { products: true } },
                },
                orderBy: { position: 'asc' },
            });

            res.json(categories);
        } catch (error) {
            next(error);
        }
    }
);

// Get category by slug with products
router.get(
    '/slug/:slug',
    validateParams(slugParamSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const category = await prisma.category.findUnique({
                where: { slug: req.params.slug },
                include: {
                    children: true,
                    parent: true,
                    products: {
                        where: { product: { status: 'ACTIVE', deletedAt: null } },
                        include: {
                            product: {
                                include: {
                                    variants: { take: 1, orderBy: { position: 'asc' } },
                                    images: { where: { deletedAt: null }, take: 1, orderBy: { position: 'asc' } },
                                },
                            },
                        },
                    },
                },
            });

            if (!category) {
                res.status(404).json({ error: 'Category not found' });
                return;
            }

            res.json({
                ...category,
                products: category.products.map((p) => p.product),
            });
        } catch (error) {
            next(error);
        }
    }
);

// ==================== ADMIN ROUTES ====================

// Get category by ID (admin)
router.get(
    '/:id',
    authenticate,
    requireStaff,
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const category = await prisma.category.findUnique({
                where: { id: req.params.id },
                include: {
                    children: true,
                    parent: true,
                    _count: { select: { products: true } },
                },
            });

            if (!category) {
                res.status(404).json({ error: 'Category not found' });
                return;
            }

            res.json(category);
        } catch (error) {
            next(error);
        }
    }
);

// Create category (handles race condition with optimistic concurrency)
router.post(
    '/',
    authenticate,
    requireStaff,
    validateBody(createCategorySchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const slug = (req.body.slug || generateSlug(req.body.name)).trim().toLowerCase();

            const categoryData = {
                name: req.body.name,
                slug,
                description: req.body.description,
                image: req.body.image,
                parentId: req.body.parentId,
            };

            let category;
            try {
                category = await prisma.category.create({ data: categoryData });
            } catch (err: any) {
                // Handle unique constraint violation (race condition)
                if (err.code === 'P2002') {
                    categoryData.slug = generateUniqueSlug(req.body.name);
                    category = await prisma.category.create({ data: categoryData });
                } else {
                    throw err;
                }
            }

            res.status(201).json(category);
        } catch (error) {
            next(error);
        }
    }
);

// Update category (with slug collision check)
router.patch(
    '/:id',
    authenticate,
    requireStaff,
    validateParams(idParamSchema),
    validateBody(updateCategorySchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const updateData = { ...req.body };

            // Check for slug collision if slug is being updated
            if (updateData.slug) {
                const normalizedSlug = updateData.slug.trim().toLowerCase();
                updateData.slug = normalizedSlug;

                const existingCategory = await prisma.category.findFirst({
                    where: {
                        slug: normalizedSlug,
                        NOT: { id: req.params.id },
                    },
                });

                if (existingCategory) {
                    res.status(409).json({
                        error: 'Slug already in use',
                        message: `The slug "${normalizedSlug}" is already used by another category.`
                    });
                    return;
                }
            }

            const category = await prisma.category.update({
                where: { id: req.params.id },
                data: updateData,
            });

            res.json(category);
        } catch (error) {
            next(error);
        }
    }
);

// Delete category
router.delete(
    '/:id',
    authenticate,
    requireStaff,
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Check for children
            const hasChildren = await prisma.category.count({
                where: { parentId: req.params.id },
            });

            if (hasChildren > 0) {
                res.status(400).json({ error: 'Cannot delete category with subcategories' });
                return;
            }

            await prisma.category.delete({ where: { id: req.params.id } });
            res.json({ message: 'Category deleted' });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
