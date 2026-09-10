const fs = require("fs");
const path = require("path");
const https = require("https");

const Lesson = require("../models/Lesson");
const Subject = require("../models/Subject");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const asyncHandler = require("../middleware/asyncHandler");
const { UPLOAD_DIR, COVER_DIR } = require("../middleware/uploadMiddleware");
const cloudinary = require("../config/cloudinary");

// with lessonFields middleware, files arrive as req.files.<field>[0]
const pickFile = (req, field) =>
  req.files?.[field]?.[0] || (field === "file" ? req.file : undefined);

const MIME = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  zip: "application/zip",
  txt: "text/plain",
  csv: "text/csv",
};

/**
 * Make sure the logged-in user is allowed to see lessons of `subjectId`.
 */
async function assertCanViewSubject(user, subjectId, res) {
  const subject = await Subject.findById(subjectId);

  if (!subject) {
    res.status(404);
    throw new Error("Subject not found");
  }

  if (user.role === "admin") return subject;

  if (user.role === "teacher") {
    const teacher = await Teacher.findOne({ user: user._id });

    if (!teacher || String(subject.teacher) !== String(teacher._id)) {
      res.status(403);
      throw new Error("You are not assigned to this subject");
    }

    return subject;
  }

  const student = await Student.findOne({ user: user._id });

  if (
    !student ||
    !student.class ||
    String(subject.class) !== String(student.class)
  ) {
    res.status(403);
    throw new Error("This subject does not belong to your class");
  }

  return subject;
}

/**
 * Teacher-only: make sure the teacher owns the lesson.
 */
async function assertOwnsLesson(user, lesson, res) {
  const teacher = await Teacher.findOne({ user: user._id });
  const subject = await Subject.findById(lesson.subject);

  if (
    !teacher ||
    !subject ||
    String(subject.teacher) !== String(teacher._id)
  ) {
    res.status(403);
    throw new Error("You can only modify lessons for your own subjects");
  }
}

/**
 * Upload local file to Cloudinary.
 */
function uploadToCloudinary(filePath, folder, resourceType = "auto") {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
  });
}

/**
 * Delete Cloudinary file.
 */
async function deleteFromCloudinary(publicId, resourceType = "auto") {
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    console.error("Cloudinary delete error:", error.message);
  }
}

/**
 * Download file from URL and pipe it to response.
 */
function streamUrlToResponse(url, res, contentType, disposition) {
  https
    .get(url, (cloudRes) => {
      if (cloudRes.statusCode >= 300 && cloudRes.statusCode < 400) {
        return streamUrlToResponse(
          cloudRes.headers.location,
          res,
          contentType,
          disposition
        );
      }

      if (cloudRes.statusCode !== 200) {
        res.status(404);
        return res.end("File not found");
      }

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", disposition);

      cloudRes.pipe(res);
    })
    .on("error", (error) => {
      console.error("Cloudinary stream error:", error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Unable to retrieve file",
        });
      }
    });
}

// @route GET /api/lessons?subject=<id>
const getLessons = asyncHandler(async (req, res) => {
  const { subject } = req.query;

  if (subject) {
    await assertCanViewSubject(req.user, subject, res);

    const lessons = await Lesson.find({ subject })
      .populate("subject", "subjectName subjectCode")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: lessons.length,
      data: lessons,
    });
  }

  let subjectIds = [];

  if (req.user.role === "admin") {
    const all = await Subject.find().select("_id");
    subjectIds = all.map((s) => s._id);
  } else if (req.user.role === "teacher") {
    const teacher = await Teacher.findOne({ user: req.user._id });

    if (teacher) {
      const subs = await Subject.find({
        teacher: teacher._id,
      }).select("_id");

      subjectIds = subs.map((s) => s._id);
    }
  } else {
    const student = await Student.findOne({
      user: req.user._id,
    });

    if (student && student.class) {
      const subs = await Subject.find({
        class: student.class,
      }).select("_id");

      subjectIds = subs.map((s) => s._id);
    }
  }

  const limit = Math.min(Number(req.query.limit) || 0, 50);

  let query = Lesson.find({
    subject: { $in: subjectIds },
  })
    .populate("subject", "subjectName subjectCode class teacher")
    .sort({ createdAt: -1 });

  if (limit) query = query.limit(limit);

  const lessons = await query;

  res.json({
    success: true,
    count: lessons.length,
    data: lessons,
  });
});

