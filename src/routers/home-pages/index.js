const express = require("express");

const { body } = require("express-validator");
const { validateRequest } = require("../../middlewares/validate-request");
const { currentUser, currentsubs } = require("../../middlewares/current-user");
const {
  createHomePage,
  getAllMyHomePages,
  editHomePage,
  getAllMySingleHomePage,
  getAllQuizzesForHomePage,
  deleteHomePage,
} = require("./controller");

const router = express.Router();

// GET
router.get("/mine", currentUser, currentsubs, getAllMyHomePages);
router.get("/mine-one/:slug", currentUser, currentsubs, getAllMySingleHomePage);
router.get("/all-quizzes", currentUser, currentsubs, getAllQuizzesForHomePage);

// POST
router.post(
  "/create",
  currentUser,
  currentsubs,
  [body("title").not().isEmpty().withMessage("Tittle is required")],
  validateRequest,
  createHomePage
);

// PUT
router.put("/edit/:slug", currentUser, currentsubs, editHomePage);

router.delete("/delete/:slug", currentUser, currentsubs, deleteHomePage);

module.exports = router;
