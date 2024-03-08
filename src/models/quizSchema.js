const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  slug: { type: String, required: true, unqie: true },
  quizInstructions: {},
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
  // requiredFields: [{ type: String, enum: ["name", "phone", "email", "others"] }],
  requiredFields: {
    type: [String],
    validate: {
      validator: function (v) {
        return v.includes("Email");
      },
      message: (props) => `Email field is compulsory`,
    },
  },
  timeLimit: { type: Number, default: 60 }, // time in minutes
  maxAttempts: {
    type: Number,
    default: 1,
  },

  createdAt: { type: Date, default: Date.now() },

  // settings
  settings: {
    showScore: { type: Boolean, default: false },
    quizAvailability: {
      start: Date,
      end: Date,
    },
    displaySetting: { type: String, enum: ["all-at-once", "one-by-one-1-col", "one-by-one-2-col"] },
    mode: { type: String, enum: ["practice", "exam"] },
    passingScore: Number,
    scoringType: { type: String, enum: ["grade", "percentage"] },
    showCertificate: { type: Boolean, default: false },
    certificateId: { type: mongoose.Schema.Types.ObjectId, ref: "Template" },
  },
});

const QuizModel = mongoose.model("Quiz", quizSchema);

module.exports = QuizModel;
