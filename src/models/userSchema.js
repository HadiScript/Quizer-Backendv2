const mongoose = require("mongoose");
const { Password } = require("../config/Password");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    googleId: { type: String },
    role: { type: String, default: "subscriber", enum: ["admin", "subscriber"] },
    createdQuizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Quiz" }],
    createdAt: { type: Date, default: Date.now() },
    subscriptionType: { type: String, default: "free", enum: ["free", "premium"] },
    globalSettings: {
      quizTimer: Number,
      mode: { type: String, enum: ["practice", "exam"] },
      passingScore: Number,
      showScore: { type: Boolean, default: false },
      scoringType: { type: String, enum: ["grade", "percentage"] },
    },

    logo: { type: String },
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
