const Announcement = require("../models/Announcement");
const Subject = require("../models/Subject");
const Class = require("../models/Class");
const asyncHandler = require("../middleware/asyncHandler");
const { teacherForUser, studentForUser } = require("../utils/access");

const populate = (q) =>
  q
    .populate("author", "fullName role avatar")
    .populate("class", "className")
    .populate("subject", "subjectName subjectCode");

/** Build the mongo filter of announcements this user is allowed to see. */
async function visibilityFilter(user) {
  if (user.role === "admin") return {};

  if (user.role === "teacher") {
    const teacher = await teacherForUser(user._id);
    const subjectIds = teacher
      ? (await Subject.find({ teacher: teacher._id }).select("_id class")).map((s) => s)
      : [];
    const classIds = [...new Set(subjectIds.map((s) => String(s.class)))];
    return {
      $or: [
        { audience: "all" },
        { author: user._id },
        { subject: { $in: subjectIds.map((s) => s._id) } },
        { class: { $in: classIds } },
      ],
    };
  }

  // student
  const student = await studentForUser(user._id);
  if (!student || !student.class) return { audience: "all" };
  const subjectIds = (
    await Subject.find({ class: student.class, status: { $ne: "inactive" } }).select("_id")
  ).map((s) => s._id);
  return {
    $or: [
      { audience: "all" },
      { audience: "class", class: student.class },
      { audience: "subject", subject: { $in: subjectIds } },
    ],
  };
}

// @route GET /api/announcements
const getAnnouncements = asyncHandler(async (req, res) => {
  const filter = await visibilityFilter(req.user);
  const items = await populate(Announcement.find(filter)).sort({ createdAt: -1 }).limit(60);
  res.json({ success: true, count: items.length, data: items });
});

// @route POST /api/announcements  (admin: any · teacher: their class/subject)
const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, body, priority, audience, class: classId, subject: subjectId } = req.body;
  if (!title || !body) {
    res.status(400);
    throw new Error("Title and message are required");
  }
  const aud = ["all", "class", "subject"].includes(audience) ? audience : "all";

  const doc = {
    title,
    body,
    priority: priority === "important" ? "important" : "normal",
    audience: aud,
    author: req.user._id,
    authorRole: req.user.role,
    class: null,
    subject: null,
  };

  if (aud === "class") {
    if (!classId || !(await Class.findById(classId))) {
      res.status(400);
      throw new Error("A valid class is required for a class announcement");
    }
    doc.class = classId;
  }
  if (aud === "subject") {
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      res.status(400);
      throw new Error("A valid subject is required for a subject announcement");
    }
    doc.subject = subject._id;
    doc.class = subject.class;
  }

  // teachers may only target their own subjects / classes, never the whole university
  if (req.user.role === "teacher") {
    const teacher = await teacherForUser(req.user._id);
    const mySubjects = teacher
      ? await Subject.find({ teacher: teacher._id }).select("_id class")
      : [];
    const mySubjectIds = mySubjects.map((s) => String(s._id));
    const myClassIds = mySubjects.map((s) => String(s.class));

    if (aud === "all") {
      res.status(403);
      throw new Error("Only administrators can post university-wide announcements");
    }
    if (aud === "subject" && !mySubjectIds.includes(String(doc.subject))) {
      res.status(403);
      throw new Error("You can only post announcements for your own subjects");
    }
    if (aud === "class" && !myClassIds.includes(String(doc.class))) {
      res.status(403);
      throw new Error("You can only post announcements for classes you teach");
    }
  }

  const created = await Announcement.create(doc);
  res.status(201).json({ success: true, data: await populate(Announcement.findById(created._id)) });
});

// @route PUT /api/announcements/:id  (author or admin)
const updateAnnouncement = asyncHandler(async (req, res) => {
  const ann = await Announcement.findById(req.params.id);
  if (!ann) {
    res.status(404);
    throw new Error("Announcement not found");
  }
  if (req.user.role !== "admin" && String(ann.author) !== String(req.user._id)) {
    res.status(403);
    throw new Error("You can only edit your own announcements");
  }
  const { title, body, priority } = req.body;
  if (title !== undefined) ann.title = title;
  if (body !== undefined) ann.body = body;
  if (priority !== undefined) ann.priority = priority === "important" ? "important" : "normal";
  await ann.save();
  res.json({ success: true, data: await populate(Announcement.findById(ann._id)) });
});

// @route DELETE /api/announcements/:id  (author or admin)
const deleteAnnouncement = asyncHandler(async (req, res) => {
  const ann = await Announcement.findById(req.params.id);
  if (!ann) {
    res.status(404);
    throw new Error("Announcement not found");
  }
  if (req.user.role !== "admin" && String(ann.author) !== String(req.user._id)) {
    res.status(403);
    throw new Error("You can only delete your own announcements");
  }
  await ann.deleteOne();
  res.json({ success: true, message: "Announcement deleted" });
});

module.exports = {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  visibilityFilter,
};
