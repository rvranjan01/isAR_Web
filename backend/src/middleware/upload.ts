import multer from "multer";

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
