const express = require("express");

const { currentUser, currentsubs } = require("../../middlewares/current-user");
const {
  ReportOfQuiz,
  QuizAttempters,
  QuizAttemptersResponses,
  getToughestQuestion,
  AttemptUsers,
  PassingRatioForPeiChart,
  reportForAll,
  getHighScores,
  getScoreDistribution,
  getAverageTimeSpent,
  getCompletionRate,
} = require("./controllers");

const router = express.Router();

// get requests;
router.get("/", currentUser, currentsubs, reportForAll);
router.get("/:quizId", currentUser, currentsubs, ReportOfQuiz);
router.get("/who-attempted/:quizId", currentUser, currentsubs, QuizAttempters);
router.get("/responses/:attemptId", currentUser, currentsubs, QuizAttemptersResponses);
router.get("/toughest/:quizId", currentUser, currentsubs, getToughestQuestion);
router.get("/attempter/:quizId", currentUser, currentsubs, AttemptUsers);
router.get("/passing-ratio/:quizId", currentUser, currentsubs, PassingRatioForPeiChart);

router.get("/highest-score/users/:quizId", currentUser, currentsubs, getHighScores);
router.get("/score-distribution/:quizId", currentUser, currentsubs, getScoreDistribution);
router.get("/avg-time/:quizId", currentUser, currentsubs, getAverageTimeSpent);
router.get("/completion-rate/:quizId", currentUser, currentsubs, getCompletionRate);

module.exports = router;
