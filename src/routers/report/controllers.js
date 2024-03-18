const { default: mongoose } = require("mongoose");
const { BadRequestError } = require("../../errors/bad-request-error");
const QuizAttemptModel = require("../../models/quizAttemptSchema");
const QuizModel = require("../../models/quizSchema");
const QuestionModel = require("../../models/questionSchema");
const AttachingToughestQuestions = require("../../config/helpers/AttachingToughestQuestions");

// get requests;
const ReportOfQuiz = async (req, res) => {
  const { quizId } = req.params;

  const [totalAttempts, averageScore, attempts, attemptedUsers, passFailCounts] = await Promise.all([
    QuizAttemptModel.countDocuments({ quiz: quizId }),
    QuizAttemptModel.aggregate([
      {
        $match: { quiz: new mongoose.Types.ObjectId(quizId) },
      },
      {
        $group: {
          _id: "$quiz",
          averageScore: { $avg: "$score" },
        },
      },
    ]),
    QuizAttemptModel.aggregate([
      {
        $match: { quiz: new mongoose.Types.ObjectId(quizId) },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]),
    QuizAttemptModel.find({ quiz: quizId }).limit(10),
    QuizAttemptModel.aggregate([
      {
        $match: { quiz: new mongoose.Types.ObjectId(quizId) },
      },
      {
        $group: {
          _id: "$isPass",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const passFailCountsObject = passFailCounts.reduce((acc, curr) => {
    acc[curr._id ? "Pass" : "Fail"] = curr.count;
    return acc;
  }, {});

  const result = [
    { name: "Pass", value: passFailCountsObject.Pass || 0 },
    { name: "Fail", value: passFailCountsObject.Fail || 0 },
  ];

  res.json({
    totalAttempts,
    averageScore: averageScore[0]?.averageScore || 0,
    attempts,
    attemptedUsers,
    result,
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
  const quizId = req.params.quizId; 
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const searchEmail = req.query.email;

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
          from: "quizAttemptSchema",
          localField: "_id",
          foreignField: "quiz",
          as: "attempts",
        },
      },
      {
        $unwind: {
          path: "$attempts",
          preserveNullAndEmptyArrays: true, 
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

// passing Ratio, toughest questions
//
const reportForPerQuiz = async (req, res) => {
  const { quizId } = req.params;

  const quizAttempts = await QuizAttemptModel.find({ quiz: quizId });

  const passCount = quizAttempts.filter((attempt) => attempt.isPass === true).length;
  const failCount = quizAttempts.filter((attempt) => attempt.isPass === false).length;

  const result = [
    { name: "Pass", value: passCount },
    { name: "Fail", value: failCount },
  ];
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
