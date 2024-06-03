const express = require("express");
const { currentUser, currentsubs } = require("../../middlewares/current-user");
const { body } = require("express-validator");
const { validateRequest } = require("../../middlewares/validate-request");
const {
  createSurvey,
  getUserSurveys,
  getSurveyBasicInfo,
  getSurveyFields,
  updateSurveyBasicInfo,
  updateSurveyFields,
  gettingFieldsForAttempt,
  submitSurveyResponse,
} = require("./controllers");
const { validateFormFields } = require("../../config/validates/FormFieldValidate");

const router = express.Router();

// POST
router.post(
  "/create",
  currentUser,
  currentsubs,
  [body("title").not().isEmpty().withMessage("Title is required"), body("description").optional().isString()],
  validateRequest,
  createSurvey
);

// PUT
router.put(
  "/:slug",
  currentUser,
  currentsubs,
  [body("title").not().isEmpty().withMessage("Title is required"), body("description").optional().isString()],
  validateRequest,
  updateSurveyBasicInfo
);

router.put("/update-fields/:slug", currentUser, currentsubs, validateFormFields, updateSurveyFields);

// GET
router.get("/", currentUser, currentsubs, getUserSurveys);
router.get("/:slug", currentUser, currentsubs, getSurveyBasicInfo);
router.get("/:slug/fields", currentUser, currentsubs, getSurveyFields);

// FOR ATTEMPTING THE SURVEY
// GET
router.get("/attempt/:slug/:userId", gettingFieldsForAttempt);

// POST
router.post("/submit/:slug/:userId", submitSurveyResponse);

module.exports = router;
