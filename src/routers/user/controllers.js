const { BadRequestError } = require("../../errors/bad-request-error");
const User = require("../../models/userSchema");

// get request;
const getGlobalSettings = async (req, res) => {
  const settings = await User.findById(req.currentUser.id).select("globalSettings");
  res.json(settings);
};

// put request;
const updateGlobalSettings = async (req, res) => {
  const userId = req.currentUser.id;
  const { quizTimer, mode, passingScore, scoringType, showScore } = req.body;

  const globalSettings = {};

  if (quizTimer) {
    globalSettings.quizTimer = quizTimer;
  }

  if (mode) {
    globalSettings.mode = mode;
  }

  if (passingScore) {
    globalSettings.passingScore = passingScore;
  }
  if (scoringType) {
    globalSettings.scoringType = scoringType;
  }

  if (!showScore || showScore) {
    globalSettings.showScore = showScore;
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: { globalSettings } },
    { new: true, runValidators: true } // return the updated object and run schema validators
  );

  if (!updatedUser) {
    throw new BadRequestError("Quiz not found");
  }

  res.json({
    message: "Global settings updated successfully",
  });
};

module.exports = {
  // get request;
  getGlobalSettings,

  // put request;
  updateGlobalSettings,
};
