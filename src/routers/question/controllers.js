const AttachingToughestQuestions = require("../../config/helpers/AttachingToughestQuestions");
const { BadRequestError } = require("../../errors/bad-request-error");
const QuestionModel = require("../../models/questionSchema");
const QuizModel = require("../../models/quizSchema");

// posts requests;
const addQuestionToQuiz = async (req, res) => {
  const { quizId } = req.params;
  const { text, type, options, correctAnswer, answer } = req.body;

  const quizExist = await QuizModel.findOne({ _id: quizId });
  if (!quizExist) {
    throw new BadRequestError("Quiz not found");
  }

  if (quizExist.creator.toString() !== req.currentUser.id.toString()) {
    throw new BadRequestError("You can't access to this quiz");
  }

  // options validation ***
  // if (type === "multiple-choice") {
  //   if (!options && options.length >= 2) {
  //     throw new BadRequestError("Please add atlead 2 options");
  //   }
  // }

  const highestPositionQuestion = await QuestionModel.findOne({ quiz: quizId }).sort({ position: -1 }).limit(1);

  let newPosition = 0;
  if (highestPositionQuestion) {
    newPosition = highestPositionQuestion.position + 1;
  }

  const newQuestion = new QuestionModel({
    quiz: quizId,
    position: newPosition,
    text,
    type,
    options: type === "multiple-choice" || type === "true-false" ? options : [],
    correctAnswer: type === "true-false" ? correctAnswer : undefined,
    answer: type === "short-answer" ? answer : undefined,
  });

  await newQuestion.save();
  await QuizModel.findByIdAndUpdate(quizId, { $push: { questions: newQuestion._id } });
  res.status(201).json({ message: "Question added successfully", question: newQuestion });
};

// get requests;
const getAllQuestionsForQuiz = async (req, res) => {
  const { quizId } = req.params;
  const { limits, whichQuestions } = req.query;

  // Check if the quiz exists
  const quizExists = await QuizModel.findById(quizId);
  if (!quizExists) {
    throw new BadRequestError("Quiz not found");
  }

  if (quizExists.creator.toString() !== req.currentUser.id.toString()) {
    throw new BadRequestError("You can't access to this quiz");
  }

  if (whichQuestions === "true") {
    const questions = await QuestionModel.find({ quiz: quizId });
    const result = await AttachingToughestQuestions(questions, quizId);
    console.log({ result: result.length });
    res.status(200).json({ message: "Questions retrieved successfully", questions: result });
  } else {
    const questions = await QuestionModel.find({ quiz: quizId }).sort({ position: 1 }).limit(parseInt(limits)).select("_id text position");
    console.log({ quesiotnlef: questions.length });
    res.status(200).json({ message: "Questions retrieved successfully", questions });
  }
};

const getQuestionById = async (req, res) => {
  const { questionId } = req.params;

  const question = await QuestionModel.findById({ _id: questionId });
  res.json({ question });
};

// put requests;
const reorderQuestions = async (req, res) => {
  const updates = req.body;
  // console.log("Reordered Questions:", updates); // Log to check the data

  const bulkOps = updates.map((update) => ({
    updateOne: {
      filter: { _id: update.id },
      update: { $set: { position: update.position } },
    },
  }));

  const result = await QuestionModel.bulkWrite(bulkOps);

  res.json({ message: "Questions reordered successfully" });
};

const editQuestion = async (req, res) => {
  const { questionId } = req.params;
  const { text, type, options, correctAnswer, answer } = req.body;

  const question = await QuestionModel.findByIdAndUpdate(
    { _id: questionId },
    { text, type, options, correctAnswer, answer },
    { new: true }
  );

  res.json({ question });
};

// delete requests;
const deleteQuestionFromQuiz = async (req, res) => {
  const { quizId, questionId } = req.params;

  // Check if the quiz exists
  const quizExists = await QuizModel.findById(quizId);
  if (!quizExists) {
    throw new BadRequestError("Quiz not found");
  }

  if (quizExists.creator.toString() !== req.currentUser.id.toString()) {
    throw new BadRequestError("You can't access to this quiz");
  }

  // Check if the question exists and belongs to the quiz
  const questionExists = await QuestionModel.findOne({ _id: questionId, quiz: quizId });
  if (!questionExists) {
    throw new BadRequestError("Question not found or does not belong to the specified quiz.");
  }

  // Delete the question
  await QuestionModel.findByIdAndDelete(questionId);

  // Remove the question reference from the quiz
  await QuizModel.findByIdAndUpdate(quizId, { $pull: { questions: questionId } });

  res.json({ message: "Question deleted successfully" });
};

module.exports = {
  // post requests;
  addQuestionToQuiz,

  // get requests;
  getAllQuestionsForQuiz,
  getQuestionById,

  // put requests;
  reorderQuestions,
  editQuestion,

  // delete requests;
  deleteQuestionFromQuiz,
};
