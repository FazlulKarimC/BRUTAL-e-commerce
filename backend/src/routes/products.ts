import { Router, Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service';
import { validateBody, validateQuery, validateParams } from '../middleware/validate';
import { authenticate, optionalAuth } from '../middleware/auth';
import { requireStaff } from '../middleware/requireRole';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  productIdSchema,
  productSlugSchema,
  inventoryUpdateSchema,
  inventoryAdjustmentSchema,
  ProductQueryInput,
} from '../validators/product.validator';

const router = Router();

// ==================== PUBLIC ROUTES ====================

// List products (public)
router.get(
  '/',
  validateQuery(productQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // For public, only show active products
      const validatedQuery = req.validatedQuery as Record<string, unknown>;
      const query = { ...validatedQuery, status: 'ACTIVE' };
      const result = await productService.findMany(query as ProductQueryInput & { status: string });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Get product by slug (public)
router.get(
  '/slug/:slug',
  validateParams(productSlugSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await productService.findBySlug(req.params.slug);
      res.json(product);
    } catch (error) {
      if (error instanceof Error && error.message === 'Product not found') {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      next(error);
    }
  }
);

// Get product by ID (public - only ACTIVE products visible)
router.get(
  '/:id',
  validateParams(productIdSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await productService.findById(req.params.id);
      // Harden: only show ACTIVE products publicly
      if (product.status !== 'ACTIVE') {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      res.json(product);
    } catch (error) {
      if (error instanceof Error && error.message === 'Product not found') {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      next(error);
    }
  }
);

// Get product reviews (public)
router.get(
  '/:id/reviews',
  validateParams(productIdSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await productService.getReviews(req.params.id, page, limit);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// ==================== ADMIN ROUTES ====================

// Create product (admin/staff only)
router.post(
  '/',
  authenticate,
  requireStaff,
  validateBody(createProductSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await productService.create(req.body);
      res.status(201).json(product);
    } catch (error) {
      next(error);
    }
  }
);

// Update product (admin/staff only)
router.patch(
  '/:id',
  authenticate,
  requireStaff,
  validateParams(productIdSchema),
  validateBody(updateProductSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await productService.update(req.params.id, req.body);
      res.json(product);
    } catch (error) {
      if (error instanceof Error && error.message === 'Product not found') {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      next(error);
    }
  }
);

// Delete product (admin/staff only)
router.delete(
  '/:id',
  authenticate,
  requireStaff,
  validateParams(productIdSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await productService.delete(req.params.id);
      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// Update inventory (admin/staff only)
router.patch(
  '/:id/inventory',
  authenticate,
  requireStaff,
  validateBody(inventoryUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { variantId, quantity } = req.body;
      const variant = await productService.updateInventory(variantId, quantity);
      res.json(variant);
    } catch (error) {
      next(error);
    }
  }
);

// Adjust inventory (admin/staff only)
router.post(
  '/:id/inventory/adjust',
  authenticate,
  requireStaff,
  validateBody(inventoryAdjustmentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { variantId, adjustment } = req.body;
      const variant = await productService.adjustInventory(variantId, adjustment);
      res.json(variant);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
