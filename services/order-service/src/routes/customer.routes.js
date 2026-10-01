import express from 'express';
import { CustomerController } from '../controllers/customer.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// --- PUBLIC ROUTES ---
router.post('/register', CustomerController.registerCustomer);
router.post('/verify-otp', CustomerController.verifyOtp);

// --- PROTECTED ROUTES ---
// Requires authentication and sales or manager role
router.use(authenticate);

// Customers can view their own details/orders? 
// For simplicity, we authorize NHAN_VIEN or QUAN_LY for listing/editing,
// but let's allow KHACH_HANG to check their own detail or orders if needed.
// Inside controller or route:
router.get('/statistics/new', requireRole(['NHAN_VIEN', 'QUAN_LY']), CustomerController.getNewCustomersCount);
router.get('/', requireRole(['NHAN_VIEN', 'QUAN_LY']), CustomerController.getCustomers);
router.post('/', requireRole(['NHAN_VIEN', 'QUAN_LY']), CustomerController.createCustomer);

// Viewing/editing detailed customer info: NHAN_VIEN, QUAN_LY, or KHACH_HANG (checked in controller if self)
router.get('/:id', requireRole(['NHAN_VIEN', 'QUAN_LY', 'KHACH_HANG']), CustomerController.getCustomerById);
router.put('/:id', requireRole(['NHAN_VIEN', 'QUAN_LY', 'KHACH_HANG']), CustomerController.updateCustomer);
router.post('/:id/addresses', requireRole(['NHAN_VIEN', 'QUAN_LY', 'KHACH_HANG']), CustomerController.addAddress);
router.put('/:id/addresses/:addressId', requireRole(['NHAN_VIEN', 'QUAN_LY', 'KHACH_HANG']), CustomerController.updateAddress);
router.delete('/:id/addresses/:addressId', requireRole(['NHAN_VIEN', 'QUAN_LY', 'KHACH_HANG']), CustomerController.deleteAddress);
router.patch('/:id/addresses/:addressId/default', requireRole(['NHAN_VIEN', 'QUAN_LY', 'KHACH_HANG']), CustomerController.setDefaultAddress);
router.delete('/:id', requireRole(['NHAN_VIEN', 'QUAN_LY']), CustomerController.deleteCustomer);
router.get('/:id/orders', requireRole(['NHAN_VIEN', 'QUAN_LY', 'KHACH_HANG']), CustomerController.getCustomerOrders);

export default router;
