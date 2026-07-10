const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');

function streamUpload(fileBuffer, folder = 'shnoor-drive') {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
}

async function destroyAsset(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
  } catch (err) {
    console.error(`Failed to remove Cloudinary asset ${publicId}:`, err.message);
  }
}

module.exports = { streamUpload, destroyAsset };
