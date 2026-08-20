import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth";
import {
  getProjects,
  getProjectById,
  getPublicProjectById,
  createProject,
  updateProjectStatus,
  uploadARModel,
  handleQRCode,
  deleteProject,
  lookupClientByEmail,
} from "../controllers/projectController";

import { upload } from "../middleware/upload";

const router = Router();

// Public routes
router.get("/public/:id", getPublicProjectById);

// Protect all project routes
router.use(authenticate);

router.get("/", getProjects);
router.get("/client-lookup", lookupClientByEmail);
router.get("/:id", getProjectById);

// Admin only routes
router.post(
  "/",
  requireAdmin,
  upload.fields([
    { name: "rawAsset", maxCount: 1 },
    { name: "scanFile", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  createProject,
);
router.patch("/:id/status", requireAdmin, updateProjectStatus);
router.delete("/:id", requireAdmin, deleteProject);

// Model upload
router.post(
  "/:id/model",
  requireAdmin,
  upload.fields([{ name: "modelFile", maxCount: 1 }]),
  uploadARModel,
);

// QR Code upload or generate
router.post(
  "/:id/qrcode",
  requireAdmin,
  upload.single("qrCodeFile"),
  handleQRCode,
);

export default router;
