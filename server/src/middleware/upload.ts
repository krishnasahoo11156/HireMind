import multer from 'multer';

export const upload = multer({
  storage: multer.diskStorage({
    destination: 'server/uploads',
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
  }),
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    cb(null, allowed.includes(file.mimetype) || /\.(pdf|docx)$/i.test(file.originalname));
  }
});
