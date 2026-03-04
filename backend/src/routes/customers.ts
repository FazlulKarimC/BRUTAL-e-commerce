import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { requireStaff } from '../middleware/requireRole';
import { validateParams, validateBody } from '../middleware/validate';
import { idParamSchema, paginationSchema, updateCustomerSchema } from '../validators/common.validator';

const router = Router();

// ==================== ADMIN ROUTES ====================

// List all customers
router.get(
  '/',
  authenticate,
  requireStaff,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;

      const where = search
        ? {
          user: {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          },
        }
        : {};

      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          include: {
            user: { select: { id: true, name: true, email: true, createdAt: true } },
            _count: { select: { orders: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.customer.count({ where }),
      ]);

      res.json({
        customers,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== CUSTOMER ADDRESS ROUTES ====================
// Address management (CRUD) is handled by the dedicated addresses router.
// See: routes/addresses.ts (mounted at /api/addresses)

// ==================== ADMIN ROUTES WITH DYNAMIC :id ====================

// Get customer details
router.get(
  '/:id',
  authenticate,
  requireStaff,
  validateParams(idParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: req.params.id },
        include: {
          user: { select: { id: true, name: true, email: true, createdAt: true } },
          addresses: true,
          orders: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              items: true,
            },
          },
          _count: { select: { orders: true, reviews: true } },
        },
      });

      if (!customer) {
        res.status(404).json({ error: 'Customer not found' });
        return;
      }

      // Calculate total spent
      const totalSpent = await prisma.order.aggregate({
        where: { customerId: customer.id, status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] } },
        _sum: { total: true },
      });

      res.json({
        ...customer,
        totalSpent: totalSpent._sum.total || 0,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update customer notes
router.patch(
  '/:id',
  authenticate,
  requireStaff,
  validateParams(idParamSchema),
  validateBody(updateCustomerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customer = await prisma.customer.update({
        where: { id: req.params.id },
        data: {
          notes: req.body.notes,
          phone: req.body.phone,
        },
      });

      res.json(customer);
    } catch (error: unknown) {
      // Handle Prisma P2025 "Record not found" error
      if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'P2025') {
        res.status(404).json({ error: 'Customer not found' });
        return;
      }
      next(error);
    }
  }
);

export default router;
