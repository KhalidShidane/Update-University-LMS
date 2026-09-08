const express = require("express");
const { getSummary, markSeen } = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(protect);

router.get("/summary", getSummary);
router.post("/seen", markSeen);

module.exports = router;
