require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const connectDB = require("./config/db");
const User = require("./models/User");
const Class = require("./models/Class");
const Subject = require("./models/Subject");
const Lesson = require("./models/Lesson");
const Student = require("./models/Student");
const Teacher = require("./models/Teacher");
const Assignment = require("./models/Assignment");
const Submission = require("./models/Submission");
const Announcement = require("./models/Announcement");

const UPLOAD_DIR = path.join(__dirname, "uploads");

/**
 * Remove all demo records and seeded files so the database is ready for real data.
 *
 * Run with:  npm run clear
 */
async function run() {
  await connectDB();

  if (fs.existsSync(UPLOAD_DIR)) {
    for (const fileName of fs.readdirSync(UPLOAD_DIR)) {
      if (!fileName.startsWith("seed-")) continue;
      try {
        fs.unlinkSync(path.join(UPLOAD_DIR, fileName));
      } catch {
        // Keep clearing database records even if a file cannot be removed.
      }
    }
  }

  const [userRes, classRes, studentRes, teacherRes, subjectRes, lessonRes, assignmentRes, submissionRes, announcementRes] = await Promise.all([
    User.deleteMany({}),
    Class.deleteMany({}),
    Student.deleteMany({}),
    Teacher.deleteMany({}),
    Subject.deleteMany({}),
    Lesson.deleteMany({}),
    Assignment.deleteMany({}),
    Submission.deleteMany({}),
    Announcement.deleteMany({}),
  ]);

  console.log("Cleared all demo data:");
  console.log(`  users deleted        : ${userRes.deletedCount}`);
  console.log(`  teachers deleted     : ${teacherRes.deletedCount}`);
  console.log(`  students deleted     : ${studentRes.deletedCount}`);
  console.log(`  classes deleted      : ${classRes.deletedCount}`);
  console.log(`  subjects deleted     : ${subjectRes.deletedCount}`);
  console.log(`  lessons deleted      : ${lessonRes.deletedCount}`);
  console.log(`  assignments deleted  : ${assignmentRes.deletedCount}`);
  console.log(`  submissions deleted  : ${submissionRes.deletedCount}`);
  console.log(`  announcements deleted: ${announcementRes.deletedCount}`);
  console.log("  seeded files removed : uploads/seed-*");

  await mongoose.connection.close();
  process.exit(0);
}

run().catch(async (err) => {
  console.error("Clear failed:", err);
  await mongoose.connection.close();
  process.exit(1);
});
