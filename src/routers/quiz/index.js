const express = require("express");
const { currentUser, currentsubs } = require("../../middlewares/current-user");
const { body } = require("express-validator");
const { validateRequest } = require("../../middlewares/validate-request");
const { allQuizes, quizById, getQuizSettings, updateQuizById, updateQuizSettingsById, deleteQuizById, createQuiz } = require("./controllers");
const router = express.Router();

// post requests;
router.post(
  "/create",
  currentUser,
  currentsubs,
  [
    body("title").not().isEmpty().withMessage("Title is required"),
    body("timeLimit").isFloat({ gt: 0 }).withMessage("Time limit must be greater than 0"),
    // body("maxAttempts").isFloat({ gt: 0 }).withMessage("Max Attempts must be greater than 0"),
  ],
  validateRequest,
  createQuiz
);

// get requests;
router.get("/all", currentUser, currentsubs, allQuizes);
router.get("/:quizId", currentUser, currentsubs, quizById);
router.get("/s/:quizId", currentUser, currentsubs, getQuizSettings);

// put requests;
router.put(
  "/:quizId",
  currentUser,
  currentsubs,
  [
    body("title").not().isEmpty().withMessage("Title is required"),
    body("timeLimit").isFloat({ gt: 0 }).withMessage("Time limit must be greater than 0"),
    body("maxAttempts").isFloat({ gt: 0 }).withMessage("Max Attempts must be greater than 0"),
  ],
  validateRequest,
  updateQuizById
);

router.put("/s/:quizId", currentUser, currentsubs, updateQuizSettingsById);

// delete requests;
router.delete("/delete/:quizId", currentUser, currentsubs, deleteQuizById);

module.exports = router;
