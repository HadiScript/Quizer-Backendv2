const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define options for each field type
const fieldOptionsSchema = new Schema({
  label: { type: String, required: true },
  value: { type: String, required: true },
});

// Define the schema for each field in the survey
const fieldSchema = new Schema({
  type: {
    type: String,
    enum: ["radio", "dropdown", "checkbox", "email", "text", "range", "date"],
    required: true,
  },
  label: { type: String, required: true },
  required: { type: Boolean, default: false },
  options: [fieldOptionsSchema], // For radio, dropdown, checkbox
  placeholder: String, // For text, email
  min: Number, // For range
  max: Number, // For range
});

// Define the schema for the survey
const surveySchema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true },
  description: String,
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
  fields: [fieldSchema],
});

// Define the schema for survey responses
const responseSchema = new Schema({
  surveyId: { type: Schema.Types.ObjectId, ref: "Survey", required: true },
  responses: [
    {
      fieldId: { type: Schema.Types.ObjectId, required: true },
      value: Schema.Types.Mixed, // Depending on the field type
    },
  ],
  respondedAt: { type: Date, default: Date.now },
});

// Create models from the schemas
const Survey = mongoose.model("Survey", surveySchema);
const Response = mongoose.model("Response", responseSchema);

module.exports = { Survey, Response };
