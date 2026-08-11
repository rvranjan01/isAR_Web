import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { getProjects, getProjectById, createProject, updateProjectStatus, uploadARModel } from '../controllers/projectController';

import { upload } from '../middleware/upload';

const router = Router();

// Protect all project routes
router.use(authenticate);

router.get('/', getProjects);
router.get('/:id', getProjectById);

// Admin only routes
router.post('/', requireAdmin, upload.single('scanFile'), createProject);
router.patch('/:id/status', requireAdmin, updateProjectStatus);
router.post(
  '/:id/model',
  requireAdmin,
  upload.fields([
    { name: 'modelFile', maxCount: 1 },
    { name: 'qrCodeFile', maxCount: 1 }
  ]),
  uploadARModel
);

export default router;
