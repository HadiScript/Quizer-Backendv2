const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
  text: {},
  position: { type: Number, required: true },
  type: { type: String, required: true, enum: ["multiple-choice", "true-false", "short-answer"] },
  options: [
    {
      text: {
        type: String,
        required: function () {
          return this.type === "multiple-choice";
        },
      },
      isCorrect: {
        type: Boolean,
        required: function () {
          return this.type === "multiple-choice";
        },
      },
    },
  ],

  // For short answer questions, store the answer as a string
  answer: {
    type: String,
    required: function () {
      return this.type === "short-answer";
    },
  },

  createdAt: { type: Date, default: Date.now() },
});

const QuestionModel = mongoose.model("Question", questionSchema);

module.exports = QuestionModel;
