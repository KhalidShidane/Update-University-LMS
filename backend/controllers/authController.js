const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const User = require("../models/User");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Class = require("../models/Class");
const asyncHandler = require("../middleware/asyncHandler");
const generateToken = require("../utils/generateToken");
const { AVATAR_DIR } = require("../middleware/uploadMiddleware");

/**
 * Build the profile payload returned to the client, including role-specific data.
 */
async function buildProfile(user) {
  const base = {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    avatar: user.avatar || "",
    avatarUrl: user.avatar ? `/uploads/avatars/${user.avatar}` : "",
    createdAt: user.createdAt,
  };

  if (user.role === "student") {
    const student = await Student.findOne({ user: user._id }).populate("class");
    base.student = student || null;
  }
  if (user.role === "teacher") {
    const teacher = await Teacher.findOne({ user: user._id });
    base.teacher = teacher || null;
  }
  return base;
}

// @route POST /api/auth/register  (public - students only)
const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, studentId, class: classId } = req.body;

  if (!fullName || !email || !password || !studentId) {
    res.status(400);
    throw new Error("fullName, email, password and studentId are required");
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    res.status(409);
    throw new Error("An account with this email already exists");
  }

  const idTaken = await Student.findOne({ studentId: studentId.toUpperCase() });
  if (idTaken) {
    res.status(409);
    throw new Error("This student ID is already registered");
  }

  let assignedClass = null;
  if (classId) {
    const klass = await Class.findById(classId);
    if (!klass) {
      res.status(400);
      throw new Error("The class you selected does not exist");
    }
    assignedClass = klass._id;
  }

  const session = await mongoose.startSession();
  let user;
  try {
    await session.withTransaction(async () => {
      const created = await User.create(
        [{ fullName, email, password, role: "student" }],
        { session }
      );
      user = created[0];
      await Student.create(
        [{ user: user._id, studentId: studentId.toUpperCase(), class: assignedClass }],
        { session }
      );
    });
  } catch (err) {
    // transactions require a replica set; fall back to non-transactional create
    if (String(err.message).includes("Transaction numbers") || err.code === 20 || err.codeName === "IllegalOperation") {
      user = await User.create({ fullName, email, password, role: "student" });
      await Student.create({ user: user._id, studentId: studentId.toUpperCase(), class: assignedClass });
    } else {
      await session.endSession();
      throw err;
    }
  }
  await session.endSession();

  const profile = await buildProfile(user);
  res.status(201).json({
    success: true,
    token: generateToken(user._id),
    user: profile,
  });
});

// @route POST /api/auth/login  (public)
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const profile = await buildProfile(user);
  res.json({
    success: true,
    token: generateToken(user._id),
    user: profile,
  });
});

// @route GET /api/auth/me  (private)
const getMe = asyncHandler(async (req, res) => {
  const profile = await buildProfile(req.user);
  res.json({ success: true, user: profile });
});

// @route POST /api/auth/logout  (private) - stateless JWT, client discards token
const logout = asyncHandler(async (_req, res) => {
  res.json({ success: true, message: "Logged out. Please discard your token." });
});

// @route PUT /api/auth/profile  (private) - multipart: optional `avatar` file + fields
// Any authenticated user can update their own name, email, password and photo.
const updateProfile = asyncHandler(async (req, res) => {
    console.log("========== PROFILE UPDATE ==========");
  console.log("BODY:", req.body);
  console.log("FILE:", req.file);
  const { fullName, email, password, removeAvatar } = req.body;
  const user = await User.findById(req.user._id).select("+password");

  if (email && email.toLowerCase() !== user.email) {
    const taken = await User.findOne({ email: email.toLowerCase() });
    if (taken) {
      if (req.file) safeUnlink(path.join(AVATAR_DIR, req.file.filename));
      res.status(409);
      throw new Error("That email is already in use");
    }
    user.email = email;
  }

  if (fullName !== undefined && fullName.trim()) user.fullName = fullName.trim();
  if (password) {
    if (password.length < 6) {
      if (req.file) safeUnlink(path.join(AVATAR_DIR, req.file.filename));
      res.status(400);
      throw new Error("Password must be at least 6 characters");
    }
    user.password = password;
  }

  if (req.file) {
    if (user.avatar) safeUnlink(path.join(AVATAR_DIR, user.avatar));
    user.avatar = req.file.filename;
  } else if (removeAvatar === "true" || removeAvatar === true) {
    if (user.avatar) safeUnlink(path.join(AVATAR_DIR, user.avatar));
    user.avatar = "";
  }

  await user.save();
  const profile = await buildProfile(user);
  res.json({ success: true, user: profile });
});

function safeUnlink(p) {
  try {
    if (p && fs.existsSync(p)) fs.unlinkSync(p);
  } catch {
    /* ignore */
  }
}

module.exports = { register, login, getMe, logout, updateProfile, buildProfile };
