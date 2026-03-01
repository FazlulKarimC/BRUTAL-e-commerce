import { Router, Request, Response, NextFunction } from 'express';
import { orderService } from '../services/order.service';
import { emailService } from '../services/email.service';
import { validateBody, validateParams, validateQuery } from '../middleware/validate';
import { authenticate, optionalAuth } from '../middleware/auth';
import { requireStaff } from '../middleware/requireRole';
import {
  idParamSchema,
  orderQuerySchema,
} from '../validators/common.validator';
import {
  updateOrderStatusSchema,
  addFulfillmentSchema,
  cancelOrderSchema,
} from '../validators/order.validator';
import { z } from 'zod';

const router = Router();

// ==================== CUSTOMER ROUTES ====================

// Get order by order number (public - for thank you page / order tracking)
// Guests must supply ?email= matching the order email to get full details
router.get(
  '/number/:orderNumber',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await orderService.findByOrderNumber(req.params.orderNumber);

      // Check if user is owner or staff
      const isOwner = req.user && order.customer?.userId === req.user.userId;
      const isStaff = req.user?.role === 'ADMIN' || req.user?.role === 'STAFF';

      if (!isOwner && !isStaff) {
        // Guest access: require email to match in order to reveal full details
        const providedEmail = (req.query.email as string | undefined)?.trim().toLowerCase();
        const orderEmail = order.email?.toLowerCase();

        if (!providedEmail || providedEmail !== orderEmail) {
          // Return 404 rather than minimal info — prevents enumeration attacks
          res.status(404).json({ error: 'Order not found' });
          return;
        }
      }

      res.json(order);
    } catch (error) {
      if (error instanceof Error && error.message === 'Order not found') {
        res.status(404).json({ error: 'Order not found' });
        return;
      }
      next(error);
    }
  }
);

// Get my orders (authenticated customer)
router.get(
  '/my-orders',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await orderService.getCustomerOrders(req.user!.userId, page, limit);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Get analytics data (admin/staff) - MUST be before /:id route
router.get(
  '/analytics/dashboard',
  authenticate,
  requireStaff,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { prisma } = await import('../config/database');

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      const [
        currentMonthRevenue,
        lastMonthRevenue,
        totalOrders,
        pendingOrders,
        totalCustomers,
        topProducts,
        recentOrders,
      ] = await Promise.all([
        prisma.order.aggregate({
          where: {
            createdAt: { gte: startOfMonth },
            status: { notIn: ['CANCELLED', 'REFUNDED'] },
          },
          _sum: { total: true },
        }),
        prisma.order.aggregate({
          where: {
            createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
            status: { notIn: ['CANCELLED', 'REFUNDED'] },
          },
          _sum: { total: true },
        }),
        prisma.order.count(),
        prisma.order.count({ where: { status: 'PENDING' } }),
        prisma.customer.count(),
        prisma.orderItem.groupBy({
          by: ['productTitle'],
          _sum: { quantity: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 5,
        }),
        prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
            email: true,
          },
        }),
      ]);

      const currentRevenue = Number(currentMonthRevenue._sum.total || 0);
      const lastRevenue = Number(lastMonthRevenue._sum.total || 0);
      const revenueGrowth = lastRevenue > 0
        ? ((currentRevenue - lastRevenue) / lastRevenue) * 100
        : 0;

      res.json({
        revenue: {
          currentMonth: currentRevenue,
          lastMonth: lastRevenue,
          growth: Math.round(revenueGrowth * 10) / 10,
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
        },
        customers: {
          total: totalCustomers,
        },
        topProducts: topProducts.map(p => ({
          title: p.productTitle,
          sold: p._sum.quantity || 0,
        })),
        recentOrders,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get single order (authenticated - must be own order or admin)
router.get(
  '/:id',
  authenticate,
  validateParams(idParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await orderService.findById(req.params.id);

      // Check if user owns this order or is admin/staff
      // order.customer?.userId is the User ID, order.customerId is Customer ID
      const isOwner = order.customer?.userId === req.user!.userId;
      const isStaff = req.user!.role === 'ADMIN' || req.user!.role === 'STAFF';

      if (!isOwner && !isStaff) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      res.json(order);
    } catch (error) {
      if (error instanceof Error && error.message === 'Order not found') {
        res.status(404).json({ error: 'Order not found' });
        return;
      }
      next(error);
    }
  }
);

// ==================== ADMIN ROUTES ====================

// Get dashboard stats (admin/staff) - server-side aggregation
router.get(
  '/stats',
  authenticate,
  requireStaff,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Use Prisma aggregate for efficient server-side calculation
      const [revenueResult, orderCount] = await Promise.all([
        orderService.getRevenueStats(),
        orderService.getOrderCount(),
      ]);

      res.json({
        totalRevenue: revenueResult.totalRevenue,
        totalOrders: orderCount,
        currency: 'USD',
      });
    } catch (error) {
      next(error);
    }
  }
);

