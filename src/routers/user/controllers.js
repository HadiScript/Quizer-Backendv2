const { BadRequestError } = require("../../errors/bad-request-error");
const { currentUser } = require("../../middlewares/current-user");
const User = require("../../models/userSchema");
const fs = require("fs");
const stripe = require("stripe")(
  "sk_test_51OoMlkSFAU5oOmtKqDekDSEjjyQhMPp7y6fELLbC6QFee0xnxVSZLceKAPdCmy6vHrP9Jb2X3ptPIJZJtX06zScs00G6QpcMWQ"
);

// get request;
const getGlobalSettings = async (req, res) => {
  const settings = await User.findById(req.currentUser.id).select("globalSettings");
  res.json(settings);
};

// after getting sucessfull payent
// Route for handling success page redirection
const successfullPayment = async (req, res) => {
  const sessionId = req.query.session_id;
  console.log("Session ID:", req.query);
  console.log("Full Request URL:", req.originalUrl);

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  // // Here you can handle post-payment success, such as:
  // // - Updating the user's subscription status in your database
  // // - Sending a confirmation email to the user
  // // - Logging payment success for audit purposes

  const user = await User.findByIdAndUpdate(
    req.currentUser.id,
    {
      subscriptionType: "premium",
    },
    { new: true }
  );

  res.json({
    ok: true,
    user: {
      email: user.email,
      role: user.role,
      name: user.name,
      logo: user.logo,
      type: user.subscriptionType,
    },
  });
};

// put request;
const updateGlobalSettings = async (req, res) => {
  const userId = req.currentUser.id;
  const { quizTimer, mode, passingScore, scoringType, showScore } = req.body;

  const user = await User.findById({ _id: userId });

  if (user.subscriptionType === "free") {
    if (showScore || scoringType) {
      throw new BadRequestError("Please update your account. You don't have right to perform this action.");
    }
  }

  const globalSettings = {};

  if (quizTimer) {
    globalSettings.quizTimer = quizTimer;
  }

  if (mode) {
    globalSettings.mode = mode;
  }

  if (passingScore) {
    globalSettings.passingScore = passingScore;
  }
  if (scoringType) {
    globalSettings.scoringType = scoringType;
  }

  if (!showScore || showScore) {
    globalSettings.showScore = showScore;
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: { globalSettings } },
    { new: true, runValidators: true } // return the updated object and run schema validators
  );

  if (!updatedUser) {
    throw new BadRequestError("Quiz not found");
  }

  res.json({
    message: "Global settings updated successfully",
  });
};

const updateToPremium = async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price: req.body.subscriptionType === "annual" ? "price_1OoOaaSFAU5oOmtKYAvZfFiJ" : "price_1OoOaaSFAU5oOmtKlz8N9AvI",
        quantity: 1,
      },
    ],
    mode: "subscription",
    // https://quizer-frontend.vercel.app/
    // http://localhost:5173
    success_url: `https://quizer-frontend.vercel.app/pass?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: "https://quizer-frontend.vercel.app/fail",
  });

  res.json({ sessionId: session.id });
};

const uploadLogo = async (req, res) => {
  console.log(req.file, "hereis ");
  const updatedUser = await User.findByIdAndUpdate(
    req.currentUser.id,
    { $set: { logo: req.file.path } },
    { new: true, runValidators: true } // return the updated object and run schema validators
  );

  updatedUser.password = undefined;
  // console.log(updatedUser, "hereasd");

  res.json({
    user: {
      email: updatedUser.email,
      role: updatedUser.role,
      name: updatedUser.name,
      logo: updatedUser.logo,
      type: updatedUser.subscriptionType,
    },
  });
};

const deleteLogo = async (req, res) => {
  const user = await User.findById(req.currentUser.id);
  if (user.logo) {
    fs.unlink(user.logo, (err) => {
      if (err) console.error(`Error deleting file: ${user.logo}`, err);
    });
  }

  user.logo = "";
  await user.save();
  user.password = undefined;

  res.json({
    user: {
      email: user.email,
      role: user.role,
      name: user.name,
      logo: user.logo,
      type: user.subscriptionType,
    },
  });
};

module.exports = {
  // get request;
  successfullPayment,
  getGlobalSettings,

  // put request;
  updateGlobalSettings,
  updateToPremium,

  // posts
  uploadLogo,
  deleteLogo,
};
