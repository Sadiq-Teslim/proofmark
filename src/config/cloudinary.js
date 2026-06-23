const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Upload an in-memory asset buffer; returns { url, publicId, width, height, duration }.
const uploadBuffer = async (buffer, folder, mime = 'image/png', resourceType = 'image') => {
  const dataUri = `data:${mime};base64,${buffer.toString('base64')}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: resourceType,
    unique_filename: true,
    overwrite: false,
  });
  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width || null,
    height: result.height || null,
    duration: result.duration || null,
  };
};

const uploadFile = async (filePath, folder, resourceType = 'video') => {
  const result = await cloudinary.uploader.upload_large(filePath, {
    folder,
    resource_type: resourceType,
    unique_filename: true,
    overwrite: false,
  });
  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width || null,
    height: result.height || null,
    duration: result.duration || null,
  };
};

module.exports = { cloudinary, uploadBuffer, uploadFile };
