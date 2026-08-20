import dotenv from "dotenv";
dotenv.config();

import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { Readable } from "stream";

// Configure Cloudinary using environment variables.
// NEVER hardcode these values — set them in your deployment environment.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

cloudinary.api
  .ping()
  .then((result) => {
    console.log("========================================");
    console.log("Cloudinary connection successful:", result);
    console.log("========================================");
  })
  .catch((error) => {
    console.error("========================================");
    console.error("Cloudinary connection FAILED:", error);
    console.error("========================================");
  });


// ── Provider-independent interface ───────────────────────────────────────────
// Controllers call these functions only.
// Swapping the storage provider only requires updating the implementations below.

/**
 * Upload a file buffer to Cloudinary.
 *
 * Large files are uploaded using Cloudinary's chunked stream upload.
 * This is particularly useful for 3D models such as .glb/.gltf.
 *
 * @param buffer        - File contents as a Buffer
 * @param filename      - Original filename
 * @param folder        - Logical folder name: "models", "qrcodes", "scans", etc.
 * @param resourceType  - Cloudinary resource type:
 *                        "image" | "video" | "raw" | "auto"
 *
 * @returns The permanent public HTTPS URL of the uploaded file.
 *
 * IMPORTANT:
 * - For .glb/.gltf files, use resourceType = "raw".
 * - The returned secure_url must be stored in MongoDB.
 * - QR codes must use this secure_url.
 *
 * STORAGE PROVIDER SWAP POINT:
 * Replace the body of this function when migrating to
 * AWS S3 / Azure Blob Storage.
 */

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

export async function uploadFileWithDetails(
  buffer: Buffer,
  filename: string,
  folder: string,
  resourceType: "image" | "video" | "raw" | "auto" = "auto",
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const publicId =
      resourceType === "raw"
        ? sanitizeFilename(filename, true)
        : sanitizeFilename(filename, false);

    console.log("========================================");
    console.log("Starting Cloudinary upload");
    console.log("Resource type:", resourceType);
    console.log("Public ID:", `immverse/${folder}/${publicId}`);
    console.log("File size:", buffer.length, "bytes");
    console.log("========================================");

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `immverse/${folder}`,
        public_id: publicId,
        resource_type: resourceType,
        overwrite: true,
        use_filename: false,
        unique_filename: false,
      },

      (error, result: UploadApiResponse | undefined) => {
        console.log("========================================");
        console.log("Cloudinary upload callback");
        console.log("Error:", error);
        console.log("Result:", result);
        console.log("========================================");

        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary upload returned no result"));
          return;
        }

        if (!result.secure_url) {
          reject(
            new Error(
              "Cloudinary upload succeeded but no secure_url was returned",
            ),
          );
          return;
        }

        console.log("Cloudinary upload COMPLETED:", result.secure_url);

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    const readable = Readable.from(buffer);

    readable.on("error", (error) => {
      reject(
        new Error(
          `Failed to read file for Cloudinary upload: ${error.message}`,
        ),
      );
    });

    readable.pipe(uploadStream);
  });
}

export async function uploadFile(
  buffer: Buffer,
  filename: string,
  folder: string,
  resourceType: "image" | "video" | "raw" | "auto" = "auto",
): Promise<string> {
  const result = await uploadFileWithDetails(
    buffer,
    filename,
    folder,
    resourceType,
  );
  return result.url;
}

/**
 * Delete a file from Cloudinary by its public_id.
 *
 * @param publicId - Cloudinary public_id
 *
 * STORAGE PROVIDER SWAP POINT:
 * Replace with S3 DeleteObjectCommand or
 * Azure BlobServiceClient.deleteBlob().
 */
export async function deleteFile(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, {
    resource_type: "raw",
  });
}

/**
 * Derive the public URL for a known public_id.
 *
 * Useful when you store only the public_id in the database.
 *
 * @param publicId      - Cloudinary public_id
 * @param resourceType  - Resource type (default: "image")
 *
 * @returns The secure HTTPS URL
 *
 * STORAGE PROVIDER SWAP POINT:
 * Replace with S3 getSignedUrl or Azure generateSasUrl.
 */
export function getFileUrl(
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image",
): string {
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    secure: true,
  });
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Sanitize a filename for use as a Cloudinary public_id.
 *
 * For raw assets such as .glb/.gltf, the extension MUST be
 * preserved because Cloudinary raw assets use the extension
 * as part of the public ID.
 *
 * Example:
 *
 *   chair-model.glb
 *
 * becomes something similar to:
 *
 *   chair-model_1723456789012.glb
 */
function sanitizeFilename(
  filename: string,
  preserveExtension: boolean,
): string {
  const extensionMatch = filename.match(/(\.[^/.]+)$/);
  const extension = extensionMatch ? extensionMatch[1].toLowerCase() : "";

  const withoutExt = filename.replace(/\.[^/.]+$/, "");

  const sanitizedBase = withoutExt
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .substring(0, 80);

  const uniqueName = `${sanitizedBase}_${Date.now()}`;

  return preserveExtension ? `${uniqueName}${extension}` : uniqueName;
}
