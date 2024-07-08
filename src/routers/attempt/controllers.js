const sharp = require("sharp");
const moment = require("moment");

const convertScoreToGrade = require("../../config/helpers/Grading");
const { convertHtmlToWebp } = require("../../config/helpers/converter");
const isUserPassing = require("../../config/helpers/isUserPadding");
const { BadRequestError } = require("../../errors/bad-request-error");
const QuestionModel = require("../../models/questionSchema");
const QuizAttemptModel = require("../../models/quizAttemptSchema");
const QuizModel = require("../../models/quizSchema");
const Template = require("../../models/templates");
const User = require("../../models/userSchema");

// post requests;
const startQuiz = async (req, res) => {
  const { quizId, studentDetails } = req.body;
  console.log("from quiz start, yes");

  // Find the quiz and check required fields
  const quiz = await QuizModel.findById(quizId).populate("requiredFields");
  if (!quiz) {
    throw new BadRequestError("Quiz not found");
  }

  // Validate student details against required fields
  const missingFields = quiz.requiredFields.filter((field) => !studentDetails[field]);
  if (missingFields.length > 0) {
    throw new BadRequestError(`Missing required fields:  ${missingFields.join(", ")}`);
  }

  // Check previous attempts
  const previousAttemptsCount = await QuizAttemptModel.countDocuments({
    quiz: quizId,
    "studentDetails.Email": studentDetails.Email,
  });

  if (previousAttemptsCount >= quiz.maxAttempts) {
    throw new BadRequestError(`Maximum attempt limit reached`);
  }

  // Create a new quiz attempt
  const newAttempt = new QuizAttemptModel({
    quiz: quizId,
    studentDetails,
    startTime: new Date(),
    // endTime will be calculated based on quiz timeLimit
  });

  await newAttempt.save();

  // Send response
  res.status(201).json({ message: "Quiz attempt started", attemptId: newAttempt._id });
};

const finishQuiz = async (req, res) => {
  const { attemptId, responses, submitType } = req.body;

  // Find the quiz attempt
  const quizAttempt = await QuizAttemptModel.findById(attemptId).populate({
    path: "quiz",
    populate: {
      path: "creator",
      model: "User",
    },
  });

  if (!quizAttempt) {
    throw new BadRequestError("Quiz attempt not found");
  }

  // Check if the quiz has its own settings or use global user settings
  const quizSettings = quizAttempt.quiz.settings || {};
  const userSettings = quizAttempt.quiz.creator.globalSettings || {};
  const showScore = quizSettings.showScore ?? userSettings.showScore;

  const scoringType = quizSettings.scoringType || userSettings.scoringType;
  const passingScore = quizSettings.passingScore || userSettings.passingScore;

  // Fetch all questions referenced in the responses in a single query
  const questionIds = responses.map((response) => response.questionId);
  const questions = await QuestionModel.find({ _id: { $in: questionIds } });

  // Map questions for easy lookup
  const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

  // Calculate the score
  let score = 0;
  let grade;
  let totalQuestions = questions.length;
  responses.forEach((response) => {
    const question = questionMap.get(response.questionId);
    if (!question) return;

    switch (question.type) {
      case "multiple-choice":
        const correctOption = question.options.find((option) => option.isCorrect);
        if (question.options.some((option) => option.isCorrect && option.text === response.selectedOption)) {
          score += 1;
        }
        break;

      case "short-answer":
        if (question.answer.toLowerCase() === response.selectedOption.toLowerCase().trim()) {
          score += 1;
        }
        break;
    }
  });

  // Adjust score based on scoring type
  if (scoringType === "percentage") {
    score = (score / totalQuestions) * 100;
  } else if (scoringType === "grade") {
    grade = convertScoreToGrade(score, totalQuestions);
  }

  let passOrFail = isUserPassing(totalQuestions, score, passingScore, scoringType);

  // Update the quiz attempt
  quizAttempt.responses = responses;
  quizAttempt.submitType = submitType;
  quizAttempt.isPass = passOrFail;

  quizAttempt.endTime = new Date();
  quizAttempt.score = score;

  // return;
  await quizAttempt.save();

  let _score = grade ? grade : score;
  if (!showScore) {
    return res.status(200).json({ message: "Quiz attempt finished, Score is hidden" });
  }

  return res.status(200).json({ message: "Quiz attempt finished", _score });
};

