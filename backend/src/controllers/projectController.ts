import { Request, Response } from "express";
import mongoose from "mongoose";
import { Project } from "../models/Project";
import { Notification } from "../models/Notification";
import QRCode from "qrcode";
import { uploadFile } from "../services/cloudinaryService";
import { sendEmail } from "../services/emailService";
const loginUrl = `${process.env.FRONTEND_URL}/login`;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@immversestudios.com";

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
    const id = (req.params.id as string) || "";
    let project = null;

    if (mongoose.isValidObjectId(id)) {
      project = await Project.findById(id);
    }
    if (!project && id) {
      project = await Project.findOne({ orderId: id.toUpperCase() });
    }

    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }
    res.json(project);
  } catch (error) {
    console.error("Error fetching project by id:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getPublicProjectById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = (req.params.id as string) || "";
    let project = null;

    if (mongoose.isValidObjectId(id)) {
      project = await Project.findById(id);
    }
    if (!project && id) {
      project = await Project.findOne({ orderId: id.toUpperCase() });
    }

    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }


    // Return fields necessary for public AR viewer
    res.json({
      id: project._id?.toString(),
      _id: project._id,
      orderId: project.orderId,
      productName: project.productName,
      productCategory: project.productCategory,
      arModelUrl: project.arModelUrl,
      status: project.status,
    });
  } catch (error) {
    console.error("Error fetching public project:", error);
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
        "https://plus.unsplash.com/premium_photo-1726797661357-f7897f35f865?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      scanFileUrl,
      notes,
      status: "Uploaded",
    });

    await project.save();

    // Create notifications for client and admin
    try {
      await Notification.create([
        {
          recipientEmail: project.clientEmail,
          title: "Order Created",
          message: `Your order ${project.orderId} for "${project.productName}" has been successfully created.`,
          type: "success",
          link: `/dashboard`,
          read: false,
        },
        {
          recipientEmail: ADMIN_EMAIL.toLowerCase(),
          title: "New Client Order",
          message: `Order ${project.orderId} created for ${project.clientName} (${project.clientEmail}).`,
          type: "info",
          link: `/admin/orders/${project._id}`,
          read: false,
        },
      ]);
    } catch (notifErr) {
      console.error(
        "Failed to generate order creation notification:",
        notifErr,
      );
    }

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
      <p>
    <a 
      href="${loginUrl}" 
      style="
        display: inline-block;
        padding: 12px 20px;
        background-color: #000000;
        color: #ffffff;
        text-decoration: none;
        border-radius: 6px;
        font-weight: bold;
      "
    >
      Login to Your Portal
    </a>
  </p>

  <p>
    Or copy and open this link in your browser:<br>
    <a href="${loginUrl}">
      ${loginUrl}
    </a>
  </p>
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
        process.env.AR_VIEWER_BASE_URL ||
        process.env.FRONTEND_URL ||
        "http://localhost:5173";

      project.arViewerUrl = `${viewerBaseUrl.replace(/\/$/, "")}/view/${project._id}`;
    }


    await project.save();

    // Create in-app notification for client
    try {
      await Notification.create({
        recipientEmail: project.clientEmail,
        title: `Order Status Updated: ${status}`,
        message: `Your order ${project.orderId} (${project.productName}) has moved to stage: ${status}.`,
        type: status === "Completed" ? "success" : "info",
        link: `/orders/${project._id}`,
        read: false,
      });
    } catch (notifErr) {
      console.error("Failed to generate status notification:", notifErr);
    }

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
      <p>
    <a 
      href="https://is-ar-web.vercel.app/login" 
      style="
        display: inline-block;
        padding: 12px 20px;
        background-color: #000000;
        color: #ffffff;
        text-decoration: none;
        border-radius: 6px;
        font-weight: bold;
      "
    >
      Login to Your Portal
    </a>
  </p>

  <p>
    Or copy and open this link in your browser:<br>
    <a href="https://is-ar-web.vercel.app/login">
      https://is-ar-web.vercel.app/login
    </a>
  </p>
      <p>Thank you!</p>
    `;

    await sendEmail(project.clientEmail, emailSubject, emailHtml);

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

    await project.save();

    // Create in-app notification for client
    try {
      await Notification.create({
        recipientEmail: project.clientEmail,
        title: "3D AR Model Uploaded",
        message: `A 3D model is now available for order ${project.orderId} (${project.productName}).`,
        type: "info",
        link: `/orders/${project._id}`,
        read: false,
      });
    } catch (notifErr) {
      console.error("Failed to generate model upload notification:", notifErr);
    }

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
      process.env.AR_VIEWER_BASE_URL ||
      process.env.FRONTEND_URL ||
      "http://localhost:5173";

    const viewerUrl = `${viewerBaseUrl.replace(/\/$/, "")}/view/${project._id}`;


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
      const qrBuffer = await QRCode.toBuffer(viewerUrl, {
        type: "png",
      });

      project.qrCodeUrl = await uploadFile(
        qrBuffer,
        `qr-${project._id}.png`,
        "qrcodes",
        "image",
      );
    }

    await project.save();

    // Create in-app notification for client
    try {
      await Notification.create({
        recipientEmail: project.clientEmail,
        title: "AR QR Code Ready",
        message: `Scannable Web AR experience is live for ${project.orderId} (${project.productName})!`,
        type: "success",
        link: `/orders/${project._id}`,
        read: false,
      });
    } catch (notifErr) {
      console.error("Failed to generate QR notification:", notifErr);
    }

    res.json(project);
  } catch (error) {
    console.error("QR Code Error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const deleteProject = async (
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

    await Project.findByIdAndDelete(req.params.id);

    res.json({
      message: "Project deleted successfully",
      id: req.params.id,
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};