// @route GET /api/lessons/:id
const getLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id).populate(
    "subject",
    "subjectName subjectCode class teacher"
  );

  if (!lesson) {
    res.status(404);
    throw new Error("Lesson not found");
  }

  await assertCanViewSubject(req.user, lesson.subject._id, res);

  res.json({
    success: true,
    data: lesson,
  });
});

// @route POST /api/lessons
const createLesson = asyncHandler(async (req, res) => {
  const { subject: subjectId, title, description } = req.body;

  const doc = pickFile(req, "file");
  const cover = pickFile(req, "cover");

  const abort = (status, msg) => {
    if (doc) cleanupFile(doc.path);
    if (cover) cleanupFile(cover.path);

    res.status(status);
    throw new Error(msg);
  };

  if (!doc) {
    abort(400, "A lesson file (PDF, DOCX or PPTX) is required");
  }

  if (!subjectId || !title) {
    abort(400, "subject and title are required");
  }

  const subject = await Subject.findById(subjectId);

  if (!subject) {
    abort(404, "Subject not found");
  }

  const teacher = await Teacher.findOne({
    user: req.user._id,
  });

  if (!teacher || String(subject.teacher) !== String(teacher._id)) {
    abort(403, "You can only upload lessons to your own subjects");
  }

  let cloudFile;
  let cloudCover;

  try {
    cloudFile = await uploadToCloudinary(
      doc.path,
      "university-lms/lessons",
      "auto"
    );

    if (cover) {
      cloudCover = await uploadToCloudinary(
        cover.path,
        "university-lms/covers",
        "image"
      );
    }
  } catch (error) {
    cleanupFile(doc.path);
    cleanupFile(cover?.path);

    console.error("Cloudinary upload error:", error);

    res.status(500);
    throw new Error("Failed to upload lesson file");
  }

  cleanupFile(doc.path);
  cleanupFile(cover?.path);

  const lesson = await Lesson.create({
    subject: subjectId,
    title,
    description: description || "",

    filePath: "",
    fileName: doc.originalname,
    fileType: doc.resolvedType,
    fileSize: doc.size,

    cloudinaryUrl: cloudFile.secure_url,
    cloudinaryPublicId: cloudFile.public_id,
    cloudinaryResourceType: cloudFile.resource_type,

    coverImage: "",
    coverUrl: cloudCover ? cloudCover.secure_url : "",
    coverPublicId: cloudCover ? cloudCover.public_id : "",

    uploadedBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    data: lesson,
  });
});

