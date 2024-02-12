const mongoose = require("mongoose");
const { Password } = require("../config/Password");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "subscriber", enum: ["admin", "subscriber"] },
    createdQuizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Quiz" }],
    subscriptionType: { type: String, default: "free", enum: ["free", "premium"] },
    createdAt: { type: Date, default: Date.now() },
    // Additional fields like profile information can be added here

    // Global Settings
    globalSettings: {
      quizTimer: Number,
      mode: { type: String, enum: ["practice", "exam"] },
      passingScore: Number,
      showScore: { type: Boolean, default: true },
      scoringType: { type: String, enum: ["grade", "percentage"] },
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
      },
    },
  }
);

userSchema.pre("save", async function (done) {
  if (this.isModified("password")) {
    const hashed = await Password.toHash(this.get("password"));
    this.set("password", hashed);
  }
  done();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
