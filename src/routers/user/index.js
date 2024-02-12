const express = require("express");
const { currentUser, currentsubs } = require("../../middlewares/current-user");
const { getGlobalSettings, updateGlobalSettings } = require("./controllers");
const router = express.Router();

// get requests;
router.get("/g/settings", currentUser, currentsubs, getGlobalSettings);

// put requests;
router.put("/g/settings", currentUser, currentsubs, updateGlobalSettings);

module.exports = router;
