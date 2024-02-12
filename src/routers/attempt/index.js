const express = require("express");
const { startQuiz, finishQuiz, getQuizByCreatorAndQuizId, getQuizForAttempt } = require("./controllers");

const router = express.Router();

// post requests;
router.post('/start', startQuiz)
router.post('/finish', finishQuiz);

// get requests;
router.get('/info/:creatorId/:quizId', getQuizByCreatorAndQuizId)
router.get('/quiz/:creatorId/:quizId', getQuizForAttempt)

module.exports = router;
