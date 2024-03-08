const express = require("express");
const mongoose = require("mongoose");

const { GoogleGenerativeAI } = require("@google/generative-ai");
const QuizModel = require("../../models/quizSchema");
const QuestionModel = require("../../models/questionSchema");
const { currentsubs, currentUser } = require("../../middlewares/current-user");
const { default: slugify } = require("slugify");

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI("AIzaSyBN779_j9gtZdlRbJ78q0hi13wpbID6SEY");
// gemini-pro-vision

const router = express();

router.post("/generate-instructions", async (req, res) => {
  const { name, attempts, requiredFields, timeLimit } = req.body;

  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `Please write Quiz instruction, Quiz information :Quiz Title : ${name}, Quiz Time : ${timeLimit}min, Quiz Attempt Limit : ${attempts} (user can attmpet quiz upto ${attempts} times),  Required fields to attempt the quiz: ${requiredFields}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  res.send(text);
});

module.exports = router;
