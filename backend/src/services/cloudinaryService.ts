// // ============================================================
// // STORAGE PROVIDER: Cloudinary
// // ============================================================
// // This service is intentionally isolated so it can later be
// // replaced with AWS S3, Azure Blob Storage, or any other
// // object-storage provider without changing controllers or
// // frontend code.
// //
// // To migrate to AWS S3:
// //   1. Install @aws-sdk/client-s3
// //   2. Replace the three functions below with S3 equivalents
// //   3. Update env vars (remove CLOUDINARY_*, add AWS_*)
// //   4. No other file needs to change.
// //
// // To migrate to Azure Blob Storage:
// //   1. Install @azure/storage-blob
// //   2. Replace the three functions below with Azure equivalents
// //   3. Update env vars accordingly
// //   4. No other file needs to change.
// // ============================================================

// import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
// import { Readable } from "stream";

// // Configure Cloudinary using environment variables.
// // NEVER hardcode these values — set them in your deployment environment.
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET, // NEVER expose this to the frontend
// });

// // ── Provider-independent interface ───────────────────────────────────────────
// // Controllers call these three functions only.
// // Swapping the storage provider only requires updating the implementations below.

// /**
//  * Upload a file buffer to Cloudinary (or future storage provider).
//  *
//  * @param buffer    - File contents as a Buffer
//  * @param filename  - Original filename (used for public_id / folder naming)
//  * @param folder    - Logical folder name: "models", "qrcodes", "scans", etc.
//  * @param resourceType - Cloudinary resource type: "image" | "video" | "raw" | "auto"
//  * @returns The permanent public URL of the uploaded file (secure_url from Cloudinary)
//  *
//  * // STORAGE PROVIDER SWAP POINT:
//  * // Replace the body of this function when migrating to AWS S3 / Azure Blob.
//  * // Return a permanent public URL in the same shape.
//  */
// export async function uploadFile(
//   buffer: Buffer,
//   filename: string,
//   folder: string,
//   resourceType: "image" | "video" | "raw" | "auto" = "auto"
// ): Promise<string> {
//   return new Promise((resolve, reject) => {
//     // IMPORTANT: The URL returned here (secure_url) must be stored in MongoDB.
//     // QR codes must be generated using this URL — never a localhost or Render path.
//     const uploadStream = cloudinary.uploader.upload_stream(
//       {
//         folder: `immverse/${folder}`,
//         public_id: sanitizeFilename(filename),
//         resource_type: resourceType,
//         overwrite: true,
//         use_filename: true,
//         unique_filename: false,
//       },
//       (error, result: UploadApiResponse | undefined) => {
//         if (error) {
//           reject(new Error(`Cloudinary upload failed: ${error.message}`));
//           return;
//         }
//         if (!result) {
//           reject(new Error("Cloudinary upload returned no result"));
//           return;
//         }
//         // secure_url is the permanent HTTPS URL — always use this for storage and QR codes.
//         resolve(result.secure_url);
//       }
//     );

//     // Pipe the buffer into the Cloudinary upload stream
//     const readable = Readable.from(buffer);
//     readable.pipe(uploadStream);
//   });
// }

// /**
//  * Delete a file from Cloudinary by its public_id.
//  *
//  * @param publicId - The Cloudinary public_id (not the full URL)
//  *
//  * // STORAGE PROVIDER SWAP POINT:
//  * // Replace with S3 DeleteObjectCommand or Azure BlobServiceClient.deleteBlob().
//  */
// export async function deleteFile(publicId: string): Promise<void> {
//   await cloudinary.uploader.destroy(publicId);
// }

// /**
//  * Derive the public URL for a known public_id.
//  * Useful when you store only the public_id in the database.
//  *
//  * @param publicId - The Cloudinary public_id
//  * @param resourceType - Resource type (default: "image")
//  * @returns The secure HTTPS URL
//  *
//  * // STORAGE PROVIDER SWAP POINT:
//  * // Replace with S3 getSignedUrl or Azure generateSasUrl.
//  */
// export function getFileUrl(
//   publicId: string,
//   resourceType: "image" | "video" | "raw" = "image"
// ): string {
//   return cloudinary.url(publicId, {
//     resource_type: resourceType,
//     secure: true,
//   });
// }

