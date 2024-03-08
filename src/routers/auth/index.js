const express = require("express");
const { body, validationResult } = require("express-validator");
const { RequestValidationError } = require("../../errors/request-validation-error");
const { validateRequest } = require("../../middlewares/validate-request");
const { login, signup, logout, currentSubs, currentAdmins, loginWithGoogle, signupWithGoogle, updatePassword } = require("./controllers");
const { currentUser, currentsubs, currentadmin } = require("../../middlewares/current-user");

const router = express.Router();

router.post(
  "/signin",
  [
    body("email").isEmail().withMessage("Email must be valid"),
    body("password").trim().isLength({ min: 4, max: 20 }).withMessage("Password must be between 4 and 20 characters"),
  ],
  validateRequest,
  login
);

router.post("/signin/g", loginWithGoogle);
router.post("/signup/g", signupWithGoogle);

router.post(
  "/signup",
  [
    body("name").isLength({ min: 4, max: 20 }).withMessage("Name is required, And must be between 4 and 20 characters"),
    body("email").isEmail().withMessage("Email must be valid"),
    body("password").trim().isLength({ min: 4, max: 20 }).withMessage("Password must be between 4 and 20 characters"),
  ],
  validateRequest,
  signup
);

router.post("/logout", logout);

router.get("/currentsubs", currentUser, currentSubs);

router.post(
  "/update-password",
  [
    currentUser,
    body("currentPassword").trim().notEmpty().withMessage("Current password is required"),
    body("newPassword").trim().isLength({ min: 6 }).withMessage("New password must be at least 6 characters long"),
  ],
  validateRequest,
  updatePassword
);

module.exports = router;
