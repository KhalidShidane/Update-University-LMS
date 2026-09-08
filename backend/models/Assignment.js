const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "An assignment must belong to a subject"],
    },
    title: {
      type: String,
      required: [true, "Assignment title is required"],
      trim: true,
      maxlength: [200, "Title is too long"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [4000, "Description is too long"],
    },
    dueDate: {
      type: Date,
      required: [true, "A due date is required"],
    },
    // optional brief/instructions file from the lecturer
    filePath: { type: String, default: "" },
    fileName: { type: String, default: "" },
    fileType: { type: String, default: "" },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

assignmentSchema.virtual("fileUrl").get(function () {
  return this.filePath ? `/uploads/assignments/${this.filePath}` : "";
});

module.exports = mongoose.model("Assignment", assignmentSchema);