// // ── Internal helpers ──────────────────────────────────────────────────────────

// /**
//  * Strip extension and sanitize a filename to use as a Cloudinary public_id.
//  * Cloudinary public_ids must not contain dots (except the extension it manages).
//  */
// function sanitizeFilename(filename: string): string {
//   const withoutExt = filename.replace(/\.[^/.]+$/, "");
//   return (
//     withoutExt
//       .replace(/[^a-zA-Z0-9_-]/g, "_")
//       .substring(0, 80) +
//     "_" +
//     Date.now()
//   );
// }

// ============================================================
// STORAGE PROVIDER: Cloudinary
// ============================================================
//
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


cloudinary.api.ping()
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


console.log("========================================");
console.log("Cloudinary Configuration Check");
console.log(
  "CLOUDINARY_CLOUD_NAME:",
  process.env.CLOUDINARY_CLOUD_NAME ? "SET" : "MISSING",
);
console.log(
  "CLOUDINARY_API_KEY:",
  process.env.CLOUDINARY_API_KEY ? "SET" : "MISSING",
);
console.log(
  "CLOUDINARY_API_SECRET:",
  process.env.CLOUDINARY_API_SECRET ? "SET" : "MISSING",
);
console.log("========================================");

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
// export async function uploadFile(
//   buffer: Buffer,
//   filename: string,
//   folder: string,
//   resourceType: "image" | "video" | "raw" | "auto" = "auto",
// ): Promise<string> {
//   return new Promise((resolve, reject) => {
//     /*
//      * Cloudinary supports chunked uploads through
//      * upload_chunked_stream().
//      *
//      * 6 MB chunks are used here to keep memory/network
//      * requirements reasonable while supporting larger files.
//      *
//      * Cloudinary allows chunk sizes down to 5 MB.
//      */
//     const uploadStream = cloudinary.uploader.upload_chunked_stream(
//       {
//         folder: `immverse/${folder}`,

//         /*
//          * IMPORTANT:
//          * Raw assets such as .glb/.gltf should keep their
//          * original extension in the public_id.
//          */
//         public_id:
//           resourceType === "raw"
//             ? sanitizeFilename(filename, true)
//             : sanitizeFilename(filename, false),

//         resource_type: resourceType,

//         overwrite: true,

//         /*
//          * 6 MB chunk size.
//          *
//          * Cloudinary's documented default is 20 MB and
//          * the minimum supported chunk size is 5 MB.
//          */
//         chunk_size: 6 * 1024 * 1024,

//         use_filename: false,
//         unique_filename: false,
//       },

//       (error: any, result: UploadApiResponse | undefined) => {
//         if (error) {
//           reject(new Error(`Cloudinary upload failed: ${error.message}`));
//           return;
//         }

//         if (!result) {
//           reject(new Error("Cloudinary upload returned no result"));
//           return;
//         }

//         /*
//          * secure_url is the permanent HTTPS URL.
//          *
//          * ALWAYS store this URL in MongoDB.
//          * NEVER store a localhost URL or Render filesystem path.
//          *
//          * QR codes must also be generated from this URL.
//          */
//         if (!result.secure_url) {
//           reject(
//             new Error(
//               "Cloudinary upload succeeded but no secure_url was returned",
//             ),
//           );
//           return;
//         }

//         resolve(result.secure_url);
//       },
//     );

//     /*
//      * Pipe the file buffer into Cloudinary's chunked upload stream.
//      */
//     const readable = Readable.from(buffer);

//     readable.on("error", (error) => {
//       reject(
//         new Error(
//           `Failed to read file for Cloudinary upload: ${error.message}`,
//         ),
//       );
//     });

