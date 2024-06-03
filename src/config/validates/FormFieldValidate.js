const { body } = require("express-validator");
const { validateRequest } = require("../../middlewares/validate-request");

const validateFormFields = [
  body("fields.*.type").isIn(["radio", "dropdown", "checkbox", "email", "text", "range", "date", "rate"]).withMessage("Invalid field type"),
  body("fields.*.label").not().isEmpty().withMessage("Field label is required"),
  body("fields.*.required").isBoolean().withMessage("Required must be a boolean"),
  body("fields.*.options").optional().isArray(),
  body("fields.*.options.*.label").not().isEmpty().withMessage("Option label is required"),
  body("fields.*.options.*.value").not().isEmpty().withMessage("Option value is required"),
  body("fields.*.placeholder").optional().isString(),
  body("fields.*.min").optional().isNumeric(),
  body("fields.*.max")
    .optional()
    .isNumeric()
    .custom((value, { req, location, path }) => {
      if (req.body.fields && req.body.fields.some((field) => field.type === "range" && field.min !== undefined && value < field.min)) {
        throw new Error("Max must be greater than min");
      }
      return true;
    }),
  validateRequest,
];

module.exports = {
  validateFormFields,
};
