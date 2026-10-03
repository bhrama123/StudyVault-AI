const mongoose = require("mongoose");

const learningActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      default: null,
    },

    activityType: {
      type: String,
      required: true,

      enum: [
        "ask_ai",
        "summary",
        "notes",
        "questions",
        "document_upload",
        "revision_plan",
      ],
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    topic: {
      type: String,
      default: "General",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "LearningActivity",
  learningActivitySchema
);