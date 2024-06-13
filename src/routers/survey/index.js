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
const {
  getResponseDataByDate,
  getSurveyFieldStats,
  getAllFields,
  getRadioFieldData,
  getCheckboxFieldData,
  getRateFieldData,
  getDropdownFieldData,
  getSurveyResponses,
  getSingleResponse,
  getFieldOverview,
  reportForAllSurveys,
} = require("./dashbaord");

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

// DASHBOARD
// GET
router.get("/dashboard/main", currentUser, currentsubs, reportForAllSurveys);
router.get("/dashboard/:slug", currentUser, currentsubs, getResponseDataByDate);
router.get("/dashboard/:slug/stats", currentUser, currentsubs, getSurveyFieldStats);
router.get("/dashboard/:slug/all-fields", currentUser, currentsubs, getAllFields);

router.get("/dashboard/:slug/reponses", currentUser, currentsubs, getSurveyResponses);
router.get("/dashboard/reponse/:responseId", currentUser, currentsubs, getSingleResponse);
router.get("/dashboard/:slug/overview", currentUser, currentsubs, getFieldOverview);

// PUT
router.put("/dashboard/:slug/radio-rate", currentUser, currentsubs, getRadioFieldData);
router.put("/dashboard/:slug/checkbox-rate", currentUser, currentsubs, getCheckboxFieldData);
router.put("/dashboard/:slug/rating-rate", currentUser, currentsubs, getRateFieldData);
router.put("/dashboard/:slug/dropdown-rate", currentUser, currentsubs, getDropdownFieldData);
// getSingleResponse

// getRadioFieldData
// getRadioFields

module.exports = router;