// get requests;
const getQuizByCreatorAndQuizId = async (req, res) => {
  const { creatorId, quizId } = req.params;

  const quiz = await QuizModel.findOne({ _id: quizId, creator: creatorId });
  if (!quiz) {
    throw new BadRequestError("Quiz not found or access denied");
  }

  const currentTime = new Date();
  if (quiz.settings && quiz.settings.quizAvailability.start) {
    if (quiz.settings.quizAvailability.start <= currentTime && currentTime <= quiz.settings.quizAvailability.end) {
      const quizData = {
        _id: quiz._id,
        title: quiz.title,
        timeLimit: quiz.timeLimit,
        requiredFields: quiz.requiredFields,
        settings: quiz.settings,
        quizInstructions: quiz.quizInstructions,
      };

      return res.json({ quizData });
    } else {
      const notAvailable = {
        message: `Quiz not available at this time. `,
        availableFrom: quiz.settings.quizAvailability.start,
        availableUntil: quiz.settings.quizAvailability.end,
      };
      // console.log("not");

      return res.status(202).json({ notAvailable });
    }
  } else {
    // Prepare and send the quiz information
    const quizData = {
      _id: quiz._id,
      title: quiz.title,
      timeLimit: quiz.timeLimit,
      requiredFields: quiz.requiredFields,
      quizInstructions: quiz.quizInstructions,
    };
    // console.log("yes");
    return res.status(200).json({ quizData });
  }
};

const getQuizForAttempt = async (req, res) => {
  const { creatorId, quizId } = req.params; // Assuming quizId is passed as a URL parameter

  const quiz = await QuizModel.findOne({ _id: quizId, creator: creatorId }).populate("questions");
  const creator = await User.findById(creatorId);

  if (!quiz) {
    return next(errorHandler(404, "Quiz not found."));
  }

  const mode = quiz.settings && quiz.settings.mode ? quiz.settings.mode : creator.globalSettings.mode;
  const displaySetting = quiz.settings && quiz.settings.displaySetting ? quiz.settings.displaySetting : "all-at-once";

  // Prepare the quiz data for the attempt
  const quizData = {
    _id: quiz._id,
    title: quiz.title,
    timeLimit: quiz.timeLimit,
    mode: mode, // Include mode in quizData
    displaySetting,
    questions: quiz.questions.map((question) => {
      return {
        _id: question._id,
        text: question.text,
        type: question.type,
        options: question.options.map((option) => {
          // If mode is 'practice', include correct answers; otherwise, exclude them
          return mode === "practice" ? option : { text: option.text };
        }),
      };
    }),
  };

  return res.status(200).json(quizData);
};

const thanksAttemptingQuiz = async (req, res) => {
  const { quizId, attemptId } = req.params;

  const quiz = await QuizModel.findById(quizId)
    .populate({
      path: "creator",
      select: { globalSettings: 1 },
    })
    .select({ creator: 1, settings: 1, questions: 1 });

  const quizSettings = quiz.settings || {};
  const userSettings = quiz.creator.globalSettings || {};
  const mode = quizSettings.mode || userSettings.mode;
  const showScore = quizSettings.showScore || userSettings.showScore;

  if (mode === "practice" && !showScore) {
    return res.json({ ok: true }); // means just show an message for thank you
  }

  const attempt = await QuizAttemptModel.findById(attemptId);

  const scoringType = quizSettings.scoringType || userSettings.scoringType;

  const showCertificate = quizSettings.showCertificate;
  const certificateId = quizSettings.certificateId;

  let totalQuestions = attempt.responses.length;
  let score = attempt.score;
  let grade;

  if (scoringType === "grade") {
    grade = convertScoreToGrade(score, totalQuestions);
  }

  if (scoringType === "percentage") {
    score = score.toPrecision(2) + "%";
  }

  let _score = scoringType === "grade" ? grade : score;

  if (mode === "practice") {
    return res.json({ score: _score });
  } else if (showCertificate) {
    const template = await Template.findById(certificateId);
    let finalHtml = template.htmlContent;
    finalHtml = finalHtml.replace("{{name}}", attempt.studentDetails?.name ? attempt.studentDetails?.name : attempt.studentDetails?.Email);
    finalHtml = finalHtml.replace("{{date}}", moment(Date.now()).format("MMM Do YY"));
    const imageContent = await convertHtmlToWebp(finalHtml);
    const webPImageBuffer = await sharp(imageContent).webp().toBuffer();
    const imageBase64 = webPImageBuffer.toString("base64");

    res.setHeader("Content-Type", "image/webp");
    res.setHeader("Content-Disposition", `attachment; filename=certificate-${template._id}.webp`);
    res.json({
      showDownloadCertificate: true,
      certificate: `data:image/webp;base64,${imageBase64}`,
    });
  } else {
    return res.json({ score: _score });
  }
};

module.exports = {
  // post requests;
  startQuiz,
  finishQuiz,

  // get requests;
  getQuizByCreatorAndQuizId,
  getQuizForAttempt,
  thanksAttemptingQuiz,
};
