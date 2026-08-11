// import multer from "multer";
// // import path from "path";  // Legacy local-storage import — kept for reference
// // import fs from "fs";      // Legacy local-storage import — kept for reference

// // ── Legacy local-storage implementation (commented, not deleted) ──────────────
// // Retained for local development reference.
// // Production uploads use Cloudinary because Render's local filesystem
// // is ephemeral and must NOT be treated as permanent object storage.
// //
// // const uploadsDir = path.join(__dirname, "../../uploads");
// //
// // const diskStorage = multer.diskStorage({
// //   destination: (req, file, cb) => {
// //     let folder = "models";
// //     if (file.fieldname === "qrCodeFile") {
// //       folder = "qrcodes";
// //     } else if (file.fieldname === "scanFile") {
// //       folder = "scans";
// //     }
// //     const destDir = path.join(uploadsDir, folder);
// //     if (!fs.existsSync(destDir)) {
// //       fs.mkdirSync(destDir, { recursive: true });
// //     }
// //     cb(null, destDir);
// //   },
// //   filename: (req, file, cb) => {
// //     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
// //     const ext = path.extname(file.originalname);
// //     cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
// //   },
// // });

// // ── Production storage: memory buffer ────────────────────────────────────────
// // Files are held in memory as Buffer objects (req.file.buffer / req.files[x].buffer).
// // Controllers then forward the buffer to cloudinaryService.uploadFile().
// //
// // STORAGE PROVIDER SWAP POINT:
// // If migrating from Cloudinary to AWS S3 or Azure Blob, this middleware stays
// // the same (memoryStorage). Only cloudinaryService.ts needs to change.
// const memoryStorage = multer.memoryStorage();

// export const upload = multer({ storage: memoryStorage });

import multer from "multer";

// ============================================================
// STORAGE PROVIDER: Cloudinary
// ============================================================
//
// Render's filesystem is ephemeral, so production uploads
// must NOT be stored permanently on the local filesystem.
//
// We use memoryStorage() because the controller passes the
// uploaded Buffer to cloudinaryService.uploadFile().
//
// IMPORTANT:
// This is only temporary memory storage.
// The file is NOT permanently stored on Render.
//
// ============================================================

// ── Legacy local-storage implementation (commented, not deleted) ──────────────
// Retained for local development reference.
//
// Production uploads use Cloudinary because Render's local
// filesystem is ephemeral and must NOT be treated as permanent
// object storage.
//
// const uploadsDir = path.join(__dirname, "../../uploads");
//
// const diskStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     let folder = "models";
//
//     if (file.fieldname === "qrCodeFile") {
//       folder = "qrcodes";
//     } else if (file.fieldname === "scanFile") {
//       folder = "scans";
//     }
//
//     const destDir = path.join(uploadsDir, folder);
//
//     if (!fs.existsSync(destDir)) {
//       fs.mkdirSync(destDir, { recursive: true });
//     }
//
//     cb(null, destDir);
//   },
//
//   filename: (req, file, cb) => {
//     const uniqueSuffix =
//       Date.now() + "-" + Math.round(Math.random() * 1e9);
//
//     const ext = path.extname(file.originalname);
//
//     cb(
//       null,
//       `${file.fieldname}-${uniqueSuffix}${ext}`
//     );
//   },
// });

// ── Production storage: memory buffer ────────────────────────────────────────
//
// Files are held temporarily in memory as Buffer objects:
//
//   req.file.buffer
//
// or:
//
//   req.files[x].buffer
//
// Controllers then forward the buffer to
// cloudinaryService.uploadFile().
//
// STORAGE PROVIDER SWAP POINT:
// If migrating from Cloudinary to AWS S3 or Azure Blob,
// this middleware can remain memoryStorage().
//
// Only the storage service needs to change.
//

const memoryStorage = multer.memoryStorage();

/*
 * Maximum file size accepted by our backend.
 *
 * 200 MB is intentionally higher than the expected AR model size.
 *
 * IMPORTANT:
 * This DOES NOT increase Cloudinary's account-level upload limit.
 * Cloudinary's own plan/account limit still applies.
 *
 * This limit simply prevents Multer from rejecting a valid
 * larger model before it reaches Cloudinary.
 */
const MAX_UPLOAD_SIZE = 200 * 1024 * 1024; // 200 MB

export const upload = multer({
  storage: memoryStorage,

  limits: {
    fileSize: MAX_UPLOAD_SIZE,

    /*
     * Prevent excessive multipart fields.
     */
    fields: 20,

    /*
     * Only a small number of files are expected per request.
     */
    files: 2,
  },

  /*
   * Basic file validation.
   *
   * We don't reject aggressively here because the controller
   * may handle different upload types:
   *
   * - scanFile
   * - modelFile
   * - qrCodeFile
   *
   * The actual model type validation can remain in the
   * project controller.
   */
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [
      ".glb",
      ".gltf",
      ".usdz",
      ".fbx",
      ".obj",
      ".bin",
      ".png",
      ".jpg",
      ".jpeg",
      ".webp",
      ".pdf",
    ];

    const extension = file.originalname
      .substring(file.originalname.lastIndexOf("."))
      .toLowerCase();

    /*
     * Allow known project file types.
     */
    if (allowedExtensions.includes(extension)) {
      cb(null, true);
      return;
    }

    /*
     * Reject unknown file types.
     */
    cb(new Error(`Unsupported file type: ${extension || "unknown"}`));
  },
});
