const express = require("express");
const { currentUser, currentsubs } = require("../../middlewares/current-user");
const {
  getAllQuestionsForQuiz,
  reorderQuestions,
  deleteQuestionFromQuiz,
  addQuestionToQuiz,
  getQuestionById,
  editQuestion,
  disableQuestion,
} = require("./controllers");
const { body } = require("express-validator");
const { validateRequest } = require("../../middlewares/validate-request");

const router = express.Router();

// post requests;
router.post(
  "/:quizId",
  currentUser,
  currentsubs,
  [body("text").not().isEmpty().withMessage("Text is required"), body("type").not().isEmpty().withMessage("Type is required")],
  validateRequest,
  addQuestionToQuiz
);

// get requests;
router.get("/:quizId", currentUser, currentsubs, getAllQuestionsForQuiz);
router.get("/one/:questionId", currentUser, currentsubs, getQuestionById);

// put requests;
router.put("/reorder", currentUser, currentsubs, reorderQuestions);
router.put("/one/:questionId", currentUser, currentsubs, editQuestion);

// patch
router.patch("/:quizId/:questionId", currentUser, currentsubs, disableQuestion);

// delete requests;
router.delete("/:quizId/:questionId", currentUser, currentsubs, deleteQuestionFromQuiz);

module.exports = router;
