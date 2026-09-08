const fs = require("fs");
const path = require("path");
const Lesson = require("../models/Lesson");
const Subject = require("../models/Subject");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const asyncHandler = require("../middleware/asyncHandler");
const { UPLOAD_DIR, COVER_DIR } = require("../middleware/uploadMiddleware");

// with lessonFields middleware, files arrive as req.files.<field>[0]
const pickFile = (req, field) => req.files?.[field]?.[0] || (field === "file" ? req.file : undefined);

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
 * Returns the subject document or throws with the right status.
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

  // student
  const student = await Student.findOne({ user: user._id });
  if (!student || !student.class || String(subject.class) !== String(student.class)) {
    res.status(403);
    throw new Error("This subject does not belong to your class");
  }
  return subject;
}

/**
 * Teacher-only: make sure the teacher owns the lesson (via its subject).
 */
async function assertOwnsLesson(user, lesson, res) {
  const teacher = await Teacher.findOne({ user: user._id });
  const subject = await Subject.findById(lesson.subject);
  if (!teacher || !subject || String(subject.teacher) !== String(teacher._id)) {
    res.status(403);
    throw new Error("You can only modify lessons for your own subjects");
  }
}

// @route GET /api/lessons?subject=<id>
const getLessons = asyncHandler(async (req, res) => {
  const { subject } = req.query;

  if (subject) {
    await assertCanViewSubject(req.user, subject, res);
    const lessons = await Lesson.find({ subject })
      .populate("subject", "subjectName subjectCode")
      .sort({ createdAt: -1 });
    return res.json({ success: true, count: lessons.length, data: lessons });
  }

  // no subject filter -> return everything the user is allowed to see
  let subjectIds = [];
  if (req.user.role === "admin") {
    const all = await Subject.find().select("_id");
    subjectIds = all.map((s) => s._id);
  } else if (req.user.role === "teacher") {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (teacher) {
      const subs = await Subject.find({ teacher: teacher._id }).select("_id");
      subjectIds = subs.map((s) => s._id);
    }
  } else {
    const student = await Student.findOne({ user: req.user._id });
    if (student && student.class) {
      const subs = await Subject.find({ class: student.class }).select("_id");
      subjectIds = subs.map((s) => s._id);
    }
  }

  const limit = Math.min(Number(req.query.limit) || 0, 50);
  let query = Lesson.find({ subject: { $in: subjectIds } })
    .populate("subject", "subjectName subjectCode class teacher")
    .sort({ createdAt: -1 });
  if (limit) query = query.limit(limit);
  const lessons = await query;
  res.json({ success: true, count: lessons.length, data: lessons });
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
  res.json({ success: true, data: lesson });
});

// @route POST /api/lessons  (teacher) - multipart: `file` (doc) + optional `cover` (image)
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

  if (!doc) abort(400, "A lesson file (PDF, DOCX or PPTX) is required");
  if (!subjectId || !title) abort(400, "subject and title are required");

  const subject = await Subject.findById(subjectId);
  if (!subject) abort(404, "Subject not found");

  const teacher = await Teacher.findOne({ user: req.user._id });
  if (!teacher || String(subject.teacher) !== String(teacher._id)) {
    abort(403, "You can only upload lessons to your own subjects");
  }

  const lesson = await Lesson.create({
    subject: subjectId,
    title,
    description: description || "",
    filePath: doc.filename,
    fileName: doc.originalname,
    fileType: doc.resolvedType,
    fileSize: doc.size,
    coverImage: cover ? cover.filename : "",
    uploadedBy: req.user._id,
  });

  res.status(201).json({ success: true, data: lesson });
});

// @route PUT /api/lessons/:id  (teacher owns it) - `file` and `cover` both optional
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
  if (title !== undefined) lesson.title = title;
  if (description !== undefined) lesson.description = description;

  if (doc) {
    cleanupFile(path.join(UPLOAD_DIR, lesson.filePath));
    lesson.filePath = doc.filename;
    lesson.fileName = doc.originalname;
    lesson.fileType = doc.resolvedType;
    lesson.fileSize = doc.size;
  }

  if (cover) {
    if (lesson.coverImage) cleanupFile(path.join(COVER_DIR, lesson.coverImage));
    lesson.coverImage = cover.filename;
  } else if (removeCover === "true" || removeCover === true) {
    if (lesson.coverImage) cleanupFile(path.join(COVER_DIR, lesson.coverImage));
    lesson.coverImage = "";
  }

  await lesson.save();
  res.json({ success: true, data: lesson });
});

// @route DELETE /api/lessons/:id  (teacher owns it)
const deleteLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) {
    res.status(404);
    throw new Error("Lesson not found");
  }
  await assertOwnsLesson(req.user, lesson, res);
  cleanupFile(path.join(UPLOAD_DIR, lesson.filePath));
  if (lesson.coverImage) cleanupFile(path.join(COVER_DIR, lesson.coverImage));
  await lesson.deleteOne();
  res.json({ success: true, message: "Lesson deleted" });
});

// @route GET /api/lessons/:id/download  - force download
// @route GET /api/lessons/:id/preview   - inline (browser preview, useful for PDF)
const serveFile = (disposition) =>
  asyncHandler(async (req, res) => {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      res.status(404);
      throw new Error("Lesson not found");
    }
    await assertCanViewSubject(req.user, lesson.subject, res);

    const absPath = path.join(UPLOAD_DIR, lesson.filePath);
    if (!fs.existsSync(absPath)) {
      res.status(404);
      throw new Error("File is missing on the server");
    }

    const safeName = lesson.fileName.replace(/"/g, "");
    res.setHeader("Content-Type", MIME[lesson.fileType] || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename="${safeName}"`
    );
    fs.createReadStream(absPath).pipe(res);
  });

function cleanupFile(p) {
  try {
    if (p && fs.existsSync(p)) fs.unlinkSync(p);
  } catch {
    /* ignore */
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
