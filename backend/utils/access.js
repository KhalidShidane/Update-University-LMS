const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const Subject = require("../models/Subject");

/** Teacher document for a user (or null). */
const teacherForUser = (userId) => Teacher.findOne({ user: userId });

/** Student document for a user (or null). */
const studentForUser = (userId) => Student.findOne({ user: userId });

/**
 * Return the list of Subject _ids the given user is allowed to see:
 *  admin   -> every subject
 *  teacher -> subjects assigned to them
 *  student -> active subjects of their class
 */
async function visibleSubjectIds(user) {
  if (user.role === "admin") {
    return (await Subject.find().select("_id")).map((s) => s._id);
  }
  if (user.role === "teacher") {
    const teacher = await teacherForUser(user._id);
    if (!teacher) return [];
    return (await Subject.find({ teacher: teacher._id }).select("_id")).map((s) => s._id);
  }
  const student = await studentForUser(user._id);
  if (!student || !student.class) return [];
  return (
    await Subject.find({ class: student.class, status: { $ne: "inactive" } }).select("_id")
  ).map((s) => s._id);
}

/**
 * Assert a teacher owns `subjectId`. Returns the subject or throws (sets res status).
 */
async function assertTeacherOwnsSubject(user, subjectId, res) {
  const subject = await Subject.findById(subjectId);
  if (!subject) {
    res.status(404);
    throw new Error("Subject not found");
  }
  if (user.role === "admin") return subject;
  const teacher = await teacherForUser(user._id);
  if (!teacher || String(subject.teacher) !== String(teacher._id)) {
    res.status(403);
    throw new Error("You are not assigned to this subject");
  }
  return subject;
}

module.exports = { teacherForUser, studentForUser, visibleSubjectIds, assertTeacherOwnsSubject };
