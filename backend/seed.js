require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const connectDB = require("./config/db");
const User = require("./models/User");
const Class = require("./models/Class");
const Student = require("./models/Student");
const Teacher = require("./models/Teacher");
const Subject = require("./models/Subject");
const Lesson = require("./models/Lesson");
const Assignment = require("./models/Assignment");
const Submission = require("./models/Submission");
const Announcement = require("./models/Announcement");
const buildSamplePdf = require("./utils/samplePdf");

const daysFromNow = (d) => new Date(Date.now() + d * 86400000);

const UPLOAD_DIR = path.join(__dirname, "uploads");

async function run() {
  await connectDB();

  console.log("Clearing existing data...");
  await Promise.all([
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

  // wipe previously seeded files
  if (fs.existsSync(UPLOAD_DIR)) {
    for (const f of fs.readdirSync(UPLOAD_DIR)) {
      if (f.startsWith("seed-")) fs.unlinkSync(path.join(UPLOAD_DIR, f));
    }
  } else {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  // ---- Admin -------------------------------------------------------------
  const admin = await User.create({
    fullName: "System Administrator",
    email: "admin@university.com",
    password: "Admin123",
    role: "admin",
  });
  console.log("✔ Admin created: admin@university.com / Admin123");

  // ---- Classes ---------------------------------------------------------
  const classes = await Class.create([
    { className: "Computer Science Year 2", academicYear: "2024/2025" },
    { className: "Business Administration Year 1", academicYear: "2024/2025" },
    { className: "Electrical Engineering Year 3", academicYear: "2024/2025" },
  ]);
  console.log(`✔ ${classes.length} classes created`);

  // ---- Teachers ------------------------------------------------------
  const teacherSpecs = [
    { fullName: "Dr. Alan Turing", email: "turing@university.com", department: "Computer Science" },
    { fullName: "Prof. Grace Hopper", email: "hopper@university.com", department: "Computer Science" },
    { fullName: "Dr. Adam Smith", email: "smith@university.com", department: "Business" },
    { fullName: "Dr. Nikola Tesla", email: "tesla@university.com", department: "Electrical Engineering" },
  ];
  const teachers = [];
  for (const spec of teacherSpecs) {
    const u = await User.create({
      fullName: spec.fullName,
      email: spec.email,
      password: "Teacher123",
      role: "teacher",
    });
    teachers.push(await Teacher.create({ user: u._id, department: spec.department }));
  }
  console.log(`✔ ${teachers.length} teachers created (password: Teacher123)`);

  // ---- Students -----------------------------------------------------
  const studentSpecs = [
    { fullName: "Sara Ahmed", email: "sara@student.university.com", studentId: "CS2-001", classIdx: 0 },
    { fullName: "John Miller", email: "john@student.university.com", studentId: "CS2-002", classIdx: 0 },
    { fullName: "Layla Hassan", email: "layla@student.university.com", studentId: "BA1-001", classIdx: 1 },
    { fullName: "Mike Chen", email: "mike@student.university.com", studentId: "BA1-002", classIdx: 1 },
    { fullName: "Fatima Noor", email: "fatima@student.university.com", studentId: "EE3-001", classIdx: 2 },
    { fullName: "David Park", email: "david@student.university.com", studentId: "EE3-002", classIdx: 2 },
  ];
  const students = [];
  for (const spec of studentSpecs) {
    const u = await User.create({
      fullName: spec.fullName,
      email: spec.email,
      password: "Student123",
      role: "student",
    });
    students.push(
      await Student.create({
        user: u._id,
        studentId: spec.studentId,
        class: classes[spec.classIdx]._id,
      })
    );
  }
  console.log(`✔ ${students.length} students created (password: Student123)`);

  // ---- Subjects ----------------------------------------------------
  const subjectSpecs = [
    { subjectName: "Data Structures & Algorithms", subjectCode: "CS201", classIdx: 0, teacherIdx: 0 },
    { subjectName: "Operating Systems", subjectCode: "CS202", classIdx: 0, teacherIdx: 1 },
    { subjectName: "Database Systems", subjectCode: "CS203", classIdx: 0, teacherIdx: 0 },
    { subjectName: "Principles of Management", subjectCode: "BA101", classIdx: 1, teacherIdx: 2 },
    { subjectName: "Microeconomics", subjectCode: "BA102", classIdx: 1, teacherIdx: 2 },
    { subjectName: "Financial Accounting", subjectCode: "BA103", classIdx: 1, teacherIdx: 2 },
    { subjectName: "Power Systems Analysis", subjectCode: "EE301", classIdx: 2, teacherIdx: 3 },
    { subjectName: "Control Engineering", subjectCode: "EE302", classIdx: 2, teacherIdx: 3 },
  ];
  const subjects = [];
  for (const spec of subjectSpecs) {
    subjects.push(
      await Subject.create({
        subjectName: spec.subjectName,
        subjectCode: spec.subjectCode,
        class: classes[spec.classIdx]._id,
        teacher: teachers[spec.teacherIdx]._id,
      })
    );
  }
  console.log(`✔ ${subjects.length} subjects created`);

  // ---- Sample lessons (real PDF files) --------------------------
  const lessonSpecs = [
    { subjectIdx: 0, title: "Week 1 - Big-O Notation", teacherIdx: 0 },
    { subjectIdx: 0, title: "Week 2 - Linked Lists", teacherIdx: 0 },
    { subjectIdx: 1, title: "Lecture 1 - Processes & Threads", teacherIdx: 1 },
    { subjectIdx: 2, title: "Intro to Relational Model", teacherIdx: 0 },
    { subjectIdx: 3, title: "Chapter 1 - What is Management?", teacherIdx: 2 },
    { subjectIdx: 6, title: "Module 1 - Per-Unit System", teacherIdx: 3 },
  ];
  let lessonCount = 0;
  for (const spec of lessonSpecs) {
    const subject = subjects[spec.subjectIdx];
    const filename = `seed-${Date.now()}-${lessonCount}-${subject.subjectCode}.pdf`;
    const pdf = buildSamplePdf(spec.title, `${subject.subjectName} — sample lesson material.`);
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), pdf);

    await Lesson.create({
      subject: subject._id,
      title: spec.title,
      description: `Sample lesson document for ${subject.subjectName}.`,
      filePath: filename,
      fileName: `${spec.title}.pdf`,
      fileType: "pdf",
      fileSize: pdf.length,
      uploadedBy: teachers[spec.teacherIdx].user,
    });
    lessonCount++;
  }
  console.log(`✔ ${lessonCount} sample lessons created`);

  // ---- Sample assignments -----------------------------------------
  const assignmentSpecs = [
    { subjectIdx: 0, title: "Assignment 01 — Big-O Analysis", days: 3, teacherIdx: 0 },
    { subjectIdx: 0, title: "Assignment 02 — Linked List Implementation", days: 9, teacherIdx: 0 },
    { subjectIdx: 1, title: "Lab Report — Process Scheduling", days: -2, teacherIdx: 1 },
    { subjectIdx: 2, title: "ER Diagram Exercise", days: 5, teacherIdx: 0 },
    { subjectIdx: 3, title: "Case Study — Organisational Structure", days: 6, teacherIdx: 2 },
    { subjectIdx: 6, title: "Per-Unit Calculation Worksheet", days: 2, teacherIdx: 3 },
  ];
  const assignments = [];
  for (const spec of assignmentSpecs) {
    const subject = subjects[spec.subjectIdx];
    assignments.push(
      await Assignment.create({
        subject: subject._id,
        title: spec.title,
        description: `Complete and submit your work for ${subject.subjectName}.`,
        dueDate: daysFromNow(spec.days),
        uploadedBy: teachers[spec.teacherIdx].user,
      })
    );
  }
  console.log(`✔ ${assignments.length} sample assignments created`);

  // one on-time submission so a student sees a "Submitted" status
  {
    const pdf = buildSamplePdf("Submission", "Sample student submission.");
    const filename = `seed-sub-${Date.now()}.pdf`;
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), pdf);
    await Submission.create({
      assignment: assignments[1]._id,
      student: students[0]._id,
      filePath: filename,
      fileName: "Assignment 02.pdf",
      fileType: "pdf",
      fileSize: pdf.length,
    });
  }

  // ---- Sample announcements ---------------------------------------
  await Announcement.create([
    {
      title: "Midterm Exam Schedule Published",
      body: "The midterm examination timetable for all faculties is now available on the notice board and student portal. Please check your subject dates carefully.",
      priority: "important",
      audience: "all",
      author: admin._id,
      authorRole: "admin",
    },
    {
      title: "Library Extended Hours",
      body: "The main library will remain open until 11:00 PM on weekdays during the exam period.",
      priority: "normal",
      audience: "all",
      author: admin._id,
      authorRole: "admin",
    },
    {
      title: "New course material uploaded",
      body: "Week 2 notes on Linked Lists have been added to Data Structures & Algorithms. Please review before the next lecture.",
      priority: "normal",
      audience: "subject",
      subject: subjects[0]._id,
      class: subjects[0].class,
      author: teachers[0].user,
      authorRole: "teacher",
    },
    {
      title: "Important class announcement — Lab session moved",
      body: "The Operating Systems lab scheduled for this Thursday has been moved to Friday at 10:00 AM in Lab 3.",
      priority: "important",
      audience: "subject",
      subject: subjects[1]._id,
      class: subjects[1].class,
      author: teachers[1].user,
      authorRole: "teacher",
    },
  ]);
  console.log("✔ 4 sample announcements created");

  console.log("\n===========================================");
  console.log(" SEED COMPLETE - login credentials");
  console.log("===========================================");
  console.log(" Admin   : admin@university.com     / Admin123");
  console.log(" Teacher : turing@university.com    / Teacher123");
  console.log("           hopper@university.com    / Teacher123");
  console.log("           smith@university.com     / Teacher123");
  console.log("           tesla@university.com     / Teacher123");
  console.log(" Student : sara@student.university.com  / Student123  (Computer Science Year 2)");
  console.log("           layla@student.university.com / Student123  (Business Administration Year 1)");
  console.log("           fatima@student.university.com/ Student123  (Electrical Engineering Year 3)");
  console.log("===========================================\n");

  await mongoose.connection.close();
  process.exit(0);
}

run().catch(async (err) => {
  console.error("Seed failed:", err);
  await mongoose.connection.close();
  process.exit(1);
});
