import multer from 'multer';

// Use memoryStorage for direct upload to Cloudinary stream
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB file size limit
  }
});

export const uploadSingleImage = upload.single('image');
export const uploadMultipleImages = upload.array('images', 5);
export const uploadAvatar = upload.single('avatar');

export default upload;
