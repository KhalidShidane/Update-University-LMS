const fs = require("fs");
const path = require("path");
const Subject = require("../models/Subject");
const Class = require("../models/Class");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const Lesson = require("../models/Lesson");
const asyncHandler = require("../middleware/asyncHandler");
const { SUBJECT_DIR } = require("../middleware/uploadMiddleware");

const populateSubject = (q) =>
  q
    .populate("class", "className academicYear")
    .populate({ path: "teacher", populate: { path: "user", select: "fullName email avatar" } });

const VALID_STATUS = ["active", "inactive"];

function cleanupFile(p) {
  try {
    if (p && fs.existsSync(p)) fs.unlinkSync(p);
  } catch {
    /* ignore */
  }
}

// `.lean()` skips schema virtuals, so add the derived fields by hand.
function decorate(s) {
  return {
    ...s,
    status: s.status || "active",
    imageUrl: s.image ? `/uploads/subjects/${s.image}` : "",
  };
}

async function teacherForUser(userId) {
  return Teacher.findOne({ user: userId });
}
async function studentForUser(userId) {
  return Student.findOne({ user: userId });
}

// @route GET /api/subjects
// admin   -> all subjects (optional ?class= / ?teacher= / ?status= filters)
// teacher -> only subjects assigned to them
// student -> only ACTIVE subjects of their class
const getSubjects = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.user.role === "admin") {
    if (req.query.class) filter.class = req.query.class;
    if (req.query.teacher) filter.teacher = req.query.teacher;
    if (VALID_STATUS.includes(req.query.status)) filter.status = req.query.status;
  } else if (req.user.role === "teacher") {
    const teacher = await teacherForUser(req.user._id);
    if (!teacher) return res.json({ success: true, count: 0, data: [] });
    filter.teacher = teacher._id;
  } else {
    const student = await studentForUser(req.user._id);
    if (!student || !student.class) return res.json({ success: true, count: 0, data: [] });
    filter.class = student.class;
    filter.status = { $ne: "inactive" }; // hide inactive subjects from students
  }

  const subjects = await populateSubject(Subject.find(filter)).sort({ createdAt: -1 }).lean();
  const withCounts = await Promise.all(
    subjects.map(async (s) => ({
      ...decorate(s),
      lessonCount: await Lesson.countDocuments({ subject: s._id }),
    }))
  );

  res.json({ success: true, count: withCounts.length, data: withCounts });
});

// @route GET /api/subjects/:id  (role-checked)
const getSubject = asyncHandler(async (req, res) => {
  const subject = await populateSubject(Subject.findById(req.params.id));
  if (!subject) {
    res.status(404);
    throw new Error("Subject not found");
  }

  if (req.user.role === "teacher") {
    const teacher = await teacherForUser(req.user._id);
    if (!teacher || String(subject.teacher._id) !== String(teacher._id)) {
      res.status(403);
      throw new Error("You are not assigned to this subject");
    }
  } else if (req.user.role === "student") {
    const student = await studentForUser(req.user._id);
    if (!student || !student.class || String(subject.class._id) !== String(student.class)) {
      res.status(403);
      throw new Error("This subject does not belong to your class");
    }
    if (subject.status === "inactive") {
      res.status(403);
      throw new Error("This subject is not currently active");
    }
  }

  const lessons = await Lesson.find({ subject: subject._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: { ...subject.toObject(), lessons } });
});

// @route POST /api/subjects  (admin) - multipart: fields + optional `image`
const createSubject = asyncHandler(async (req, res) => {
  const { subjectName, subjectCode, description, status, class: classId, teacher: teacherId } =
    req.body;
  const image = req.file;

  const abort = (code, msg) => {
    if (image) cleanupFile(image.path);
    res.status(code);
    throw new Error(msg);
  };

  if (!subjectName || !subjectCode || !classId || !teacherId) {
    abort(400, "subjectName, subjectCode, class and teacher are required");
  }
  if (status && !VALID_STATUS.includes(status)) abort(400, "Status must be active or inactive");
  if (!(await Class.findById(classId))) abort(400, "Class does not exist");
  if (!(await Teacher.findById(teacherId))) abort(400, "Teacher does not exist");

  const subject = await Subject.create({
    subjectName,
    subjectCode: subjectCode.toUpperCase(),
    description: description || "",
    status: status || "active",
    image: image ? image.filename : "",
    class: classId,
    teacher: teacherId,
  });

  res.status(201).json({
    success: true,
    data: await populateSubject(Subject.findById(subject._id)),
  });
});

// @route PUT /api/subjects/:id  (admin) - multipart: fields + optional `image` / `removeImage`
const updateSubject = asyncHandler(async (req, res) => {
  const {
    subjectName,
    subjectCode,
    description,
    status,
    removeImage,
    class: classId,
    teacher: teacherId,
  } = req.body;
  const image = req.file;

  const subject = await Subject.findById(req.params.id);
  if (!subject) {
    if (image) cleanupFile(image.path);
    res.status(404);
    throw new Error("Subject not found");
  }

  const abort = (code, msg) => {
    if (image) cleanupFile(image.path);
    res.status(code);
    throw new Error(msg);
  };

  if (status && !VALID_STATUS.includes(status)) abort(400, "Status must be active or inactive");
  if (classId && !(await Class.findById(classId))) abort(400, "Class does not exist");
  if (teacherId && !(await Teacher.findById(teacherId))) abort(400, "Teacher does not exist");

  if (subjectName !== undefined) subject.subjectName = subjectName;
  if (subjectCode !== undefined) subject.subjectCode = subjectCode.toUpperCase();
  if (description !== undefined) subject.description = description;
  if (status !== undefined) subject.status = status;
  if (classId !== undefined) subject.class = classId;
  if (teacherId !== undefined) subject.teacher = teacherId;

  if (image) {
    if (subject.image) cleanupFile(path.join(SUBJECT_DIR, subject.image));
    subject.image = image.filename;
  } else if (removeImage === "true" || removeImage === true) {
    if (subject.image) cleanupFile(path.join(SUBJECT_DIR, subject.image));
    subject.image = "";
  }

  await subject.save();

  res.json({
    success: true,
    data: await populateSubject(Subject.findById(subject._id)),
  });
});

// @route DELETE /api/subjects/:id  (admin)
const deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) {
    res.status(404);
    throw new Error("Subject not found");
  }
  const lessonCount = await Lesson.countDocuments({ subject: subject._id });
  if (lessonCount > 0) {
    res.status(409);
    throw new Error("Cannot delete: this subject still has lessons. Remove them first.");
  }
  if (subject.image) cleanupFile(path.join(SUBJECT_DIR, subject.image));
  await subject.deleteOne();
  res.json({ success: true, message: "Subject deleted" });
});

module.exports = {
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
};