// List all orders (admin/staff)
router.get(
  '/',
  authenticate,
  requireStaff,
  validateQuery(orderQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await orderService.findMany(req.query as any);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Update order status (admin/staff)
router.patch(
  '/:id/status',
  authenticate,
  requireStaff,
  validateParams(idParamSchema),
  validateBody(updateOrderStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await orderService.updateStatus(
        req.params.id,
        req.body.status,
        req.body.notes
      );
      res.json(order);
    } catch (error) {
      if (error instanceof Error && error.message === 'Order not found') {
        res.status(404).json({ error: 'Order not found' });
        return;
      }
      next(error);
    }
  }
);

// Add fulfillment/shipping info (admin/staff)
router.post(
  '/:id/fulfillment',
  authenticate,
  requireStaff,
  validateParams(idParamSchema),
  validateBody(addFulfillmentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await orderService.addFulfillment(req.params.id, req.body);

      // Send shipping notification email
      const customerName = order.shippingAddress
        ? order.shippingAddress.firstName
        : order.email.split('@')[0];

      emailService.sendShippingNotification({
        orderNumber: order.orderNumber,
        email: order.email,
        customerName,
        carrier: req.body.carrier,
        trackingNumber: req.body.trackingNumber,
        trackingUrl: req.body.trackingUrl,
        estimatedDelivery: req.body.estimatedDelivery,
      }).catch((err) => {
        console.error('[EMAIL] Failed to send shipping notification:', err);
      });

      res.json(order);
    } catch (error) {
      next(error);
    }
  }
);

// Cancel order (admin/staff)
router.post(
  '/:id/cancel',
  authenticate,
  requireStaff,
  validateParams(idParamSchema),
  validateBody(cancelOrderSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await orderService.updateStatus(
        req.params.id,
        'CANCELLED',
        req.body.reason
      );
      res.json(order);
    } catch (error) {
      next(error);
    }
  }
);

// Process refund (admin/staff)
const refundSchema = z.object({
  reason: z.string().optional(),
});

router.post(
  '/:id/refund',
  authenticate,
  requireStaff,
  validateParams(idParamSchema),
  validateBody(refundSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await orderService.findById(req.params.id);

      // Check if order can be refunded
      if (order.financialStatus === 'refunded') {
        res.status(400).json({ error: 'Order already refunded' });
        return;
      }

      // Process mock refund atomically using transaction
      const { prisma } = await import('../config/database');

      // Build notes - append refund reason to existing notes
      const newNotes = req.body.reason
        ? `${order.notes ? order.notes + '\n' : ''}Refund reason: ${req.body.reason}`
        : order.notes;

      // Use transaction to ensure both operations succeed or fail together
      const updatedOrder = await prisma.$transaction(async (tx) => {
        // Create refund payment record
        await tx.payment.create({
          data: {
            orderId: order.id,
            amount: order.total,
            status: 'REFUNDED',
            provider: 'mock',
            transactionId: `REFUND-${Date.now()}`,
          },
        });

        // Update order status
        return tx.order.update({
          where: { id: req.params.id },
          data: {
            status: 'REFUNDED',
            financialStatus: 'refunded',
            notes: newNotes,
          },
          include: {
            items: true,
            payments: true,
            fulfillments: true,
            shippingAddress: true,
          },
        });
      });

      res.json(updatedOrder);
    } catch (error) {
      if (error instanceof Error && error.message === 'Order not found') {
        res.status(404).json({ error: 'Order not found' });
        return;
      }
      next(error);
    }
  }
);

export default router;

