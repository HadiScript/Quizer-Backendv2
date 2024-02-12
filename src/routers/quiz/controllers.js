const { BadRequestError } = require("../../errors/bad-request-error");
const { NotAuthorizedError } = require("../../errors/not-authorized-error");
const QuestionModel = require("../../models/questionSchema");
const QuizModel = require("../../models/quizSchema");
const slugify = require("slugify");

// post requests;
const createQuiz = async (req, res) => {
  const { title, requiredFields, timeLimit, maxAttempts } = req.body;

  if (!requiredFields || !requiredFields.includes("Email")) {
    throw new BadRequestError("Email must be included in required fields");
  }

  const newQuiz = new QuizModel({
    creator: req.currentUser.id,
    title,
    slug: slugify(title),
    requiredFields,
    timeLimit,
    maxAttempts: 0,
    questions: [],
  });

  await newQuiz.save();

  res.json({ message: "Quiz has been created", quiz: newQuiz });
};

// get requests; --question remaining**
const allQuizes = async (req, res) => {
  const quizzes = await QuizModel.find({ creator: req.currentUser.id }).populate({
    path: "questions",
    options: { sort: { position: 1 } },
  });

  res.status(200).json({ quizzes });
};

const quizById = async (req, res) => {
  const quiz = await QuizModel.findOne({ _id: req.params.quizId });
  res.status(200).json({ quiz });
};

const getQuizSettings = async (req, res) => {
  const { quizId } = req.params;

  const quizExists = await QuizModel.findById(quizId).select("settings");
  if (!quizExists) {
    throw new BadRequestError("Not found quiz settings.");
  }

  res.status(200).json({ settings: quizExists });
};

// put requests;
const updateQuizById = async (req, res) => {
  const { quizId } = req.params;
  const { title, requiredFields, timeLimit, maxAttempts } = req.body;

  if (!requiredFields || !requiredFields.includes("Email")) {
    throw new BadRequestError("Email must be included in required fields.");
  }

  const quizCreator = await QuizModel.findById(quizId);
  if (quizCreator.creator.toString() !== req.currentUser.id.toString()) {
    throw new BadRequestError("You can't access this quiz");
  }

  const updatedQuiz = await QuizModel.findByIdAndUpdate(
    quizId,
    {
      title,
      requiredFields,
      timeLimit,
      maxAttempts,
    },
    { new: true }
  );

  if (!updatedQuiz) {
    throw new BadRequestError("Quiz not found.");
  }

  res.status(200).json({ message: "Quiz updated successfully" });
};

// delete requests;
const updateQuizSettingsById = async (req, res) => {
  const { quizId } = req.params;
  const { quizTimer, quizAvailability, displaySetting, mode, passingScore, scoringType, showScore } = req.body;

  const quizCreator = await QuizModel.findById(quizId);
  if (quizCreator.creator.toString() !== req.currentUser.id.toString()) {
    throw new BadRequestError("You can't access this quiz");
  }

  const quizSettings = {};

  if (quizTimer) {
    quizSettings.quizTimer = quizTimer;
  }

  if (mode) {
    quizSettings.mode = mode;
  }

  if (passingScore) {
    quizSettings.passingScore = passingScore;
  }
  if (scoringType) {
    quizSettings.scoringType = scoringType;
  }

  if (displaySetting) {
    quizSettings.displaySetting = displaySetting;
  }

  if (showScore) {
    quizSettings.showScore = showScore;
  }

  if (quizAvailability) {
    quizSettings.quizAvailability = {
      start: new Date(quizAvailability.start),
      end: new Date(quizAvailability.end),
    };
  }

  const updateQuizSettings = await QuizModel.findByIdAndUpdate(
    { _id: quizId },
    { $set: { settings: quizSettings } },
    { new: true } // return the updated object and run schema validators
  );

  if (!updateQuizSettings) {
    throw new BadRequestError("Quiz not found");
  }

  res.status(200).json({
    message: "Quiz settings updated successfully",
    settings: quizSettings,
  });
};

// delete requests; --question remaining**
const deleteQuizById = async (req, res) => {
  const { quizId } = req.params;

  // Check if the quiz exists
  const quiz = await QuizModel.findById(quizId);
  if (!quiz) {
    throw new BadRequestError("Quiz not found");
  }

  if (quiz.creator.toString() !== req.currentUser.id.toString()) {
    throw new BadRequestError("You can't access to this quiz");
  }

  // Delete all questions related to the quiz
  await QuestionModel.deleteMany({ quiz: quizId });

  // Delete the quiz
  await QuizModel.findByIdAndDelete(quizId);

  res.status(200).json({ message: "Quiz and related questions deleted successfully" });
};

module.exports = {
  // post
  createQuiz,

  // get
  allQuizes,
  quizById,
  getQuizSettings,

  // put
  updateQuizById,
  updateQuizSettingsById,

  // delete
  deleteQuizById,
};
