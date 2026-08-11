import multer from "multer";
// import path from "path";  // Legacy local-storage import — kept for reference
// import fs from "fs";      // Legacy local-storage import — kept for reference

// ── Legacy local-storage implementation (commented, not deleted) ──────────────
// Retained for local development reference.
// Production uploads use Cloudinary because Render's local filesystem
// is ephemeral and must NOT be treated as permanent object storage.
//
// const uploadsDir = path.join(__dirname, "../../uploads");
//
// const diskStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     let folder = "models";
//     if (file.fieldname === "qrCodeFile") {
//       folder = "qrcodes";
//     } else if (file.fieldname === "scanFile") {
//       folder = "scans";
//     }
//     const destDir = path.join(uploadsDir, folder);
//     if (!fs.existsSync(destDir)) {
//       fs.mkdirSync(destDir, { recursive: true });
//     }
//     cb(null, destDir);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     const ext = path.extname(file.originalname);
//     cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
//   },
// });

// ── Production storage: memory buffer ────────────────────────────────────────
// Files are held in memory as Buffer objects (req.file.buffer / req.files[x].buffer).
// Controllers then forward the buffer to cloudinaryService.uploadFile().
//
// STORAGE PROVIDER SWAP POINT:
// If migrating from Cloudinary to AWS S3 or Azure Blob, this middleware stays
// the same (memoryStorage). Only cloudinaryService.ts needs to change.
const memoryStorage = multer.memoryStorage();

export const upload = multer({ storage: memoryStorage });
