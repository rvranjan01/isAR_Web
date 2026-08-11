// ============================================================
// STORAGE PROVIDER: Cloudinary
// ============================================================
// This service is intentionally isolated so it can later be
// replaced with AWS S3, Azure Blob Storage, or any other
// object-storage provider without changing controllers or
// frontend code.
//
// To migrate to AWS S3:
//   1. Install @aws-sdk/client-s3
//   2. Replace the three functions below with S3 equivalents
//   3. Update env vars (remove CLOUDINARY_*, add AWS_*)
//   4. No other file needs to change.
//
// To migrate to Azure Blob Storage:
//   1. Install @azure/storage-blob
//   2. Replace the three functions below with Azure equivalents
//   3. Update env vars accordingly
//   4. No other file needs to change.
// ============================================================

import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { Readable } from "stream";

// Configure Cloudinary using environment variables.
// NEVER hardcode these values — set them in your deployment environment.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // NEVER expose this to the frontend
});

// ── Provider-independent interface ───────────────────────────────────────────
// Controllers call these three functions only.
// Swapping the storage provider only requires updating the implementations below.

/**
 * Upload a file buffer to Cloudinary (or future storage provider).
 *
 * @param buffer    - File contents as a Buffer
 * @param filename  - Original filename (used for public_id / folder naming)
 * @param folder    - Logical folder name: "models", "qrcodes", "scans", etc.
 * @param resourceType - Cloudinary resource type: "image" | "video" | "raw" | "auto"
 * @returns The permanent public URL of the uploaded file (secure_url from Cloudinary)
 *
 * // STORAGE PROVIDER SWAP POINT:
 * // Replace the body of this function when migrating to AWS S3 / Azure Blob.
 * // Return a permanent public URL in the same shape.
 */
export async function uploadFile(
  buffer: Buffer,
  filename: string,
  folder: string,
  resourceType: "image" | "video" | "raw" | "auto" = "auto"
): Promise<string> {
  return new Promise((resolve, reject) => {
    // IMPORTANT: The URL returned here (secure_url) must be stored in MongoDB.
    // QR codes must be generated using this URL — never a localhost or Render path.
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `immverse/${folder}`,
        public_id: sanitizeFilename(filename),
        resource_type: resourceType,
        overwrite: true,
        use_filename: true,
        unique_filename: false,
      },
      (error, result: UploadApiResponse | undefined) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
          return;
        }
        if (!result) {
          reject(new Error("Cloudinary upload returned no result"));
          return;
        }
        // secure_url is the permanent HTTPS URL — always use this for storage and QR codes.
        resolve(result.secure_url);
      }
    );

    // Pipe the buffer into the Cloudinary upload stream
    const readable = Readable.from(buffer);
    readable.pipe(uploadStream);
  });
}

/**
 * Delete a file from Cloudinary by its public_id.
 *
 * @param publicId - The Cloudinary public_id (not the full URL)
 *
 * // STORAGE PROVIDER SWAP POINT:
 * // Replace with S3 DeleteObjectCommand or Azure BlobServiceClient.deleteBlob().
 */
export async function deleteFile(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

/**
 * Derive the public URL for a known public_id.
 * Useful when you store only the public_id in the database.
 *
 * @param publicId - The Cloudinary public_id
 * @param resourceType - Resource type (default: "image")
 * @returns The secure HTTPS URL
 *
 * // STORAGE PROVIDER SWAP POINT:
 * // Replace with S3 getSignedUrl or Azure generateSasUrl.
 */
export function getFileUrl(
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image"
): string {
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    secure: true,
  });
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Strip extension and sanitize a filename to use as a Cloudinary public_id.
 * Cloudinary public_ids must not contain dots (except the extension it manages).
 */
function sanitizeFilename(filename: string): string {
  const withoutExt = filename.replace(/\.[^/.]+$/, "");
  return (
    withoutExt
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .substring(0, 80) +
    "_" +
    Date.now()
  );
}
