const express = require("express");
const {
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
} = require("../controllers/subjectController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { subjectImageSingle } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.use(protect);

// list/detail are role-filtered inside the controller
router.get("/", getSubjects);
router.get("/:id", getSubject);

// only admin creates / edits / deletes subjects (multipart: fields + optional `image`)
router.post("/", authorize("admin"), subjectImageSingle("image"), createSubject);
router.put("/:id", authorize("admin"), subjectImageSingle("image"), updateSubject);
router.delete("/:id", authorize("admin"), deleteSubject);

module.exports = router;
