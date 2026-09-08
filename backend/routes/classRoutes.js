const express = require("express");
const {
  getPublicClasses,
  getPublicClassSubjects,
  getClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
} = require("../controllers/classController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// ---- Public (no auth) — student registration form ----
router.get("/public", getPublicClasses);
router.get("/public/:id/subjects", getPublicClassSubjects);

// ---- Authenticated ----
router.use(protect);

// any authenticated user can read the class list (teachers/students need names)
router.get("/", getClasses);
router.get("/:id", getClass);

// only admin mutates classes
router.post("/", authorize("admin"), createClass);
router.put("/:id", authorize("admin"), updateClass);
router.delete("/:id", authorize("admin"), deleteClass);

module.exports = router;
