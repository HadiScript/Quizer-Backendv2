const mongoose = require("mongoose");

const templateSchema = new mongoose.Schema(
  {
    htmlContent: {
      type: String,
      required: true,
    },
    isFree: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Template = mongoose.model("Template", templateSchema);

module.exports = Template;
