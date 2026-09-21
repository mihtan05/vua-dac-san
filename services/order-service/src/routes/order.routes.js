import express from 'express';
import { OrderController } from '../controllers/order.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// --- INTERNAL API (Service-to-service) ---
router.get('/revenue', OrderController.getShiftRevenue);
router.get('/statistics/revenue', OrderController.getRevenueStatistics);
router.get('/statistics/top-selling', OrderController.getTopSellingProducts);
router.get('/:id/verify-internal', OrderController.verifyOrderInternal);

// --- PUBLIC API (No auth needed) ---
router.get('/promos/available', OrderController.getAvailablePromos);

// All routes require authentication
router.use(authenticate);

// List and Create
router.get('/', requireRole(['NHAN_VIEN', 'QUAN_LY', 'KHACH_HANG']), OrderController.getOrders);
router.post('/', requireRole(['NHAN_VIEN', 'KHACH_HANG']), OrderController.createOrder);

// Promotions CRUD (Manager only)
router.get('/promos', requireRole(['QUAN_LY']), OrderController.getAllPromos);
router.post('/promos', requireRole(['QUAN_LY']), OrderController.createPromo);
router.put('/promos/:code', requireRole(['QUAN_LY']), OrderController.updatePromo);
router.delete('/promos/:code', requireRole(['QUAN_LY']), OrderController.deletePromo);

// Detail, Status, Cancel, Invoice
router.get('/:id', requireRole(['NHAN_VIEN', 'QUAN_LY', 'KHACH_HANG']), OrderController.getOrderById);
router.patch('/:id/status', requireRole(['NHAN_VIEN', 'QUAN_LY']), OrderController.updateOrderStatus);
router.delete('/:id/cancel', requireRole(['NHAN_VIEN', 'QUAN_LY', 'KHACH_HANG']), OrderController.cancelOrder);
router.post('/:id/cancel', requireRole(['NHAN_VIEN', 'QUAN_LY', 'KHACH_HANG']), OrderController.cancelOrder);
router.get('/:id/invoice', requireRole(['NHAN_VIEN', 'QUAN_LY', 'KHACH_HANG']), OrderController.getInvoice);

export default router;
