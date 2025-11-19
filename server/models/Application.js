const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    jobTitle: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: [100, "Job title cannot be more than 100 characters"],
    },
    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: [100, "Company name cannot be more than 100 characters"],
    },
    date: {
      type: Date,
      required: [true, "Application date is required"],
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ["applied", "interview", "test", "offer", "rejected"],
        message:
          "Status must be one of: applied, interview, test, offer, rejected",
      },
      default: "applied",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot be more than 500 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
ApplicationSchema.index({ user: 1, date: -1 });
ApplicationSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model("Application", ApplicationSchema);
