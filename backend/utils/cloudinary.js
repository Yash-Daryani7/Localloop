import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Uploads a file buffer or file path to Cloudinary.
 * Works with Multer memoryStorage using upload_stream.
 * @param {Buffer|string} file - File buffer or file path/data URI
 * @param {string} folder - Destination folder on Cloudinary
 * @returns {Promise<string>} - Resolves with secure_url
 */
export const uploadToCloudinary = (file, folder = 'localloop') => {
  return new Promise((resolve, reject) => {
    if (Buffer.isBuffer(file)) {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result.secure_url);
        }
      );
      uploadStream.end(file);
    } else if (typeof file === 'string') {
      cloudinary.uploader.upload(
        file,
        {
          folder,
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result.secure_url);
        }
      );
    } else {
      reject(new Error('Invalid file input for Cloudinary upload'));
    }
  });
};

/**
 * Deletes an asset from Cloudinary by its publicId.
 * @param {string} publicId - Cloudinary asset public ID
 * @returns {Promise<any>}
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw error;
  }
};

export default cloudinary;
