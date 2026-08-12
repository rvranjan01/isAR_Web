import { Request, Response } from "express";
import { Project } from "../models/Project";
import QRCode from "qrcode";
import { uploadFile } from "../services/cloudinaryService";
import { sendEmail } from "../services/emailService";

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

export const getPublicProjectById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }
    // Only return fields necessary for the public AR viewer
    res.json({
      _id: project._id,
      productName: project.productName,
      arModelUrl: project.arModelUrl,
      status: project.status
    });
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
      scanFileUrl = await uploadFile(
        req.file.buffer,
        req.file.originalname,
        "scans",
        "auto",
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
        productImageUrl ||
        "https://assets.immversestudios.com/default-product-image.png",
      scanFileUrl,
      notes,
      status: "Uploaded",
    });

    await project.save();

    // Send email to client
    const emailSubject = `Order Created: ${project.orderId}`;
    const emailHtml = `
      <h3>Hello ${project.clientName},</h3>
      <p>Your order for <strong>${project.productName}</strong> has been created successfully.</p>
      <p>You can track your order status by logging into the portal using your credentials:</p>
      <ul>
        <li><strong>Email:</strong> ${project.clientEmail}</li>
        <li><strong>Order ID:</strong> ${project.orderId}</li>
      </ul>
      <p>Thank you for choosing Immverse AR!</p>
    `;
    await sendEmail(project.clientEmail, emailSubject, emailHtml);

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

    if (status === "Completed" && !project.arViewerUrl) {
      const viewerBaseUrl =
        process.env.AR_VIEWER_BASE_URL || "https://is-ar-web.vercel.app";

      project.arViewerUrl =
        `${viewerBaseUrl.replace(/\/$/, "")}/view/${project._id}`;
    }

    await project.save();

    // Send email to client on status update
    const emailSubject = `Order Status Updated: ${project.orderId}`;

    const emailHtml = `
      <h3>Hello ${project.clientName},</h3>
      <p>
        Your order <strong>${project.orderId}</strong>
        (${project.productName}) has been updated.
      </p>
      <p>
        <strong>New Status:</strong> ${project.status}
      </p>
      <p>Login to the portal to view the details.</p>
      <p>Thank you!</p>
    `;

    await sendEmail(
      project.clientEmail,
      emailSubject,
      emailHtml,
    );

    res.json(project);
  } catch (error) {
    console.error("Error updating project status:", error);
    res.status(500).json({
      message: "Internal server error",
    });
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

    if (files?.modelFile && files.modelFile.length > 0) {
      const modelFile = files.modelFile[0];
      project.arModelUrl = await uploadFile(
        modelFile.buffer,
        modelFile.originalname,
        "models",
        "raw",
      );
    } else if (fileUrl) {
      project.arModelUrl = fileUrl;
    }

    // Notice we do NOT automatically set status to Completed or generate QR code here anymore.
    await project.save();
    res.json(project);
  } catch (error) {
    console.error("Upload AR Model Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const handleQRCode = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404).json({
        message: "Project not found",
      });
      return;
    }

    const viewerBaseUrl =
      process.env.AR_VIEWER_BASE_URL || "https://is-ar-web.vercel.app";

    const viewerUrl =
      `${viewerBaseUrl.replace(/\/$/, "")}/view/${project._id}`;

    console.log("========================================");
    console.log("Generating QR Code");
    console.log("AR Viewer URL:", viewerUrl);
    console.log("========================================");

    // Always save the viewer URL
    project.arViewerUrl = viewerUrl;

    const file = req.file;

    if (file) {
      // User uploaded a custom QR code
      project.qrCodeUrl = await uploadFile(
        file.buffer,
        file.originalname,
        "qrcodes",
        "image",
      );
    } else {
      // Generate QR Code containing the AR Viewer URL
      const qrBuffer = await QRCode.toBuffer(
        viewerUrl,
        {
          type: "png",
        },
      );

      project.qrCodeUrl = await uploadFile(
        qrBuffer,
        `qr-${project._id}.png`,
        "qrcodes",
        "image",
      );
    }

    await project.save();

    res.json(project);
  } catch (error) {
    console.error("QR Code Error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};