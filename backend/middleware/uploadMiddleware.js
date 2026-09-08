const path = require("path");
const fs = require("fs");
const multer = require("multer");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
const AVATAR_DIR = path.join(UPLOAD_DIR, "avatars");
const COVER_DIR = path.join(UPLOAD_DIR, "covers");
const SUBJECT_DIR = path.join(UPLOAD_DIR, "subjects");
const ASSIGNMENT_DIR = path.join(UPLOAD_DIR, "assignments");
const SUBMISSION_DIR = path.join(UPLOAD_DIR, "submissions");
for (const dir of [UPLOAD_DIR, AVATAR_DIR, COVER_DIR, SUBJECT_DIR, ASSIGNMENT_DIR, SUBMISSION_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const MAX_FILE_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB || 15);
const MAX_AVATAR_SIZE_MB = 3;
const MAX_COVER_SIZE_MB = 4;
const MAX_SUBJECT_IMAGE_MB = 4;

// Allowed academic document types (lessons, assignment briefs, submissions)
const ALLOWED = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/msword": "docx",
  "application/vnd.ms-powerpoint": "pptx",
  "application/vnd.ms-excel": "xlsx",
  "application/zip": "zip",
  "application/x-zip-compressed": "zip",
  "application/x-zip": "zip",
  "text/plain": "txt",
  "text/csv": "csv",
};

const EXT_FALLBACK = {
  ".pdf": "pdf",
  ".doc": "docx",
  ".docx": "docx",
  ".ppt": "pptx",
  ".pptx": "pptx",
  ".xls": "xlsx",
  ".xlsx": "xlsx",
  ".zip": "zip",
  ".txt": "txt",
  ".csv": "csv",
};

const ACADEMIC_LABEL = "PDF, DOCX, PPTX, XLSX, ZIP, TXT or CSV";

const IMAGE_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

const isImage = (file) =>
  !!IMAGE_TYPES[file.mimetype] || IMAGE_EXT.has(path.extname(file.originalname).toLowerCase());

function safeBase(name) {
  const ext = path.extname(name).toLowerCase();
  return path.basename(name, ext).replace(/[^a-z0-9_-]/gi, "_").slice(0, 60);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${safeBase(file.originalname)}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const type = ALLOWED[file.mimetype] || EXT_FALLBACK[ext];
  if (type) {
    file.resolvedType = type;
    return cb(null, true);
  }
  cb(new Error(`Invalid file type. Allowed: ${ACADEMIC_LABEL}.`));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
});

const uploadSingle = (field) => (req, res, next) => {
  upload.single(field)(req, res, (err) => {
    if (err) {
      res.status(400);
      return next(err instanceof Error ? err : new Error(String(err)));
    }
    next();
  });
};

// ---- Lesson upload: a document (`file`) + an optional cover image (`cover`) ----
const lessonStorage = multer.diskStorage({
  destination: (_req, file, cb) => cb(null, file.fieldname === "cover" ? COVER_DIR : UPLOAD_DIR),
  filename: (_req, file, cb) => {
    if (file.fieldname === "cover") {
      const ext = IMAGE_TYPES[file.mimetype] || path.extname(file.originalname).toLowerCase() || ".jpg";
      return cb(null, `cover-${Date.now()}${ext}`);
    }
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${safeBase(file.originalname)}${ext}`);
  },
});

const lessonFileFilter = (_req, file, cb) => {
  if (file.fieldname === "cover") {
    if (isImage(file)) return cb(null, true);
    return cb(new Error("Cover image must be a JPG, PNG, WEBP or GIF."));
  }
  const ext = path.extname(file.originalname).toLowerCase();
  const type = ALLOWED[file.mimetype] || EXT_FALLBACK[ext];
  if (type) {
    file.resolvedType = type;
    return cb(null, true);
  }
  cb(new Error(`Invalid file type. Allowed: ${ACADEMIC_LABEL}.`));
};

const lessonUpload = multer({
  storage: lessonStorage,
  fileFilter: lessonFileFilter,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
});

const lessonFields = (req, res, next) => {
  lessonUpload.fields([
    { name: "file", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      res.status(400);
      return next(err instanceof Error ? err : new Error(String(err)));
    }
    next();
  });
};

// ---- Avatar (profile photo) uploads --------------------------------------
const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) => {
    const ext = IMAGE_TYPES[file.mimetype] || path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `${req.user?._id || "user"}-${Date.now()}${ext}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: MAX_AVATAR_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (isImage(file)) return cb(null, true);
    cb(new Error("Invalid image. Use JPG, PNG, WEBP or GIF."));
  },
});

const avatarSingle = (field) => (req, res, next) => {
  avatarUpload.single(field)(req, res, (err) => {
    if (err) {
      res.status(400);
      return next(err instanceof Error ? err : new Error(String(err)));
    }
    next();
  });
};

// ---- Subject image uploads ---------------------------------------------
const subjectStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, SUBJECT_DIR),
  filename: (_req, file, cb) => {
    const ext = IMAGE_TYPES[file.mimetype] || path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `subject-${Date.now()}${ext}`);
  },
});

const subjectImageUpload = multer({
  storage: subjectStorage,
  limits: { fileSize: MAX_SUBJECT_IMAGE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (isImage(file)) return cb(null, true);
    cb(new Error("Subject image must be a JPG, PNG, WEBP or GIF."));
  },
});

const subjectImageSingle = (field) => (req, res, next) => {
  subjectImageUpload.single(field)(req, res, (err) => {
    if (err) {
      res.status(400);
      return next(err instanceof Error ? err : new Error(String(err)));
    }
    next();
  });
};

// ---- Generic academic-document uploader (assignment briefs & submissions) ----
const academicSingle = (field, dir) => {
  const m = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, dir),
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${safeBase(file.originalname)}${ext}`);
      },
    }),
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
  });
  return (req, res, next) => {
    m.single(field)(req, res, (err) => {
      if (err) {
        res.status(400);
        return next(err instanceof Error ? err : new Error(String(err)));
      }
      next();
    });
  };
};

module.exports = {
  upload,
  uploadSingle,
  lessonFields,
  avatarSingle,
  subjectImageSingle,
  academicSingle,
  UPLOAD_DIR,
  AVATAR_DIR,
  COVER_DIR,
  SUBJECT_DIR,
  ASSIGNMENT_DIR,
  SUBMISSION_DIR,
  MAX_FILE_SIZE_MB,
  MAX_AVATAR_SIZE_MB,
  MAX_COVER_SIZE_MB,
  MAX_SUBJECT_IMAGE_MB,
};
