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

module.exports = router;
