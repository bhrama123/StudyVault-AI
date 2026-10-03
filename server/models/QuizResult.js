const mongoose = require("mongoose");

const quizResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      default: null,
    },

    topic: {
      type: String,
      required: true,
      trim: true,
    },

    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
    },

    correctAnswers: {
      type: Number,
      required: true,
      min: 0,
    },

    wrongAnswers: {
      type: Number,
      required: true,
      min: 0,
    },

    score: {
      type: Number,
      required: true,
      min: 0,
    },

    accuracy: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    answers: [
      {
        question: {
          type: String,
          required: true,
          trim: true,
        },

        selectedAnswer: {
          type: String,
          default: "",
          trim: true,
        },

        correctAnswer: {
          type: String,
          required: true,
          trim: true,
        },

        isCorrect: {
          type: Boolean,
          required: true,
        },
      },
    ],

    completedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },

  {
    timestamps: true,
  }
);


// =====================================================
// AUTOMATIC QUIZ RESULT CALCULATION
// =====================================================

quizResultSchema.pre("validate", function () {

  if (
    this.totalQuestions &&
    this.totalQuestions > 0
  ) {

    // Make sure correct answers are valid
    this.correctAnswers = Math.max(
      0,
      Math.min(
        this.correctAnswers || 0,
        this.totalQuestions
      )
    );


    // Calculate wrong answers
    this.wrongAnswers =
      this.totalQuestions -
      this.correctAnswers;


    // Score = number of correct answers
    this.score =
      this.correctAnswers;


    // Calculate accuracy
    this.accuracy =
      Number(
        (
          (this.correctAnswers /
            this.totalQuestions) *
          100
        ).toFixed(2)
      );
  }

});


// =====================================================
// INDEXES
// =====================================================

quizResultSchema.index({
  userId: 1,
  completedAt: -1,
});

quizResultSchema.index({
  userId: 1,
  topic: 1,
});


module.exports = mongoose.model(
  "QuizResult",
  quizResultSchema
);