import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import projectRoutes from "./routes/projectRoutes";
import subscriptionRoutes from "./routes/subscriptionRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import { User } from "./models/User";

// Legacy local-storage imports — kept for reference only.
// Local upload directories are no longer required in production
// because files are uploaded to Cloudinary.
// import path from "path";
// import fs from "fs";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/immverse_ar";

// ── Legacy: Ensure upload folders exist (local dev only) ─────────────────────
// These directories are no longer used in production.
// Render's local filesystem is ephemeral — do not treat it as permanent storage.
// Files are now uploaded to Cloudinary. See services/cloudinaryService.ts.
//
// import path from "path";
// import fs from "fs";
// const uploadsDir = path.join(__dirname, "../uploads");
// const modelsDir = path.join(uploadsDir, "models");
// const qrcodesDir = path.join(uploadsDir, "qrcodes");
// if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
// if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir, { recursive: true });
// if (!fs.existsSync(qrcodesDir)) fs.mkdirSync(qrcodesDir, { recursive: true });

// ── CORS configuration ────────────────────────────────────────────────────────
// DEPLOYMENT NOTE:
// Set FRONTEND_URL in your Render environment variables to your Vercel domain.
// Example: FRONTEND_URL=https://your-app.vercel.app
//
// In local development, localhost origins are always allowed automatically.
// Do NOT use cors({ origin: "*" }) in production if auth tokens are involved.
const allowedOrigins: string[] = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4173",
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Render health checks)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json());

// Legacy: static file serving for local uploads (no longer needed in production)
// Files are served directly from Cloudinary CDN.
// import path from "path";
// app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ── Health check endpoint ─────────────────────────────────────────────────────
// Used by Render to verify the service is running.
// Test after deployment: GET https://YOUR_RENDER_URL/api/health
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/notifications", notificationRoutes);

// ── Connect to MongoDB and start server ───────────────────────────────────────
// DEPLOYMENT NOTE:
// Set MONGODB_URI in your Render environment variables to your MongoDB Atlas URI.
// Example: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/immverse_ar
mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB");

    // Seed Admin User
    try {
      const adminEmail = "admin@immversestudios.com";
      const existingAdmin = await User.findOne({ email: adminEmail });

      if (!existingAdmin) {
        const adminUser = new User({
          email: adminEmail,
          role: "admin",
          name: "Immverse Studio Operations",
          companyName: "Immverse Studios",
          orderId: "ADMIN",
        });
        await adminUser.save();
        console.log("Seeded default admin user: admin@immversestudios.com");
      }
    } catch (seedError) {
      console.error("Error seeding admin user:", seedError);
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    // Exit with failure in production so Render restarts the service
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  });
