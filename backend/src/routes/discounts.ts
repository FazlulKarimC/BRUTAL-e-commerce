import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { validateBody, validateParams } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { requireStaff } from '../middleware/requireRole';
import { createDiscountSchema, updateDiscountSchema, idParamSchema } from '../validators/common.validator';

const router = Router();

// All discount management routes are admin only

// List all discounts
router.get(
    '/',
    authenticate,
    requireStaff,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const search = (req.query.search as string) || '';
            const skip = (page - 1) * limit;

            const where = search
                ? { code: { contains: search, mode: 'insensitive' as const } }
                : {};

            const [discounts, total] = await Promise.all([
                prisma.discountCode.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        _count: { select: { orders: true } },
                    },
                    skip,
                    take: limit,
                }),
                prisma.discountCode.count({ where }),
            ]);

            res.json({
                discounts,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Get discount by ID
router.get(
    '/:id',
    authenticate,
    requireStaff,
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const discount = await prisma.discountCode.findUnique({
                where: { id: req.params.id },
                include: {
                    orders: {
                        take: 10,
                        orderBy: { createdAt: 'desc' },
                        select: {
                            id: true,
                            orderNumber: true,
                            total: true,
                            createdAt: true,
                        },
                    },
                },
            });

            if (!discount) {
                res.status(404).json({ error: 'Discount not found' });
                return;
            }

            res.json(discount);
        } catch (error) {
            next(error);
        }
    }
);

// Create discount
router.post(
    '/',
    authenticate,
    requireStaff,
    validateBody(createDiscountSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Check if code already exists
            const existing = await prisma.discountCode.findUnique({
                where: { code: req.body.code },
            });

            if (existing) {
                res.status(400).json({ error: 'Discount code already exists' });
                return;
            }

            const discount = await prisma.discountCode.create({
                data: {
                    code: req.body.code,
                    title: req.body.title,
                    type: req.body.type,
                    value: req.body.value,
                    minOrderAmount: req.body.minOrderAmount,
                    maxUses: req.body.maxUses,
                    usesPerCustomer: req.body.usesPerCustomer,
                    startsAt: req.body.startsAt ? new Date(req.body.startsAt) : null,
                    endsAt: req.body.endsAt ? new Date(req.body.endsAt) : null,
                    active: req.body.active,
                },
            });

            res.status(201).json(discount);
        } catch (error) {
            next(error);
        }
    }
);

// Update discount (with proper 404 handling)
router.patch(
    '/:id',
    authenticate,
    requireStaff,
    validateParams(idParamSchema),
    validateBody(updateDiscountSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const discount = await prisma.discountCode.update({
                where: { id: req.params.id },
                data: {
                    ...req.body,
                    startsAt: req.body.startsAt ? new Date(req.body.startsAt) : undefined,
                    endsAt: req.body.endsAt ? new Date(req.body.endsAt) : undefined,
                },
            });

            res.json(discount);
        } catch (error: any) {
            // Handle "Record not found" error with proper 404
            if (error.code === 'P2025') {
                res.status(404).json({ error: 'Discount not found' });
                return;
            }
            next(error);
        }
    }
);

// Delete discount (with proper 404 handling)
router.delete(
    '/:id',
    authenticate,
    requireStaff,
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Check if discount exists and has been used
            const discount = await prisma.discountCode.findUnique({
                where: { id: req.params.id },
                include: { _count: { select: { orders: true } } },
            });

            // Return 404 if discount not found
            if (!discount) {
                res.status(404).json({ error: 'Discount not found' });
                return;
            }

            // Soft delete if discount has been used in orders
            if (discount._count.orders > 0) {
                await prisma.discountCode.update({
                    where: { id: req.params.id },
                    data: { active: false },
                });
                res.json({ message: 'Discount deactivated (has been used in orders)' });
                return;
            }

            // Hard delete if never used
            await prisma.discountCode.delete({ where: { id: req.params.id } });
            res.json({ message: 'Discount deleted' });
        } catch (error) {
            next(error);
        }
    }
);

// Toggle discount active status
router.post(
    '/:id/toggle',
    authenticate,
    requireStaff,
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const discount = await prisma.discountCode.findUnique({
                where: { id: req.params.id },
            });

            if (!discount) {
                res.status(404).json({ error: 'Discount not found' });
                return;
            }

            const updated = await prisma.discountCode.update({
                where: { id: req.params.id },
                data: { active: !discount.active },
            });

            res.json(updated);
        } catch (error) {
            next(error);
        }
    }
);

export default router;
