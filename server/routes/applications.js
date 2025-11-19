const express = require("express");
const { body, validationResult } = require("express-validator");
const Application = require("../models/Application");
const auth = require("../middleware/auth");

const router = express.Router();

// Get all applications for user
router.get("/", auth, async (req, res) => {
  try {
    const { status } = req.query;
    let query = { user: req.user.id };

    if (status && status !== "all") {
      query.status = status;
    }

    const applications = await Application.find(query).sort({ date: -1 });
    res.json(applications);
  } catch (error) {
    console.error("Get applications error:", error);
    res.status(500).json({
      message: "Server error fetching applications",
    });
  }
});

// Create new application
router.post(
  "/",
  [
    auth,
    body("jobTitle").trim().notEmpty().withMessage("Job title is required"),
    body("company").trim().notEmpty().withMessage("Company name is required"),
    body("date").isDate().withMessage("Valid date is required"),
    body("status")
      .isIn(["applied", "interview", "test", "offer", "rejected"])
      .withMessage("Invalid status"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { jobTitle, company, date, status, notes } = req.body;

      const application = new Application({
        user: req.user.id,
        jobTitle,
        company,
        date,
        status,
        notes,
      });

      await application.save();

      res.status(201).json(application);
    } catch (error) {
      console.error("Create application error:", error);
      res.status(500).json({
        message: "Server error creating application",
      });
    }
  }
);

// Update application - FIXED ROUTE
router.put(
  "/:id",
  [
    auth,
    body("jobTitle").trim().notEmpty().withMessage("Job title is required"),
    body("company").trim().notEmpty().withMessage("Company name is required"),
    body("date").isDate().withMessage("Valid date is required"),
    body("status")
      .isIn(["applied", "interview", "test", "offer", "rejected"])
      .withMessage("Invalid status"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { jobTitle, company, date, status, notes } = req.body;

      // Use findByIdAndUpdate for better error handling
      const application = await Application.findOneAndUpdate(
        {
          _id: req.params.id,
          user: req.user.id, // Ensure user owns the application
        },
        {
          jobTitle,
          company,
          date,
          status,
          notes,
        },
        {
          new: true, // Return updated document
          runValidators: true,
        }
      );

      if (!application) {
        return res.status(404).json({
          message:
            "Application not found or you are not authorized to update it",
        });
      }

      res.json(application);
    } catch (error) {
      console.error("Update application error:", error);
      if (error.name === "CastError") {
        return res.status(400).json({
          message: "Invalid application ID",
        });
      }
      res.status(500).json({
        message: "Server error updating application",
      });
    }
  }
);

// Delete application
router.delete("/:id", auth, async (req, res) => {
  try {
    const application = await Application.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!application) {
      return res.status(404).json({
        message: "Application not found or you are not authorized to delete it",
      });
    }

    res.json({ message: "Application deleted successfully" });
  } catch (error) {
    console.error("Delete application error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid application ID",
      });
    }
    res.status(500).json({
      message: "Server error deleting application",
    });
  }
});

module.exports = router;
