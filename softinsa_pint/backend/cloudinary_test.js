#!/usr/bin/env node

const cloudinary = require('cloudinary').v2;

// 1. Configure Cloudinary inline
cloudinary.config({
  cloud_name: 'nvvadzck',
  api_key: '528239935959973',
  api_secret: 'w9C-6oRdWDcyuII4_gWn3zh0y6g',
  secure: true
});

async function run() {
  try {
    console.log("Uploading sample image...");
    // 2. Upload an image from Cloudinary's demo domains
    const uploadResult = await cloudinary.uploader.upload('https://res.cloudinary.com/demo/image/upload/sample.jpg');
    console.log("Secure URL: " + uploadResult.secure_url);
    console.log("Public ID: " + uploadResult.public_id);
    
    // 3. Get image details from the upload metadata
    console.log("Width: " + uploadResult.width);
    console.log("Height: " + uploadResult.height);
    console.log("Format: " + uploadResult.format);
    console.log("File size (bytes): " + uploadResult.bytes);

    // 4. Transform the image
    const transformedUrl = cloudinary.url(uploadResult.public_id, {
      // f_auto: Automatically deliver the image in the most optimized format supported by the user's browser (e.g. WebP, AVIF).
      fetch_format: 'auto',
      // q_auto: Automatically compress the image quality to reduce file size while maintaining excellent visual appearance.
      quality: 'auto',
      secure: true
    });

    console.log("Done! Click link below to see optimized version of the image. Check the size and the format.");
    console.log(transformedUrl);
  } catch (error) {
    console.error("Error running Cloudinary script:", error);
    process.exit(1);
  }
}

run();
