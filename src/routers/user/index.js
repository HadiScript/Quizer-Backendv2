const express = require("express");
const { currentUser, currentsubs } = require("../../middlewares/current-user");
const { getGlobalSettings, updateGlobalSettings, updateToPremium, uploadLogo, deleteLogo, successfullPayment } = require("./controllers");
const logoUpload = require("../../config/helpers/uploadLogos");
const { BadRequestError } = require("../../errors/bad-request-error");

const router = express.Router();

// get requests;
router.get("/g/settings", currentUser, currentsubs, getGlobalSettings);
router.get("/successfull-payment", currentUser, currentsubs, successfullPayment);

// put requests;
router.put("/g/settings", currentUser, currentsubs, updateGlobalSettings);
router.put("/to/premium", currentUser, currentsubs, updateToPremium);

// // post request
router.post("/upload-logo", currentUser, currentsubs, logoUpload.single("image"), (req, res) => {
  if (req.fileValidationError) {
    throw new BadRequestError("Image size.");
  }
  uploadLogo(req, res);
});

router.post("/remove-logo", currentUser, currentsubs, logoUpload.single("image"), (req, res) => {
  if (req.fileValidationError) {
    throw new BadRequestError("Image size.");
  }
  deleteLogo(req, res);
});

module.exports = router;