//     readable.pipe(uploadStream);
//   });
// }
// export async function uploadFile(
//   buffer: Buffer,
//   filename: string,
//   folder: string,
//   resourceType: "image" | "video" | "raw" | "auto" = "auto",
// ): Promise<string> {
//   return new Promise((resolve, reject) => {
//     const publicId =
//       resourceType === "raw"
//         ? sanitizeFilename(filename, true)
//         : sanitizeFilename(filename, false);

//     console.log("========================================");
//     console.log("Starting Cloudinary upload");
//     console.log("Resource type:", resourceType);
//     console.log("Public ID:", `immverse/${folder}/${publicId}`);
//     console.log("File size:", buffer.length, "bytes");
//     console.log("========================================");

//     const uploadStream = cloudinary.uploader.upload_chunked_stream(
//       {
//         folder: `immverse/${folder}`,
//         public_id: publicId,
//         resource_type: resourceType,

//         overwrite: true,

//         /*
//          * 6 MB chunks.
//          *
//          * Cloudinary sends intermediate callbacks while
//          * processing these chunks.
//          */
//         chunk_size: 6 * 1024 * 1024,

//         use_filename: false,
//         unique_filename: false,
//       },

//       (error, result: any) => {
//         console.log("========================================");
//         console.log("Cloudinary upload callback");
//         console.log("Error:", error);
//         console.log("Result:", result);
//         console.log("========================================");

//         // ---------------------------------------------------------
//         // Cloudinary returned an error
//         // ---------------------------------------------------------
//         if (error) {
//           reject(new Error(`Cloudinary upload failed: ${error.message}`));
//           return;
//         }

//         if (!result) {
//           reject(new Error("Cloudinary upload returned no result"));
//           return;
//         }

//         // ---------------------------------------------------------
//         // IMPORTANT:
//         //
//         // upload_chunked_stream() calls the callback multiple
//         // times.
//         //
//         // done:false = intermediate chunk
//         // done:true  = FINAL upload response
//         //
//         // DO NOT resolve/reject on done:false.
//         // ---------------------------------------------------------

//         if (result.done === false) {
//           console.log(`Cloudinary chunk uploaded: ${result.bytes} bytes`);

//           return;
//         }

//         // ---------------------------------------------------------
//         // FINAL RESPONSE
//         // ---------------------------------------------------------

//         console.log(
//           "Cloudinary upload COMPLETED:",
//           JSON.stringify(result, null, 2),
//         );

//         // Cloudinary normally provides secure_url on the
//         // final upload response.
//         if (result.secure_url) {
//           console.log("Cloudinary secure URL:", result.secure_url);

//           resolve(result.secure_url);
//           return;
//         }

//         // ---------------------------------------------------------
//         // Fallback for raw assets.
//         //
//         // Use the ACTUAL version returned by Cloudinary.
//         // Never use /v1/.
//         // ---------------------------------------------------------

//         if (result.public_id && result.version) {
//           const generatedUrl =
//             `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}` +
//             `/${result.resource_type || resourceType}` +
//             `/upload/v${result.version}/` +
//             `${result.public_id}`;

//           console.log("Generated Cloudinary URL:", generatedUrl);

//           resolve(generatedUrl);
//           return;
//         }

//         reject(
//           new Error(
//             "Cloudinary final upload response did not contain secure_url or version",
//           ),
//         );
//       },
//     );

//     // ---------------------------------------------------------
//     // Send the Buffer to Cloudinary
//     // ---------------------------------------------------------

//     const readable = Readable.from(buffer);

//     readable.on("error", (error) => {
//       reject(
//         new Error(
//           `Failed to read file for Cloudinary upload: ${error.message}`,
//         ),
//       );
//     });

//     readable.pipe(uploadStream);
//   });
// }


export async function uploadFile(
  buffer: Buffer,
  filename: string,
  folder: string,
  resourceType: "image" | "video" | "raw" | "auto" = "auto",
): Promise<string> {
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
          reject(
            new Error(`Cloudinary upload failed: ${error.message}`),
          );
          return;
        }

        if (!result) {
          reject(
            new Error("Cloudinary upload returned no result"),
          );
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

        console.log(
          "Cloudinary upload COMPLETED:",
          result.secure_url,
        );

        resolve(result.secure_url);
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
