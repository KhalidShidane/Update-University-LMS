const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: [true, "Class name is required"],
      trim: true,
      unique: true,
      maxlength: [120, "Class name is too long"],
    },
    academicYear: {
      type: String,
      required: [true, "Academic year is required"],
      trim: true,
      // e.g. "2024/2025" or "Year 2"
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Class", classSchema);
