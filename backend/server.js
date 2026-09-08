require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const authRoutes = require("./routes/authRoutes");
const classRoutes = require("./routes/classRoutes");
const studentRoutes = require("./routes/studentRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const lessonRoutes = require("./routes/lessonRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

connectDB();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",") : "*",
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

// profile photos & lesson cover images are public assets
// (lesson documents themselves are NOT — they stream through auth)
app.use(
  "/uploads/avatars",
  express.static(path.join(__dirname, "uploads", "avatars"), { maxAge: "7d" })
);
app.use(
  "/uploads/covers",
  express.static(path.join(__dirname, "uploads", "covers"), { maxAge: "7d" })
);
app.use(
  "/uploads/subjects",
  express.static(path.join(__dirname, "uploads", "subjects"), { maxAge: "7d" })
);

// health check
app.get("/api/health", (_req, res) =>
  res.json({ success: true, message: "University LMS API is running", time: new Date() })
);

app.use("/api/auth", authRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/notifications", notificationRoutes);

// Serve the built frontend in production (optional single-deploy setup)
if (process.env.NODE_ENV === "production") {
  const clientDist = path.join(__dirname, "..", "frontend", "dist");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () =>
  console.log(`✔ Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`)
);

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `\n✖ Port ${PORT} is already in use — another server (maybe an old one) is still running.\n` +
        `  Fix it with either:\n` +
        `    • npm run freeport            (kills whatever is on port ${PORT}, then run npm start)\n` +
        `    • set PORT=5001 in backend/.env  (and update the Vite proxy in frontend/vite.config.js)\n`
    );
    process.exit(1);
  }
  throw err;
});

module.exports = app;
