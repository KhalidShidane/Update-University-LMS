const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ROLES = ["admin", "teacher", "student"];

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Full name must be at least 2 characters"],
      maxlength: [100, "Full name is too long"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ROLES,
        message: "Role must be one of: admin, teacher, student",
      },
      default: "student",
    },
    avatar: {
      type: String,
      default: "",
      // relative path served from /uploads/avatars/<file>
    },
    // last time the user opened their notifications (drives the unread badge)
    notificationsSeenAt: {
      type: Date,
      default: () => new Date(0),
    },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

// Hash password whenever it is set/changed
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

userSchema.statics.ROLES = ROLES;

module.exports = mongoose.model("User", userSchema);
