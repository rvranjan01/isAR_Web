import dotenv from "dotenv";
dotenv.config();

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("Cloud name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API key:", process.env.CLOUDINARY_API_KEY ? "SET" : "MISSING");
console.log("API secret:", process.env.CLOUDINARY_API_SECRET ? "SET" : "MISSING");

const filePath = "./test.jpeg";

if (!fs.existsSync(filePath)) {
  console.error("test.jpeg not found");
  process.exit(1);
}

cloudinary.uploader.upload(
  filePath,
  {
    folder: "immverse/test",
    resource_type: "image",
  },
  (error, result) => {
    console.log("========================================");
    console.log("UPLOAD TEST");
    console.log("========================================");

    if (error) {
      console.error("UPLOAD ERROR:", error);
      process.exit(1);
    }

    console.log("UPLOAD SUCCESS");
    console.log("Public ID:", result?.public_id);
    console.log("Secure URL:", result?.secure_url);

    process.exit(0);
  },
);