import multer from 'multer';

// Use memoryStorage — files are held in memory as buffers
// and then uploaded to Firebase Storage (not written to disk)
export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    cb(null, allowed.includes(file.mimetype) || /\.(pdf|docx)$/i.test(file.originalname));
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB max
});
