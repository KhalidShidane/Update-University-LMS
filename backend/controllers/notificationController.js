const User = require("../models/User");
const Announcement = require("../models/Announcement");
const Lesson = require("../models/Lesson");
const asyncHandler = require("../middleware/asyncHandler");
const { visibleSubjectIds } = require("../utils/access");
const { visibilityFilter } = require("./announcementController");

// @route GET /api/notifications/summary
// Recent announcements (+ new materials for students), with an unread count.
const getSummary = asyncHandler(async (req, res) => {
  const seenAt = req.user.notificationsSeenAt || new Date(0);

  const annFilter = await visibilityFilter(req.user);
  const announcements = await Announcement.find(annFilter)
    .populate("author", "fullName role")
    .populate("subject", "subjectName subjectCode")
    .sort({ createdAt: -1 })
    .limit(8)
    .lean();

  let items = announcements.map((a) => ({
    _id: `ann-${a._id}`,
    type: "announcement",
    priority: a.priority,
    title: a.title,
    subtitle: a.subject
      ? `${a.subject.subjectCode} · ${a.author?.fullName || "Faculty"}`
      : `${a.author?.role === "admin" ? "University Admin" : a.author?.fullName || "Faculty"}`,
    date: a.createdAt,
    unread: new Date(a.createdAt) > seenAt,
  }));

  if (req.user.role === "student") {
    const subjectIds = await visibleSubjectIds(req.user);
    const lessons = await Lesson.find({ subject: { $in: subjectIds } })
      .populate("subject", "subjectName subjectCode")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();
    items = items.concat(
      lessons.map((l) => ({
        _id: `mat-${l._id}`,
        type: "material",
        priority: "normal",
        title: l.title,
        subtitle: `${l.fileType?.toUpperCase()} · ${l.subject?.subjectName || "Subject"}`,
        date: l.createdAt,
        unread: new Date(l.createdAt) > seenAt,
        link: `/student/subjects/${l.subject?._id}/lessons/${l._id}`,
      }))
    );
  }

  items.sort((a, b) => new Date(b.date) - new Date(a.date));
  items = items.slice(0, 12);

  res.json({
    success: true,
    unreadCount: items.filter((i) => i.unread).length,
    data: items,
  });
});

// @route POST /api/notifications/seen
const markSeen = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { notificationsSeenAt: new Date() });
  res.json({ success: true });
});

module.exports = { getSummary, markSeen };
