const express = require("express");
const {
  getTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} = require("../controllers/teacherController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect, authorize("admin"));

router.route("/").get(getTeachers).post(createTeacher);
router.route("/:id").get(getTeacher).put(updateTeacher).delete(deleteTeacher);

module.exports = router;
