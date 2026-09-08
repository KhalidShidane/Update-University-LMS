const fs = require("fs");
const path = require("path");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const Subject = require("../models/Subject");
const Student = require("../models/Student");
const asyncHandler = require("../middleware/asyncHandler");
const { ASSIGNMENT_DIR, SUBMISSION_DIR } = require("../middleware/uploadMiddleware");
const {
  studentForUser,
  visibleSubjectIds,
  assertTeacherOwnsSubject,
} = require("../utils/access");

const MIME = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  zip: "application/zip",
  txt: "text/plain",
  csv: "text/csv",
};

const cleanupFile = (p) => {
  try {
    if (p && fs.existsSync(p)) fs.unlinkSync(p);
  } catch {
    /* ignore */
  }
};

/** Compute a student's status for one assignment given their submission (or null). */
function statusFor(assignment, submission) {
  if (submission?.graded) return "completed";
  if (submission) {
    return submission.submittedAt > assignment.dueDate ? "late" : "submitted";
  }
  return new Date() > assignment.dueDate ? "late" : "pending";
}

const populateAssignment = (q) =>
  q.populate({
    path: "subject",
    select: "subjectName subjectCode class teacher",
  });

// @route GET /api/assignments
const getAssignments = asyncHandler(async (req, res) => {
  const subjectIds = await visibleSubjectIds(req.user);
  const assignments = await populateAssignment(
    Assignment.find({ subject: { $in: subjectIds } })
  )
    .sort({ dueDate: 1 })
    .lean();

  if (req.user.role === "student") {
    const student = await studentForUser(req.user._id);
    const subs = await Submission.find({
      student: student?._id,
      assignment: { $in: assignments.map((a) => a._id) },
    }).lean();
    const byAssignment = new Map(subs.map((s) => [String(s.assignment), s]));

    const data = assignments.map((a) => {
      const sub = byAssignment.get(String(a._id)) || null;
      return {
        ...a,
        fileUrl: a.filePath ? `/uploads/assignments/${a.filePath}` : "",
        status: statusFor(a, sub),
        submission: sub
          ? {
              _id: sub._id,
              fileName: sub.fileName,
              submittedAt: sub.submittedAt,
              graded: sub.graded,
              grade: sub.grade,
              feedback: sub.feedback,
            }
          : null,
      };
    });
    return res.json({ success: true, count: data.length, data });
  }

  // teacher / admin — attach submission counts
  const data = await Promise.all(
    assignments.map(async (a) => ({
      ...a,
      fileUrl: a.filePath ? `/uploads/assignments/${a.filePath}` : "",
      submissionCount: await Submission.countDocuments({ assignment: a._id }),
    }))
  );
  res.json({ success: true, count: data.length, data });
});

// @route GET /api/assignments/:id
const getAssignment = asyncHandler(async (req, res) => {
  const assignment = await populateAssignment(Assignment.findById(req.params.id));
  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found");
  }
  const subjectIds = (await visibleSubjectIds(req.user)).map(String);
  if (!subjectIds.includes(String(assignment.subject._id))) {
    res.status(403);
    throw new Error("You cannot access this assignment");
  }

  const base = { ...assignment.toObject() };

  if (req.user.role === "student") {
    const student = await studentForUser(req.user._id);
    const sub = await Submission.findOne({ assignment: assignment._id, student: student?._id });
    base.status = statusFor(assignment, sub);
    base.submission = sub || null;
  } else {
    const subs = await Submission.find({ assignment: assignment._id })
      .populate({ path: "student", populate: { path: "user", select: "fullName email" } })
      .sort({ submittedAt: -1 });
    base.submissions = subs;
  }
  res.json({ success: true, data: base });
});

// @route POST /api/assignments  (teacher) - multipart optional `file`
const createAssignment = asyncHandler(async (req, res) => {
  const { subject: subjectId, title, description, dueDate } = req.body;
  const file = req.file;
  const abort = (code, msg) => {
    if (file) cleanupFile(file.path);
    res.status(code);
    throw new Error(msg);
  };

  if (!subjectId || !title || !dueDate) abort(400, "subject, title and dueDate are required");
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) abort(400, "Invalid due date");

  await assertTeacherOwnsSubject(req.user, subjectId, res);

  const assignment = await Assignment.create({
    subject: subjectId,
    title,
    description: description || "",
    dueDate: due,
    filePath: file ? file.filename : "",
    fileName: file ? file.originalname : "",
    fileType: file ? file.resolvedType : "",
    uploadedBy: req.user._id,
  });
  res.status(201).json({ success: true, data: assignment });
});

