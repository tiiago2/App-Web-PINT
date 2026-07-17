const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

async function upload(file) {
  const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'evidencias_badges',
    resource_type: 'auto',
    use_filename: false,
    unique_filename: true
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type || 'image'
  };
}

async function remove(uploadInfo) {
  if (!uploadInfo?.publicId) return;
  await cloudinary.uploader.destroy(uploadInfo.publicId, {
    resource_type: uploadInfo.resourceType || 'image'
  });
}

module.exports = { upload, remove };

