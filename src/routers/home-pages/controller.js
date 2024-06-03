const slugify = require("slugify");
const HomePageModel = require("../../models/homePageSchema");
const { BadRequestError } = require("../../errors/bad-request-error");
const QuizModel = require("../../models/quizSchema");
const { NotAuthorizedError } = require("../../errors/not-authorized-error");

const createHomePage = async (req, res) => {
  const { title } = req.body;

  const userHomePage = await HomePageModel.find({ subscriber: req.currentUser.id });

  if (userHomePage.find((x) => x.slug.toLowerCase() === slugify(title).toLowerCase())) {
    throw new BadRequestError("Home Page is already exist with that name.");
  }

  const newHomePage = new HomePageModel({
    subscriber: req.currentUser.id,
    title,
    slug: slugify(title),
  });

  await newHomePage.save();

  res.json({ message: "Home Page has been created", homePage: newHomePage });
};

const editHomePage = async (req, res) => {
  const userHomePage = await HomePageModel.findOne({ slug: req.params.slug });

  if (!userHomePage) {
    throw new BadRequestError("Home page isnt exist.");
  }

  // if (userHomePage.subscriber !== req.currentUser.id) {
  //   throw new NotAuthorizedError("Home page isnt exist.");
  // }

  const update = await HomePageModel.findOneAndUpdate(
    { slug: req.params.slug },
    { $set: { settings: req.body, quizzes: req.body.quizzes } },
    { new: true, runValidators: true }
  );

  res.json({ message: "Home Page has been updated", updatedHomePage: update });
};

const getAllMyHomePages = async (req, res) => {
  const userHomePage = await HomePageModel.find({ subscriber: req.currentUser.id });
  // throw new BadRequestError("Home Page is already exist with that name.");

  res.json({ homePages: userHomePage });
};

const getAllMySingleHomePage = async (req, res) => {
  const userHomePage = await HomePageModel.findOne({ slug: req.params.slug }).populate({
    path: "quizzes",
    select: "title questions",
  });

  if (!userHomePage) {
    throw new BadRequestError("Home page isnt exist.");
  }
  res.json({ settings: userHomePage.settings, quizzes: userHomePage.quizzes });
};

// req.currentUser.id
const getAllQuizzesForHomePage = async (req, res) => {
  const userQuizzes = await QuizModel.find({ creator: req.currentUser.id }).select("title questions");

  res.json({ quizzes: userQuizzes });
};

const deleteHomePage = async (req, res) => {
  const userHomePage = await HomePageModel.findOne({ slug: req.params.slug });

  if (!userHomePage) {
    throw new BadRequestError("Home page isnt exist.");
  }

  // if (userHomePage?.subscriber !== req.currentUser.id) {
  //   throw new NotAuthorizedError("Home page isnt exist.");
  // }

  await HomePageModel.findByIdAndDelete({ _id: userHomePage._id });

  res.json({ message: "Home Page has been deleted" });
};

module.exports = {
  createHomePage,
  getAllMyHomePages,
  editHomePage,
  getAllMySingleHomePage,
  getAllQuizzesForHomePage,
  deleteHomePage,
};
