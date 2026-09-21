import express from 'express';
import { ContentController } from '../controllers/content.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// --- PUBLIC ROUTES (No Token Required) ---
router.get('/posts', ContentController.getPublicPosts);

// --- PROTECTED ROUTE (Placed before /posts/:id to avoid shadowing) ---
router.get('/posts/manage', authenticate, requireRole(['NHAN_VIEN', 'QUAN_LY']), ContentController.getManagePosts);

router.get('/posts/:id', ContentController.getPostById);
router.get('/categories', ContentController.getCategories);

router.post('/comments', ContentController.createComment);
router.post('/support-requests', ContentController.createSupportRequest);

// For testing / initial setup only
router.post('/categories', ContentController.createCategory);

// --- PROTECTED ROUTES ---
router.use(authenticate);

// Post Management (Staff / Manager)
router.post('/posts', requireRole(['NHAN_VIEN']), ContentController.createPost);
router.put('/posts/:id', requireRole(['NHAN_VIEN', 'QUAN_LY']), ContentController.updatePost);
router.patch('/posts/:id/status', requireRole(['QUAN_LY']), ContentController.updatePostStatus);
router.delete('/posts/:id', requireRole(['NHAN_VIEN', 'QUAN_LY']), ContentController.deletePost);

// Comment Moderation (Staff)
router.get('/comments/pending', requireRole(['NHAN_VIEN', 'QUAN_LY']), ContentController.getPendingComments);
router.patch('/comments/:id/approve', requireRole(['NHAN_VIEN']), ContentController.approveComment);
router.patch('/comments/:id/hide', requireRole(['NHAN_VIEN']), ContentController.hideComment);

// Support Request Resolution (Staff)
router.get('/support-requests/me', requireRole(['KHACH_HANG']), ContentController.getMySupportRequests);
router.get('/support-requests', requireRole(['NHAN_VIEN', 'QUAN_LY']), ContentController.getSupportRequests);
router.put('/support-requests/:id/reply', requireRole(['NHAN_VIEN', 'QUAN_LY']), ContentController.replySupportRequest);

export default router;
