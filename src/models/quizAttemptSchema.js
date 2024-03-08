const mongoose = require("mongoose");

const quizAttemptSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },

  studentDetails: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  responses: [
    {
      question: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
      selectedOption: String,
    },
  ],
  score: { type: Number, default: 0 },
  isPass: { type: Boolean },
  submitType: { type: String, enum: ["time-up", "within-time"], default: "within-time" },
  startTime: { type: Date },
  endTime: { type: Date },
  certified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now() },
});

const QuizAttemptModel = mongoose.model("QuizAttempt", quizAttemptSchema);

module.exports = QuizAttemptModel;
