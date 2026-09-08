const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    subjectName: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
      maxlength: [150, "Subject name is too long"],
    },
    subjectCode: {
      type: String,
      required: [true, "Subject code is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [2000, "Description is too long"],
    },
    image: {
      type: String,
      default: "",
      // optional cover image filename, served from /uploads/subjects/<file>
    },
    status: {
      type: String,
      enum: {
        values: ["active", "inactive"],
        message: "Status must be either active or inactive",
      },
      default: "active",
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "A subject must belong to a class"],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: [true, "A subject must be assigned to a teacher"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

subjectSchema.virtual("imageUrl").get(function () {
  return this.image ? `/uploads/subjects/${this.image}` : "";
});

module.exports = mongoose.model("Subject", subjectSchema);
