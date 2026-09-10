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

    // Old local file path - kept for compatibility
    filePath: {
      type: String,
      default: "",
    },

    fileName: {
      type: String,
      required: true,
    },

    fileType: {
      type: String,
      required: true,
      // pdf, docx, pptx
    },

    fileSize: {
      type: Number,
      default: 0,
    },

    // Cloudinary lesson file
    cloudinaryUrl: {
      type: String,
      default: "",
    },

    cloudinaryPublicId: {
      type: String,
      default: "",
    },

    cloudinaryResourceType: {
      type: String,
      default: "",
    },

    // Old local cover filename
    coverImage: {
      type: String,
      default: "",
    },

    // Cloudinary cover image
    coverUrl: {
      type: String,
      default: "",
    },

    coverPublicId: {
      type: String,
      default: "",
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

// Cover URL
lessonSchema.virtual("coverImageUrl").get(function () {
  if (this.coverUrl) {
    return this.coverUrl;
  }

  if (this.coverImage) {
    return `/uploads/covers/${this.coverImage}`;
  }

  return "";
});

module.exports = mongoose.model("Lesson", lessonSchema);