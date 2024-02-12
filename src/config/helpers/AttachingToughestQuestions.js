const QuizAttemptModel = require("../../models/quizAttemptSchema");

const AttachingToughestQuestions = async (questions, quizId) => {
  let correctAnswers = {};
  questions.forEach((question) => {
    if (question.type === "multiple-choice") {
      // Find the option where isCorrect is true
      const correctOption = question.options.find((option) => option.isCorrect);
      correctAnswers[question._id.toString()] = correctOption ? correctOption.text : null;
    } else if (question.type === "short-answer") {
      correctAnswers[question._id.toString()] = question.answer;
    }
  });

  // Fetch all quiz attempts for this quiz
  const quizAttempts = await QuizAttemptModel.find({
    quiz: quizId,
  });
  if (quizAttempts.length === 0) {
    return res.json({});
  }

  // Process the quiz attempts to count incorrect responses for each question
  let incorrectCounts = {};
  quizAttempts.forEach((attempt) => {
    attempt.responses.forEach((response) => {
      if (correctAnswers[response.question.toString()] !== response.selectedOption) {
        incorrectCounts[response.question] = (incorrectCounts[response.question] || 0) + 1;
      }
    });
  });

  // Sort questions by the frequency of incorrect responses
  const toughestQuestions = Object.keys(incorrectCounts)
    .map((questionId) => ({
      questionId,
      incorrectCount: incorrectCounts[questionId],
    }))
    .sort((a, b) => b.incorrectCount - a.incorrectCount);

  let result = [];
  toughestQuestions.forEach((x) => {
    let findedQuestions = {};
    let finded = questions.find((question) => question._id.toString() === x.questionId.toString());
    findedQuestions.questionId = x.questionId;
    findedQuestions.incorrectCount = x.incorrectCount;
    findedQuestions.text = finded?.text || null;

    result.push(findedQuestions);
  });

  return result;
};

module.exports = AttachingToughestQuestions;
