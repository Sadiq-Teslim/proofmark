const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Upload an in-memory image buffer; returns { url, publicId }.
const uploadBuffer = async (buffer, folder, mime = 'image/png') => {
  const dataUri = `data:${mime};base64,${buffer.toString('base64')}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: 'image',
    unique_filename: true,
    overwrite: false,
  });
  return { url: result.secure_url, publicId: result.public_id };
};

module.exports = { cloudinary, uploadBuffer };
