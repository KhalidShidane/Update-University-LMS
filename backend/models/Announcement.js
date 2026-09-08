const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Announcement title is required"],
      trim: true,
      maxlength: [200, "Title is too long"],
    },
    body: {
      type: String,
      required: [true, "Announcement message is required"],
      trim: true,
      maxlength: [4000, "Message is too long"],
    },
    priority: {
      type: String,
      enum: ["normal", "important"],
      default: "normal",
    },
    // "all" = whole university · "class" = a single class · "subject" = one subject's students
    audience: {
      type: String,
      enum: ["all", "class", "subject"],
      default: "all",
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      default: null,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      default: null,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorRole: {
      type: String,
      enum: ["admin", "teacher"],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);
