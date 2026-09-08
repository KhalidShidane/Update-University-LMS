const express = require("express");
const {
  register,
  login,
  getMe,
  logout,
  updateProfile,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { avatarSingle } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/register", register); // public - students only
router.post("/login", login);
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);
router.put("/profile", protect, avatarSingle("avatar"), updateProfile);

module.exports = router;
