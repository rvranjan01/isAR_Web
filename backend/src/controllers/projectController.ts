import { Request, Response } from "express";
import { Project } from "../models/Project";
import QRCode from "qrcode";
// import path from "path"; // Legacy local-storage import — kept for reference
// import fs from "fs";     // Legacy local-storage import — kept for reference

// STORAGE PROVIDER:
// Currently using Cloudinary via cloudinaryService.
// This controller does NOT import Cloudinary directly — it only calls
// the provider-independent service functions (uploadFile, deleteFile, getFileUrl).
// To switch to AWS S3 or Azure Blob, only cloudinaryService.ts needs to change.
import { uploadFile } from "../services/cloudinaryService";

export const getProjects = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.query;
    let query = {};

    if (email) {
      query = { clientEmail: (email as string).toLowerCase() };
    }

    // Sort by newest first
    const projects = await Project.find(query).sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getProjectById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createProject = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      clientEmail,
      clientName,
      productName,
      productCategory,
      description,
      notes,
      productImageUrl,
    } = req.body;

    const randomOrderNum = Math.floor(1000 + Math.random() * 9000);
    const orderId = `ORD-${randomOrderNum}`;

    let scanFileUrl: string | undefined;

    if (req.file) {
      // STORAGE PROVIDER: Cloudinary
      // Previously: scanFileUrl = `${req.protocol}://${req.get("host")}/uploads/scans/${req.file.filename}`;
      // That would have used a Render-internal URL (non-permanent, breaks in production).
      // Now: upload to Cloudinary and store the permanent secure_url.
      //
      // IMPORTANT: The URL returned by uploadFile() is what gets stored in MongoDB.
      // SWAP POINT: If migrating to AWS S3 / Azure Blob, only cloudinaryService.uploadFile() changes.
      scanFileUrl = await uploadFile(
        req.file.buffer,
        req.file.originalname,
        "scans",
        "auto"
      );
    }

    const project = new Project({
      orderId,
      clientEmail: clientEmail.toLowerCase(),
      clientName,
      productName,
      productCategory,
      description,
      productImageUrl:
        productImageUrl || "https://assets.immversestudios.com/default-product-image.png",
      scanFileUrl,
      notes,
      status: "Uploaded",
    });

    await project.save();
    res.status(201).json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProjectStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { status } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    project.status = status;

    // Auto generate arViewerUrl when completed
    // NOTE: ar.immversestudios.com is the AR viewer domain (not a storage URL).
    // This URL is intentional and does not need to change for cloud migration.
    if (status === "Completed" && !project.arViewerUrl) {
      project.arViewerUrl = `https://ar.immversestudios.com/view/${project._id}`;
      if (!project.arModelUrl) {
        project.arModelUrl = `https://assets.immversestudios.com/models/${project._id}.glb`;
      }
    }

    await project.save();
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const uploadARModel = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { fileUrl } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    // ── Upload 3D model file to Cloudinary ───────────────────────────────────
    // STORAGE PROVIDER: Cloudinary
    // Previously: project.arModelUrl = `${baseUrl}/uploads/models/${files.modelFile[0].filename}`;
    // That used a Render-internal/ephemeral local path — broken in production.
    // Now: upload buffer to Cloudinary, store the permanent secure_url in MongoDB.
    //
    // IMPORTANT: The URL stored in MongoDB (arModelUrl) is the Cloudinary secure_url.
    // The frontend loads the 3D model directly from this Cloudinary URL.
    // SWAP POINT: Replace uploadFile() implementation in cloudinaryService.ts for AWS/Azure.
    if (files?.modelFile && files.modelFile.length > 0) {
      const modelFile = files.modelFile[0];
      project.arModelUrl = await uploadFile(
        modelFile.buffer,
        modelFile.originalname,
        "models",
        "raw" // GLB/GLTF files use resource_type "raw" in Cloudinary
      );
    } else if (fileUrl) {
      project.arModelUrl = fileUrl;
    }

    // ── Generate QR code and upload to Cloudinary ─────────────────────────────
    // IMPORTANT:
    // The URL encoded into the QR code must be a permanent, publicly accessible URL.
    // Previously: QR was saved to local filesystem and served via Express static.
    // That breaks on Render (ephemeral FS) and produces a localhost/internal URL.
    //
    // Now:
    //   1. Generate QR code as a PNG Buffer (never touch the filesystem)
    //   2. Upload the buffer to Cloudinary
    //   3. Store the Cloudinary secure_url in MongoDB as qrCodeUrl
    //
    // The URL encoded IN the QR points to the AR viewer (ar.immversestudios.com).
    // The QR image itself is hosted on Cloudinary.
    //
    // SWAP POINT: If migrating storage, only cloudinaryService.uploadFile() changes.
    const viewerUrl = `https://ar.immversestudios.com/view/${project._id}`;
    const qrBuffer = await QRCode.toBuffer(viewerUrl, { type: "png" });

    const qrCloudinaryUrl = await uploadFile(
      qrBuffer,
      `qr-${project._id}.png`,
      "qrcodes",
      "image"
    );
    project.qrCodeUrl = qrCloudinaryUrl;

    // If admin uploaded a custom QR file, prefer that over the auto-generated one
    if (files?.qrCodeFile && files.qrCodeFile.length > 0) {
      const qrFile = files.qrCodeFile[0];
      project.qrCodeUrl = await uploadFile(
        qrFile.buffer,
        qrFile.originalname,
        "qrcodes",
        "image"
      );
    }

    // NOTE: arViewerUrl points to the AR viewer domain — not a storage URL.
    // This does not need to change when migrating storage providers.
    project.arViewerUrl = `https://ar.immversestudios.com/view/${project._id}`;
    project.status = "Completed";

    await project.save();
    res.json(project);
  } catch (error) {
    console.error("Upload AR Model Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
