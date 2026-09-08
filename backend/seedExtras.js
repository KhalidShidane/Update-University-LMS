require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
require("./models/User");
require("./models/Class");
require("./models/Teacher");
const Subject = require("./models/Subject");
const Assignment = require("./models/Assignment");
const Announcement = require("./models/Announcement");

/**
 * Additive demo data — adds a few assignments and announcements to whatever
 * classes / subjects already exist. Does NOT delete anything.
 *
 *   npm run seed:extras
 */
const daysFromNow = (d) => new Date(Date.now() + d * 86400000);

async function run() {
  await connectDB();

  const subjects = await Subject.find().populate({ path: "teacher", populate: "user" });
  if (!subjects.length) {
    console.log("No subjects found — create a subject first, then run this again.");
    await mongoose.connection.close();
    process.exit(0);
  }

  let added = 0;
  for (const s of subjects) {
    const teacherUser = s.teacher?.user?._id;
    if (!teacherUser) continue;

    const specs = [
      { title: `${s.subjectCode} — Assignment 01`, days: 4 },
      { title: `${s.subjectCode} — Assignment 02`, days: 11 },
    ];
    for (const spec of specs) {
      const exists = await Assignment.findOne({ subject: s._id, title: spec.title });
      if (exists) continue;
      await Assignment.create({
        subject: s._id,
        title: spec.title,
        description: `Complete and submit your work for ${s.subjectName}.`,
        dueDate: daysFromNow(spec.days),
        uploadedBy: teacherUser,
      });
      added++;
    }

    const annTitle = `New material posted for ${s.subjectCode}`;
    if (!(await Announcement.findOne({ subject: s._id, title: annTitle }))) {
      await Announcement.create({
        title: annTitle,
        body: `Fresh lecture material has been uploaded to ${s.subjectName}. Please review it before the next class.`,
        priority: "normal",
        audience: "subject",
        subject: s._id,
        class: s.class,
        author: teacherUser,
        authorRole: "teacher",
      });
      added++;
    }
  }

  // one university-wide announcement from an admin
  const Admin = mongoose.model("User");
  const admin = await Admin.findOne({ role: "admin" });
  if (admin && !(await Announcement.findOne({ title: "Midterm Exam Schedule Published" }))) {
    await Announcement.create({
      title: "Midterm Exam Schedule Published",
      body: "The midterm examination timetable is now available on the student portal. Please check your subject dates carefully.",
      priority: "important",
      audience: "all",
      author: admin._id,
      authorRole: "admin",
    });
    added++;
  }

  console.log(`✔ Added ${added} demo items (assignments + announcements).`);
  await mongoose.connection.close();
  process.exit(0);
}

run().catch(async (err) => {
  console.error("seed:extras failed:", err);
  await mongoose.connection.close();
  process.exit(1);
});
