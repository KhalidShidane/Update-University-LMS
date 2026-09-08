const mongoose = require("mongoose");
const User = require("../models/User");
const Student = require("../models/Student");
const Class = require("../models/Class");
const asyncHandler = require("../middleware/asyncHandler");

const populateStudent = (q) =>
  q.populate("user", "fullName email role createdAt").populate("class", "className academicYear");

// @route GET /api/students  (admin)
const getStudents = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.class) filter.class = req.query.class;
  const students = await populateStudent(Student.find(filter)).sort({ createdAt: -1 });
  res.json({ success: true, count: students.length, data: students });
});

// @route GET /api/students/:id  (admin)
const getStudent = asyncHandler(async (req, res) => {
  const student = await populateStudent(Student.findById(req.params.id));
  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }
  res.json({ success: true, data: student });
});

// @route POST /api/students  (admin) - create the user + student profile
const createStudent = asyncHandler(async (req, res) => {
  const { fullName, email, password, studentId, class: classId } = req.body;

  if (!fullName || !email || !password || !studentId) {
    res.status(400);
    throw new Error("fullName, email, password and studentId are required");
  }

  if (await User.findOne({ email: email.toLowerCase() })) {
    res.status(409);
    throw new Error("Email already in use");
  }
  if (await Student.findOne({ studentId: studentId.toUpperCase() })) {
    res.status(409);
    throw new Error("Student ID already in use");
  }
  if (classId && !(await Class.findById(classId))) {
    res.status(400);
    throw new Error("Assigned class does not exist");
  }

  const user = await User.create({ fullName, email, password, role: "student" });
  const student = await Student.create({
    user: user._id,
    studentId: studentId.toUpperCase(),
    class: classId || null,
  });

  res.status(201).json({
    success: true,
    data: await populateStudent(Student.findById(student._id)),
  });
});

// @route PUT /api/students/:id  (admin) - update profile + assign class
const updateStudent = asyncHandler(async (req, res) => {
  const { fullName, email, password, studentId, class: classId } = req.body;

  const student = await Student.findById(req.params.id);
  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }
  const user = await User.findById(student.user);
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

  if (studentId && studentId.toUpperCase() !== student.studentId) {
    if (await Student.findOne({ studentId: studentId.toUpperCase() })) {
      res.status(409);
      throw new Error("Student ID already in use");
    }
    student.studentId = studentId.toUpperCase();
  }
  if (classId !== undefined) {
    if (classId && !(await Class.findById(classId))) {
      res.status(400);
      throw new Error("Assigned class does not exist");
    }
    student.class = classId || null;
  }
  await student.save();

  res.json({ success: true, data: await populateStudent(Student.findById(student._id)) });
});

// @route DELETE /api/students/:id  (admin) - removes student profile + user
const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }
  await User.findByIdAndDelete(student.user);
  await student.deleteOne();
  res.json({ success: true, message: "Student deleted" });
});

module.exports = {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
};