// @route PUT /api/assignments/:id  (teacher owns)
const updateAssignment = asyncHandler(async (req, res) => {
  const file = req.file;
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    if (file) cleanupFile(file.path);
    res.status(404);
    throw new Error("Assignment not found");
  }
  await assertTeacherOwnsSubject(req.user, assignment.subject, res);

  const { title, description, dueDate, removeFile } = req.body;
  if (title !== undefined) assignment.title = title;
  if (description !== undefined) assignment.description = description;
  if (dueDate !== undefined) {
    const due = new Date(dueDate);
    if (Number.isNaN(due.getTime())) {
      if (file) cleanupFile(file.path);
      res.status(400);
      throw new Error("Invalid due date");
    }
    assignment.dueDate = due;
  }
  if (file) {
    if (assignment.filePath) cleanupFile(path.join(ASSIGNMENT_DIR, assignment.filePath));
    assignment.filePath = file.filename;
    assignment.fileName = file.originalname;
    assignment.fileType = file.resolvedType;
  } else if (removeFile === "true" || removeFile === true) {
    if (assignment.filePath) cleanupFile(path.join(ASSIGNMENT_DIR, assignment.filePath));
    assignment.filePath = "";
    assignment.fileName = "";
    assignment.fileType = "";
  }
  await assignment.save();
  res.json({ success: true, data: assignment });
});

// @route DELETE /api/assignments/:id  (teacher owns)
const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found");
  }
  await assertTeacherOwnsSubject(req.user, assignment.subject, res);

  const subs = await Submission.find({ assignment: assignment._id });
  for (const s of subs) cleanupFile(path.join(SUBMISSION_DIR, s.filePath));
  await Submission.deleteMany({ assignment: assignment._id });
  if (assignment.filePath) cleanupFile(path.join(ASSIGNMENT_DIR, assignment.filePath));
  await assignment.deleteOne();
  res.json({ success: true, message: "Assignment deleted" });
});

// @route POST /api/assignments/:id/submit  (student) - multipart `file` required
const submitAssignment = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400);
    throw new Error("A file is required to submit");
  }
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    cleanupFile(file.path);
    res.status(404);
    throw new Error("Assignment not found");
  }
  const student = await studentForUser(req.user._id);
  const subject = await Subject.findById(assignment.subject);
  if (!student || !student.class || String(subject.class) !== String(student.class)) {
    cleanupFile(file.path);
    res.status(403);
    throw new Error("This assignment does not belong to your class");
  }

  let submission = await Submission.findOne({ assignment: assignment._id, student: student._id });
  if (submission) {
    cleanupFile(path.join(SUBMISSION_DIR, submission.filePath));
    submission.filePath = file.filename;
    submission.fileName = file.originalname;
    submission.fileType = file.resolvedType;
    submission.fileSize = file.size;
    submission.submittedAt = new Date();
    submission.graded = false;
    submission.grade = "";
    submission.feedback = "";
    await submission.save();
  } else {
    submission = await Submission.create({
      assignment: assignment._id,
      student: student._id,
      filePath: file.filename,
      fileName: file.originalname,
      fileType: file.resolvedType,
      fileSize: file.size,
    });
  }
  res.status(201).json({
    success: true,
    data: { submission, status: statusFor(assignment, submission) },
  });
});

// @route PUT /api/assignments/submissions/:id/grade  (teacher)
const gradeSubmission = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id).populate("assignment");
  if (!submission) {
    res.status(404);
    throw new Error("Submission not found");
  }
  await assertTeacherOwnsSubject(req.user, submission.assignment.subject, res);

  const { grade, feedback } = req.body;
  submission.graded = true;
  if (grade !== undefined) submission.grade = grade;
  if (feedback !== undefined) submission.feedback = feedback;
  await submission.save();
  res.json({ success: true, data: submission });
});

// file downloads
const downloadAssignmentBrief = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment || !assignment.filePath) {
    res.status(404);
    throw new Error("No brief attached");
  }
  const subjectIds = (await visibleSubjectIds(req.user)).map(String);
  if (!subjectIds.includes(String(assignment.subject))) {
    res.status(403);
    throw new Error("Not allowed");
  }
  streamFile(res, path.join(ASSIGNMENT_DIR, assignment.filePath), assignment.fileName, assignment.fileType);
});

const downloadSubmission = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id).populate("assignment");
  if (!submission) {
    res.status(404);
    throw new Error("Submission not found");
  }
  if (req.user.role === "student") {
    const student = await studentForUser(req.user._id);
    if (String(submission.student) !== String(student?._id)) {
      res.status(403);
      throw new Error("Not allowed");
    }
  } else {
    await assertTeacherOwnsSubject(req.user, submission.assignment.subject, res);
  }
  streamFile(res, path.join(SUBMISSION_DIR, submission.filePath), submission.fileName, submission.fileType);
});

function streamFile(res, absPath, name, type) {
  if (!fs.existsSync(absPath)) {
    res.status(404);
    throw new Error("File is missing on the server");
  }
  res.setHeader("Content-Type", MIME[type] || "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${String(name).replace(/"/g, "")}"`);
  fs.createReadStream(absPath).pipe(res);
}

module.exports = {
  getAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  gradeSubmission,
  downloadAssignmentBrief,
  downloadSubmission,
};
