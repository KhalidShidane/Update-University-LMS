const express = require("express");
const {
  getLessons,
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson,
  downloadLesson,
  previewLesson,
} = require("../controllers/lessonController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { lessonFields } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.use(protect);

// read (role-filtered inside controller)
router.get("/", getLessons);
router.get("/:id", getLesson);
router.get("/:id/download", downloadLesson);
router.get("/:id/preview", previewLesson);

// teachers manage their own lessons
router.post("/", authorize("teacher"), lessonFields, createLesson);
router.put("/:id", authorize("teacher"), lessonFields, updateLesson);
router.delete("/:id", authorize("teacher"), deleteLesson);

module.exports = router;
