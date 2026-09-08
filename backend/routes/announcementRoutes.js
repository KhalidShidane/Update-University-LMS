const express = require("express");
const {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require("../controllers/announcementController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();
router.use(protect);

router.get("/", getAnnouncements);
router.post("/", authorize("admin", "teacher"), createAnnouncement);
router.put("/:id", authorize("admin", "teacher"), updateAnnouncement);
router.delete("/:id", authorize("admin", "teacher"), deleteAnnouncement);

module.exports = router;
