const express = require("express");
const {
  getAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  gradeSubmission,
  downloadAssignmentBrief,
  downloadSubmission,
} = require("../controllers/assignmentController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { academicSingle, ASSIGNMENT_DIR, SUBMISSION_DIR } = require("../middleware/uploadMiddleware");

const router = express.Router();
router.use(protect);

router.get("/", getAssignments);

// downloads / submission-scoped routes must come before "/:id"
router.get("/submissions/:id/download", downloadSubmission);
router.put("/submissions/:id/grade", authorize("teacher", "admin"), gradeSubmission);

router.get("/:id", getAssignment);
router.get("/:id/brief", downloadAssignmentBrief);
router.post("/:id/submit", authorize("student"), academicSingle("file", SUBMISSION_DIR), submitAssignment);

router.post("/", authorize("teacher"), academicSingle("file", ASSIGNMENT_DIR), createAssignment);
router.put("/:id", authorize("teacher"), academicSingle("file", ASSIGNMENT_DIR), updateAssignment);
router.delete("/:id", authorize("teacher"), deleteAssignment);

module.exports = router;
