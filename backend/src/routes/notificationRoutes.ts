import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.post('/mark-all-read', markAllAsRead);

export default router;
