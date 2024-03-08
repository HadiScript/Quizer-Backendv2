const { default: mongoose } = require("mongoose");
const { BadRequestError } = require("../../errors/bad-request-error");
const QuizAttemptModel = require("../../models/quizAttemptSchema");
const QuizModel = require("../../models/quizSchema");
const QuestionModel = require("../../models/questionSchema");
const AttachingToughestQuestions = require("../../config/helpers/AttachingToughestQuestions");

// get requests;
const ReportOfQuiz = async (req, res) => {
  const { quizId } = req.params;

  const totalAttempts = await QuizAttemptModel.countDocuments({ quiz: quizId });

  const averageScore = await QuizAttemptModel.aggregate([
    { $match: { quiz: new mongoose.Types.ObjectId(quizId) } },

    // Group by quiz ID and calculate the average score
    {
      $group: {
        _id: "$quiz",
        averageScore: { $avg: "$score" },
      },
    },
  ]);
  const attempts = await QuizAttemptModel.aggregate([
    { $match: { quiz: new mongoose.Types.ObjectId(quizId) } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$_id.month",
        day: "$_id.day",
        count: 1,
      },
    },
    {
      $project: {
        date: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: {
              $dateFromParts: {
                year: "$year",
                month: "$month",
                day: "$day",
              },
            },
          },
        },
        count: 1,
      },
    },
    {
      $sort: {
        date: 1, // 1 for ascending, -1 for descending
      },
    },
  ]);

  const attemptedUsers = await QuizAttemptModel.find({ quiz: quizId }).limit(10);

  // console.log({ totalAttempts, averageScore: averageScore[0]?.averageScore, attempts, attemptedUsers });

  res.json({
    totalAttempts,
    averageScore: averageScore[0]?.averageScore,
    attempts,
    attemptedUsers,
  });
};

const QuizAttempters = async (req, res) => {
  const { quizId } = req.params;
  const attempts = await QuizAttemptModel.find({ quiz: quizId });
  res.json({
    attempts,
  });
};

const QuizAttemptersResponses = async (req, res) => {
  const { attemptId } = req.params;
  const responses = await QuizAttemptModel.findById({ _id: attemptId }).populate("responses.question");
  res.json({
    responses,
  });
};

const getToughestQuestion = async (req, res) => {
  const quizId = req.params.quizId;

  const questions = await QuestionModel.find({ quiz: quizId });

  const result = await AttachingToughestQuestions(questions, quizId, res);

  res.json({ result });
};

const AttemptUsers = async (req, res) => {
  // Extract query parameters or set default values
  const quizId = req.params.quizId; // Get quizId from URL parameters
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const searchEmail = req.query.email;

  // Build the query for the specified quiz and searching by email (if provided)
  const query = { quiz: quizId };
  if (searchEmail) {
    query["studentDetails.Email"] = { $regex: new RegExp(searchEmail, "i") };
  }

  // Calculate the number of documents to skip
  const skip = (page - 1) * pageSize;

  // Fetch the quiz attempts with limit and skip for pagination
  const attempts = await QuizAttemptModel.find(query).skip(skip).limit(pageSize).exec();

  // Get the total count of documents matching the query
  const total = await QuizAttemptModel.countDocuments(query);

  // Send the response
  res.status(200).json({
    data: attempts,
    total: total,
    totalPages: Math.ceil(total / pageSize),
    currentPage: page,
  });
};

const PassingRatioForPeiChart = async (req, res) => {
  const { quizId } = req.params;

  const quizAttempts = await QuizAttemptModel.find({ quiz: quizId });

  const passCount = quizAttempts.filter((attempt) => attempt.isPass === true).length;
  const failCount = quizAttempts.filter((attempt) => attempt.isPass === false).length;

  const result = [
    { name: "Pass", value: passCount },
    { name: "Fail", value: failCount },
  ];

  return res.status(200).json({ result });
};

const reportForAll = async (req, res) => {
  const { from } = req.query;

  const creatorId = new mongoose.Types.ObjectId(req.currentUser.id);

  if (from === "summary") {
    const quizSummary = await QuizModel.aggregate([
      {
        $match: {
          creator: creatorId,
        },
      },
      {
        $lookup: {
          from: "quizattempts", // This should match the collection name of quiz attempts in MongoDB
          localField: "_id",
          foreignField: "quiz",
          as: "attempts",
        },
      },
      {
        $unwind: {
          path: "$attempts",
          preserveNullAndEmptyArrays: true, // Keep quizzes even if they have no attempts
        },
      },
      {
        $group: {
          _id: "$creator",
          totalQuizzes: { $sum: 1 },
          totalQuestions: { $sum: { $size: "$questions" } },
          totalAttempts: { $sum: { $cond: [{ $gt: ["$attempts", null] }, 1, 0] } }, // Increment for each non-null attempt
        },
      },
    ]);
    return res.json({ summary: quizSummary[0] });
  } else if (from === "graph") {
    const quizSummary = await QuizModel.aggregate([
      {
        $match: {
          creator: creatorId,
        },
      },
      {
        $lookup: {
          from: "quizattempts", // Ensure this matches the actual collection name in your database
          localField: "_id",
          foreignField: "quiz",
          as: "attempts",
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          attemptsCount: { $size: "$attempts" },
        },
      },
    ]);

    res.json({ quizSummary });
  }
};

module.exports = {
  // get requests;'
  reportForAll,
  ReportOfQuiz,
  QuizAttempters,
  QuizAttemptersResponses,
  getToughestQuestion,
  AttemptUsers,
  PassingRatioForPeiChart,
};
