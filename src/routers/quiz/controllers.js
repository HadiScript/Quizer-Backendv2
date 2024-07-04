const { BadRequestError } = require("../../errors/bad-request-error");
const { NotAuthorizedError } = require("../../errors/not-authorized-error");
const QuestionModel = require("../../models/questionSchema");
const QuizModel = require("../../models/quizSchema");
const slugify = require("slugify");
const User = require("../../models/userSchema");

const createQuizHelper = async (req, title, requiredFields, timeLimit, quizInstructions) => {
  if (!requiredFields || !requiredFields.includes("Email")) {
    throw new BadRequestError("Email must be included in required fields");
  }

  const userQuiz = await QuizModel.find({ creator: req.currentUser.id });
  // console.log({ userQuiz });
  if (userQuiz.find((x) => x.slug.toLowerCase() === slugify(title).toLowerCase())) {
    throw new BadRequestError("This quiz is already exist.");
  }

  const newQuiz = new QuizModel({
    creator: req.currentUser.id,
    title,
    slug: slugify(title),
    requiredFields,
    timeLimit,
    quizInstructions,
    maxAttempts: 0,
    questions: [],
  });

  await newQuiz.save();

  return newQuiz;
};

// post requests;
const createQuiz = async (req, res) => {
  const { title, requiredFields, timeLimit, quizInstructions } = req.body;

  let newQuiz = await createQuizHelper(req, title, requiredFields, timeLimit, quizInstructions);
  console.log(newQuiz, "here is the things");
  res.json({ message: "Quiz has been created", quiz: newQuiz?._id });
};

// get requests; --question remaining**
const allQuizes = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const search = req.query.search;

  const query = { creator: req.currentUser.id };
  if (search) {
    query.title = { $regex: new RegExp(search, "i") };
  }

  const skip = (page - 1) * pageSize;

  const quizzes = await QuizModel.find(query).select("title questions createdAt").skip(skip).limit(pageSize).exec();

  // Get the total count of documents matching the query
  const total = await QuizModel.countDocuments(query);

  res.status(200).json({
    quizzes,
    pagination: {
      total: total,
      pageSize: Math.ceil(total / pageSize),
      page,
    },
  });
};

const quizById = async (req, res) => {
  const quiz = await QuizModel.findById({ _id: req.params.quizId });
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
  const { title, requiredFields, timeLimit, maxAttempts, quizInstructions } = req.body;

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
      quizInstructions,
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
  const { quizAvailability, displaySetting, mode, passingScore, scoringType, showScore, showCertificate, certificateId } = req.body;

  const quizCreator = await QuizModel.findById(quizId);
  const user = await User.findById({ _id: req.currentUser.id });
  if (quizCreator.creator.toString() !== req.currentUser.id.toString()) {
    throw new BadRequestError("You can't access this quiz");
  }

  // UPGRAD TO PREMIUM
  // if (user.subscriptionType === "free") {
  //   if (quizAvailability || displaySetting || scoringType) {
  //     throw new BadRequestError("Please update your account. You do not have right to perform this action.");
  //   }
  // }

  const quizSettings = {};

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
  if (showCertificate) {
    quizSettings.showCertificate = showCertificate;
  }
  if (certificateId) {
    quizSettings.certificateId = certificateId;
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
  createQuizHelper,

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
