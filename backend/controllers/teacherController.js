const User = require("../models/User");
const Teacher = require("../models/Teacher");
const Subject = require("../models/Subject");
const asyncHandler = require("../middleware/asyncHandler");

const populateTeacher = (q) => q.populate("user", "fullName email role createdAt");

// @route GET /api/teachers  (admin)
const getTeachers = asyncHandler(async (req, res) => {
  const teachers = await populateTeacher(Teacher.find()).sort({ createdAt: -1 }).lean();
  const withCounts = await Promise.all(
    teachers.map(async (t) => ({
      ...t,
      subjectCount: await Subject.countDocuments({ teacher: t._id }),
    }))
  );
  res.json({ success: true, count: withCounts.length, data: withCounts });
});

// @route GET /api/teachers/:id  (admin)
const getTeacher = asyncHandler(async (req, res) => {
  const teacher = await populateTeacher(Teacher.findById(req.params.id));
  if (!teacher) {
    res.status(404);
    throw new Error("Teacher not found");
  }
  const subjects = await Subject.find({ teacher: teacher._id }).populate(
    "class",
    "className academicYear"
  );
  res.json({ success: true, data: { ...teacher.toObject(), subjects } });
});

// @route POST /api/teachers  (admin)
const createTeacher = asyncHandler(async (req, res) => {
  const { fullName, email, password, department } = req.body;
  if (!fullName || !email || !password) {
    res.status(400);
    throw new Error("fullName, email and password are required");
  }
  if (await User.findOne({ email: email.toLowerCase() })) {
    res.status(409);
    throw new Error("Email already in use");
  }

  const user = await User.create({ fullName, email, password, role: "teacher" });
  const teacher = await Teacher.create({ user: user._id, department: department || "" });

  res.status(201).json({
    success: true,
    data: await populateTeacher(Teacher.findById(teacher._id)),
  });
});

// @route PUT /api/teachers/:id  (admin)
const updateTeacher = asyncHandler(async (req, res) => {
  const { fullName, email, password, department } = req.body;
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) {
    res.status(404);
    throw new Error("Teacher not found");
  }
  const user = await User.findById(teacher.user);
  if (!user) {
    res.status(404);
    throw new Error("Linked user account not found");
  }

  if (email && email.toLowerCase() !== user.email) {
    if (await User.findOne({ email: email.toLowerCase() })) {
      res.status(409);
      throw new Error("Email already in use");
    }
    user.email = email;
  }
  if (fullName !== undefined) user.fullName = fullName;
  if (password) user.password = password;
  await user.save();

  if (department !== undefined) teacher.department = department;
  await teacher.save();

  res.json({ success: true, data: await populateTeacher(Teacher.findById(teacher._id)) });
});

// @route DELETE /api/teachers/:id  (admin)
const deleteTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) {
    res.status(404);
    throw new Error("Teacher not found");
  }
  const subjectCount = await Subject.countDocuments({ teacher: teacher._id });
  if (subjectCount > 0) {
    res.status(409);
    throw new Error(
      "Cannot delete: this teacher is still assigned to subjects. Reassign them first."
    );
  }
  await User.findByIdAndDelete(teacher.user);
  await teacher.deleteOne();
  res.json({ success: true, message: "Teacher deleted" });
});

module.exports = {
  getTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher,
};
