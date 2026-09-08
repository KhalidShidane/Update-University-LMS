const Class = require("../models/Class");
const Student = require("../models/Student");
const Subject = require("../models/Subject");
require("../models/Teacher");
require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");

// @route GET /api/classes/public  (no auth - used by the student registration form)
const getPublicClasses = asyncHandler(async (_req, res) => {
  const classes = await Class.find().sort({ className: 1 }).lean();
  const data = await Promise.all(
    classes.map(async (c) => ({
      _id: c._id,
      className: c.className,
      academicYear: c.academicYear,
      subjectCount: await Subject.countDocuments({
        class: c._id,
        status: { $ne: "inactive" },
      }),
    }))
  );
  res.json({ success: true, data });
});

// @route GET /api/classes/public/:id/subjects  (no auth - preview courses for a class)
const getPublicClassSubjects = asyncHandler(async (req, res) => {
  const klass = await Class.findById(req.params.id).lean();
  if (!klass) {
    res.status(404);
    throw new Error("Class not found");
  }
  const subjects = await Subject.find({ class: klass._id, status: { $ne: "inactive" } })
    .populate({ path: "teacher", populate: { path: "user", select: "fullName" } })
    .sort({ subjectName: 1 })
    .lean();

  const data = subjects.map((s) => ({
    _id: s._id,
    subjectName: s.subjectName,
    subjectCode: s.subjectCode,
    imageUrl: s.image ? `/uploads/subjects/${s.image}` : "",
    teacher: s.teacher?.user?.fullName || "",
  }));

  res.json({
    success: true,
    class: { _id: klass._id, className: klass.className, academicYear: klass.academicYear },
    data,
  });
});

// @route GET /api/classes
const getClasses = asyncHandler(async (req, res) => {
  const classes = await Class.find().sort({ createdAt: -1 }).lean();

  // attach counts for the admin dashboard
  const withCounts = await Promise.all(
    classes.map(async (c) => {
      const [studentCount, subjectCount] = await Promise.all([
        Student.countDocuments({ class: c._id }),
        Subject.countDocuments({ class: c._id }),
      ]);
      return { ...c, studentCount, subjectCount };
    })
  );

  res.json({ success: true, count: withCounts.length, data: withCounts });
});

// @route GET /api/classes/:id
const getClass = asyncHandler(async (req, res) => {
  const klass = await Class.findById(req.params.id).lean();
  if (!klass) {
    res.status(404);
    throw new Error("Class not found");
  }

  const students = await Student.find({ class: klass._id })
    .populate("user", "fullName email")
    .lean();
  const subjects = await Subject.find({ class: klass._id })
    .populate("class", "className academicYear")
    .populate({ path: "teacher", populate: { path: "user", select: "fullName email" } })
    .lean();

  res.json({ success: true, data: { ...klass, students, subjects } });
});

// @route POST /api/classes
const createClass = asyncHandler(async (req, res) => {
  const { className, academicYear } = req.body;
  const klass = await Class.create({ className, academicYear });
  res.status(201).json({ success: true, data: klass });
});

// @route PUT /api/classes/:id
const updateClass = asyncHandler(async (req, res) => {
  const { className, academicYear } = req.body;
  const klass = await Class.findById(req.params.id);
  if (!klass) {
    res.status(404);
    throw new Error("Class not found");
  }
  if (className !== undefined) klass.className = className;
  if (academicYear !== undefined) klass.academicYear = academicYear;
  await klass.save();
  res.json({ success: true, data: klass });
});

// @route DELETE /api/classes/:id
const deleteClass = asyncHandler(async (req, res) => {
  const klass = await Class.findById(req.params.id);
  if (!klass) {
    res.status(404);
    throw new Error("Class not found");
  }

  const subjectCount = await Subject.countDocuments({ class: klass._id });
  if (subjectCount > 0) {
    res.status(409);
    throw new Error("Cannot delete: this class still has subjects. Remove them first.");
  }

  // unassign any students that belonged to this class
  await Student.updateMany({ class: klass._id }, { $set: { class: null } });
  await klass.deleteOne();

  res.json({ success: true, message: "Class deleted" });
});

module.exports = {
  getPublicClasses,
  getPublicClassSubjects,
  getClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
};