// @route PUT /api/lessons/:id
const updateLesson = asyncHandler(async (req, res) => {
  const doc = pickFile(req, "file");
  const cover = pickFile(req, "cover");

  const lesson = await Lesson.findById(req.params.id);

  if (!lesson) {
    if (doc) cleanupFile(doc.path);
    if (cover) cleanupFile(cover.path);

    res.status(404);
    throw new Error("Lesson not found");
  }

  await assertOwnsLesson(req.user, lesson, res);

  const { title, description, removeCover } = req.body;

  if (title !== undefined) {
    lesson.title = title;
  }

  if (description !== undefined) {
    lesson.description = description;
  }

  // New lesson file
  if (doc) {
    let cloudFile;

    try {
      cloudFile = await uploadToCloudinary(
        doc.path,
        "university-lms/lessons",
        "auto"
      );
    } catch (error) {
      cleanupFile(doc.path);

      console.error("Cloudinary upload error:", error);

      res.status(500);
      throw new Error("Failed to upload lesson file");
    }

    cleanupFile(doc.path);

    // Delete old Cloudinary file
    if (lesson.cloudinaryPublicId) {
      await deleteFromCloudinary(
        lesson.cloudinaryPublicId,
        lesson.cloudinaryResourceType || "auto"
      );
    } else if (lesson.filePath) {
      cleanupFile(path.join(UPLOAD_DIR, lesson.filePath));
    }

    lesson.filePath = "";
    lesson.fileName = doc.originalname;
    lesson.fileType = doc.resolvedType;
    lesson.fileSize = doc.size;

    lesson.cloudinaryUrl = cloudFile.secure_url;
    lesson.cloudinaryPublicId = cloudFile.public_id;
    lesson.cloudinaryResourceType = cloudFile.resource_type;
  }

  // New cover
  if (cover) {
    let cloudCover;

    try {
      cloudCover = await uploadToCloudinary(
        cover.path,
        "university-lms/covers",
        "image"
      );
    } catch (error) {
      cleanupFile(cover.path);

      console.error("Cloudinary cover upload error:", error);

      res.status(500);
      throw new Error("Failed to upload cover image");
    }

    cleanupFile(cover.path);

    if (lesson.coverPublicId) {
      await deleteFromCloudinary(lesson.coverPublicId, "image");
    } else if (lesson.coverImage) {
      cleanupFile(path.join(COVER_DIR, lesson.coverImage));
    }

    lesson.coverImage = "";
    lesson.coverUrl = cloudCover.secure_url;
    lesson.coverPublicId = cloudCover.public_id;
  } else if (removeCover === "true" || removeCover === true) {
    if (lesson.coverPublicId) {
      await deleteFromCloudinary(lesson.coverPublicId, "image");
    } else if (lesson.coverImage) {
      cleanupFile(path.join(COVER_DIR, lesson.coverImage));
    }

    lesson.coverImage = "";
    lesson.coverUrl = "";
    lesson.coverPublicId = "";
  }

  await lesson.save();

  res.json({
    success: true,
    data: lesson,
  });
});

// @route DELETE /api/lessons/:id
const deleteLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);

  if (!lesson) {
    res.status(404);
    throw new Error("Lesson not found");
  }

  await assertOwnsLesson(req.user, lesson, res);

  // Delete lesson file from Cloudinary
  if (lesson.cloudinaryPublicId) {
    await deleteFromCloudinary(
      lesson.cloudinaryPublicId,
      lesson.cloudinaryResourceType || "auto"
    );
  } else if (lesson.filePath) {
    cleanupFile(path.join(UPLOAD_DIR, lesson.filePath));
  }

  // Delete cover from Cloudinary
  if (lesson.coverPublicId) {
    await deleteFromCloudinary(lesson.coverPublicId, "image");
  } else if (lesson.coverImage) {
    cleanupFile(path.join(COVER_DIR, lesson.coverImage));
  }

  await lesson.deleteOne();

  res.json({
    success: true,
    message: "Lesson deleted",
  });
});

// @route GET /api/lessons/:id/download
// @route GET /api/lessons/:id/preview
const serveFile = (disposition) =>
  asyncHandler(async (req, res) => {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      res.status(404);
      throw new Error("Lesson not found");
    }

    await assertCanViewSubject(req.user, lesson.subject, res);

    const safeName = (lesson.fileName || "lesson").replace(/"/g, "");

    const contentType =
      MIME[lesson.fileType] || "application/octet-stream";

    const finalDisposition =
      `${disposition}; filename="${safeName}"`;

    // New Cloudinary file
    if (lesson.cloudinaryUrl) {
      return streamUrlToResponse(
        lesson.cloudinaryUrl,
        res,
        contentType,
        finalDisposition
      );
    }

    // Old local file fallback
    if (lesson.filePath) {
      const absPath = path.join(UPLOAD_DIR, lesson.filePath);

      if (!fs.existsSync(absPath)) {
        res.status(404);
        throw new Error("File is missing on the server");
      }

      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        finalDisposition
      );

      return fs.createReadStream(absPath).pipe(res);
    }

    res.status(404);
    throw new Error("Lesson file not found");
  });

function cleanupFile(p) {
  try {
    if (p && fs.existsSync(p)) {
      fs.unlinkSync(p);
    }
  } catch {
    // ignore
  }
}

module.exports = {
  getLessons,
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson,
  downloadLesson: serveFile("attachment"),
  previewLesson: serveFile("inline"),
};