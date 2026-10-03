const express = require("express");
const LearningActivity = require("../models/LearningActivity");

const router = express.Router();

// =====================================================
// SAVE LEARNING ACTIVITY
// =====================================================

router.post("/activity", async (req, res) => {
  try {
    const {
      userId,
      documentId,
      activityType,
      title,
      description,
      topic,
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    if (!activityType) {
      return res.status(400).json({
        message: "activityType is required",
      });
    }

    if (!title) {
      return res.status(400).json({
        message: "title is required",
      });
    }

    const activity =
      await LearningActivity.create({
        userId,
        documentId: documentId || null,
        activityType,
        title,
        description: description || "",
        topic: topic || "General",
      });

    console.log(
      `📊 Learning activity saved: ${activityType}`
    );

    res.status(201).json({
      message:
        "Learning activity saved successfully",
      activity,
    });
  } catch (error) {
    console.error(
      "❌ Activity save error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to save learning activity",
      error: error.message,
    });
  }
});

// =====================================================
// GET RECENT ACTIVITIES
// =====================================================

router.get(
  "/activity/:userId",
  async (req, res) => {
    try {
      const { userId } = req.params;

      const activities =
        await LearningActivity.find({
          userId,
        })
          .sort({
            createdAt: -1,
          })
          .limit(20);

      res.status(200).json({
        message:
          "Learning activities fetched successfully",
        activities,
      });
    } catch (error) {
      console.error(
        "❌ Activity fetch error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch learning activities",
        error: error.message,
      });
    }
  }
);

// =====================================================
// GET LEARNING STATISTICS
// =====================================================

router.get(
  "/stats/:userId",
  async (req, res) => {
    try {
      const { userId } = req.params;

      const activities =
        await LearningActivity.find({
          userId,
        });

      const totalActivities =
        activities.length;

      const questionsAsked =
        activities.filter(
          (activity) =>
            activity.activityType ===
            "ask_ai"
        ).length;

      const summariesGenerated =
        activities.filter(
          (activity) =>
            activity.activityType ===
            "summary"
        ).length;

      const notesGenerated =
        activities.filter(
          (activity) =>
            activity.activityType ===
            "notes"
        ).length;

      const questionsGenerated =
        activities.filter(
          (activity) =>
            activity.activityType ===
            "questions"
        ).length;

      const documentsUploaded =
        activities.filter(
          (activity) =>
            activity.activityType ===
            "document_upload"
        ).length;

      const revisionPlansGenerated =
        activities.filter(
          (activity) =>
            activity.activityType ===
            "revision_plan"
        ).length;

      const stats = {
        totalActivities,
        questionsAsked,
        summariesGenerated,
        notesGenerated,
        questionsGenerated,
        documentsUploaded,
        revisionPlansGenerated,
      };

      console.log(
        "📊 Learning statistics:",
        stats
      );

      res.status(200).json({
        message:
          "Learning statistics generated successfully",
        stats,
      });
    } catch (error) {
      console.error(
        "❌ Learning statistics error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to generate learning statistics",
        error: error.message,
      });
    }
  }
);

module.exports = router;