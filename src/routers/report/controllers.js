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
          Response: { $sum: 1 },
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
    { name: "Pass", Count: passFailCountsObject.Pass || 0 },
    { name: "Fail", Count: passFailCountsObject.Fail || 0 },
  ];

  const highestScore = await QuizAttemptModel.find({ quiz: quizId }).select("studentDetails score isPass").sort({ score: -1 }).limit(10);

  res.json({
    totalAttempts,
    averageScore: averageScore[0]?.averageScore || 0,
    attempts,
    attemptedUsers,
    result,
    highestScore,
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

// list of attempt users
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
    pagination: {
      total: total,
      pageSize: Math.ceil(total / pageSize),
      page,
    },
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

// overall dashboard
const reportForAll = async (req, res) => {
  const { from } = req.query;

  const creatorId = new mongoose.Types.ObjectId(req.currentUser.id);

  if (from === "summary") {
    const totalQuizzes = await QuizModel.countDocuments({ creator: creatorId });

    // Get total number of questions in quizzes created by this user
    const totalQuestions = await QuestionModel.countDocuments({
      quiz: { $in: (await QuizModel.find({ creator: creatorId }).select("_id").exec()).map((q) => q._id) },
    });

    // Get total number of enabled and disabled questions
    const questionStats = await QuestionModel.aggregate([
      { $match: { quiz: { $in: (await QuizModel.find({ creator: creatorId }).select("_id").exec()).map((q) => q._id) } } },
      {
        $group: {
          _id: "$disable",
          count: { $sum: 1 },
        },
      },
    ]);

    // Initialize default counts
    let enabledQuestions = 0,
      disabledQuestions = 0;
    questionStats.forEach((item) => {
      if (item._id) {
        disabledQuestions = item.count;
      } else {
        enabledQuestions = item.count;
      }
    });

    // Get total quiz attempts, pass and fail attempts for quizzes created by this user
    const quizAttemptsStats = await QuizAttemptModel.aggregate([
      { $match: { quiz: { $in: (await QuizModel.find({ creator: creatorId }).select("_id").exec()).map((q) => q._id) } } },
      {
        $group: {
          _id: "$isPass",
          count: { $sum: 1 },
        },
      },
    ]);

    // Initialize default counts
    let passAttempts = 0,
      failAttempts = 0;
    quizAttemptsStats.forEach((item) => {
      if (item._id) {
        passAttempts = item.count;
      } else {
        failAttempts = item.count;
      }
    });

    res.json({
      totalQuizzes,
      totalQuestions,
      enabledQuestions,
      disabledQuestions,
      totalAttempts: passAttempts + failAttempts,
      passAttempts,
      failAttempts,
    });
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

const getHighScores = async (req, res) => {
  try {
    const quizId = req.params.quizId;
    const result = await QuizAttemptModel.find({ quiz: quizId }).sort({ score: -1 }).limit(10); // You can adjust the limit as needed
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send(error);
  }
};

const getScoreDistribution = async (req, res) => {
  try {
    const quizId = req.params.quizId;
    const result = await QuizAttemptModel.aggregate([
      { $match: { quiz: mongoose.Types.ObjectId(quizId) } },
      {
        $bucket: {
          groupBy: "$score",
          boundaries: [0, 20, 40, 60, 80, 100], // Define your own boundaries
          default: "Other",
          output: {
            count: { $sum: 1 },
          },
        },
      },
    ]);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send(error);
  }
};

const getAverageTimeSpent = async (req, res) => {
  try {
    const quizId = req.params.quizId;
    const result = await QuizAttemptModel.aggregate([
      { $match: { quiz: new mongoose.Types.ObjectId(quizId) } },
      {
        $project: {
          duration: { $subtract: ["$endTime", "$startTime"] },
        },
      },
      {
        $group: {
          _id: "$quiz",
          averageTimeSpent: { $avg: "$duration" },
        },
      },
    ]);

    if (result.length > 0) {
      const averageDurationMs = result[0].averageTimeSpent;
      const minutes = Math.floor(averageDurationMs / 60000);
      const seconds = ((averageDurationMs % 60000) / 1000).toFixed(0);
      const readableTime = `${minutes} minutes and ${seconds} seconds`;

      res.status(200).send({ averageTimeSpent: readableTime });
    } else {
      res.status(200).send({ averageTimeSpent: "No data available" });
    }
  } catch (error) {
    res.status(500).send(error);
  }
};

const getCompletionRate = async (req, res) => {
  try {
    const quizId = req.params.quizId;
    const result = await QuizAttemptModel.aggregate([
      { $match: { quiz: new mongoose.Types.ObjectId(quizId) } },
      {
        $group: {
          _id: "$quiz",
          totalAttempts: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$submitType", "within-time"] }, 1, 0] } },
        },
      },
      {
        $project: {
          completionRate: { $divide: ["$completed", "$totalAttempts"] },
          incompleteRate: { $subtract: [1, { $divide: ["$completed", "$totalAttempts"] }] },
        },
      },
    ]);
    if (result.length > 0) {
      const completionData = [
        { name: "Completed", value: result[0].completionRate * 100 },
        { name: "Incomplete", value: result[0].incompleteRate * 100 },
      ];
      res.status(200).send(completionData);
    } else {
      res.status(200).send([
        { name: "Completed", value: 0 },
        { name: "Incomplete", value: 100 },
      ]);
    }
  } catch (error) {
    res.status(500).send(error);
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

  getHighScores,
  getScoreDistribution,
  getAverageTimeSpent,
  getCompletionRate,
};
