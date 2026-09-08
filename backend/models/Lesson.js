const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "A lesson must belong to a subject"],
    },
    title: {
      type: String,
      required: [true, "Lesson title is required"],
      trim: true,
      maxlength: [200, "Title is too long"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [2000, "Description is too long"],
    },
    filePath: {
      type: String,
      required: [true, "A lesson file is required"],
    },
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
      // one of: pdf, docx, pptx
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    coverImage: {
      type: String,
      default: "",
      // optional cover photo filename, served from /uploads/covers/<file>
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

lessonSchema.virtual("coverUrl").get(function () {
  return this.coverImage ? `/uploads/covers/${this.coverImage}` : "";
});

module.exports = mongoose.model("Lesson", lessonSchema);
