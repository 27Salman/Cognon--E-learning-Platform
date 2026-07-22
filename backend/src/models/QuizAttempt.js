const mongoose = require("mongoose");
const { QUIZ_STATUS } = require("../config/constants");

const quizAttemptSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
      required: true,
    },
    submittedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: Object.values(QUIZ_STATUS),
      default: QUIZ_STATUS.STARTED,
    },
    questionsSnapshot: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId },
        questionText: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctOptionIndex: { type: Number, required: true },
        marks: { type: Number, required: true },
      },
    ],
    answers: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
        selectedOptionIndex: { type: Number },
      },
    ],
    score: {
      type: Number,
      default: 0,
    },
    passed: {
      type: Boolean,
      default: false,
    },
    violationCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

//compound
quizAttemptSchema.index({ studentId: 1, quizId: 1, status: 1 });

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);
