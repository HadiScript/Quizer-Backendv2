const { default: slugify } = require("slugify");
const { Survey, Response } = require("../../models/surveySchema");
const { BadRequestError } = require("../../errors/bad-request-error");
const { NotFoundError } = require("../../errors/not-found-error");
const User = require("../../models/userSchema");
// POST
const createSurvey = async (req, res) => {
  const { title, description } = req.body;

  const isExist = await Survey.findOne({ slug: slugify(title), createdBy: req.currentUser.id });
  const checker = await User.findById({ _id: req.currentUser.id }).select("subscriptionType");
  const surveyCount = await Survey.countDocuments({ createdBy: req.currentUser.id });

  if (checker.subscriptionType === "free") {
    if (surveyCount === 10) {
      throw new BadRequestError("Limit has exceeded");
    }
  }
  if (checker.subscriptionType === "premium") {
    if (surveyCount === 50) {
      throw new BadRequestError("Limit has exceeded");
    }
  }

  if (isExist) {
    throw new BadRequestError("Already Exist, Please change the title");
  }

  const newSurvey = new Survey({
    title,
    slug: slugify(title),
    description,
    createdBy: req.currentUser.id,
  });

  const srvy = await newSurvey.save();

  res.status(201).json({ message: "Survey has been created", slug: srvy.slug });
};

// PUT
const updateSurveyBasicInfo = async (req, res) => {
  try {
    const { title, description } = req.body;
    const { slug } = req.params;

    const updatedSurvey = await Survey.findOneAndUpdate(
      { slug },
      { title, description },
      { new: true, runValidators: true, select: "title description" }
    );

    if (!updatedSurvey) {
      throw new NotFoundError("Survey not found.");
    }

    res.status(200).json({ message: "Survey updated successfully", basicInfo: updatedSurvey });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSurveyFields = async (req, res) => {
  try {
    const slug = req.params.slug;
    const userId = req.currentUser.id;

    const survey = await Survey.findOne({ slug: slug, createdBy: userId });
    const checker = await User.findById({ _id: userId }).select("subscriptionType");

    if (!survey) {
      throw new NotFoundError("Not Found!");
    }

    if (checker.subscriptionType === "free") {
      if (survey.fields.length === 20) {
        throw new BadRequestError("Limit has exceeded");
      }
    }

    if (checker.subscriptionType === "premium") {
      if (survey.fields.length === 30) {
        throw new BadRequestError("Limit has exceeded");
      }
    }

    console.log(req.body, "here is the things");

    // Updating the fields
    survey.fields = req.body.fields;
    await survey.save();

    res.status(200).json({
      message: "Fields updated successfully",
      fields: survey.fields,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Failed to update fields",
      error: error.message,
    });
  }
};

// GET
const getUserSurveys = async (req, res) => {
  try {
    const userId = req.currentUser.id;
    const { page = 1, limit = 10, search = "" } = req.query;
    const pageSize = Number(limit);

    console.log(req.query, "heresdasd");

    const query = {
      createdBy: userId,
      title: { $regex: new RegExp(search, "i") },
    };

    const surveys = await Survey.find(query)
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    const total = await Survey.countDocuments(query);

    res.status(200).json({
      surveys,
      pagination: {
        total,
        pageSize,
        page: Number(page),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving surveys", error: error.message });
  }
};

const getSurveyBasicInfo = async (req, res) => {
  try {
    const slug = req.params.slug;
    const userId = req.currentUser.id;

    const survey = await Survey.findOne({ slug: slug, createdBy: userId }, "title description");

    if (!survey) {
      throw new NotFoundError("Not Found!");
    }

    res.status(200).json(survey);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving survey basic info", error: error.message });
  }
};

const getSurveyFields = async (req, res) => {
  try {
    const slug = req.params.slug;
    const userId = req.currentUser.id;

    const survey = await Survey.findOne({ slug: slug, createdBy: userId }, "fields");

    if (!survey) {
      throw new NotFoundError("Not Found!");
    }

    res.status(200).json(survey.fields);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving survey fields", error: error.message });
  }
};

// FOR ATTEMPTING THE SURVEY
// GET
const gettingFieldsForAttempt = async (req, res) => {
  const slug = req.params.slug;
  const userId = req.params.userId;

  const survey = await Survey.findOne({ slug: slug, createdBy: userId }).select("title description fields");

  if (!survey) {
    throw new NotFoundError("Not Found!");
  }

  // console.log(survey, "here");

  res.status(200).json(survey);
};

// POST
const submitSurveyResponse = async (req, res) => {
  const slug = req.params.slug;
  const userId = req.params.userId;
  const { responses } = req.body;

  // Check if the survey exists
  const survey = await Survey.findOne({ slug: slug, createdBy: userId });
  const checker = await User.findOne({ _id: survey.createdBy });
  const responseCount = await Response.countDocuments({ surveyId: survey._id });
  if (!survey) {
    throw new NotFoundError("Not found");
  }

  if (checker.subscriptionType === "free") {
    if (responseCount === 500) {
      throw new BadRequestError("Limit has exceeded");
    }
  }
  if (checker.subscriptionType === "premium") {
    if (responseCount === 2000) {
      throw new BadRequestError("Limit has exceeded");
    }
  }

  // Create a new response
  const newResponse = new Response({
    surveyId: survey._id,
    responses: responses,
    respondedAt: Date.now(),
  });

  // Save the response
  await newResponse.save();

  res.status(201).json({
    message: "Response submitted successfully",
    responseId: newResponse._id,
  });
};

module.exports = {
  // POST
  createSurvey,

  // PUT
  updateSurveyBasicInfo,
  updateSurveyFields,

  // GET
  getUserSurveys,

  getSurveyBasicInfo,
  getSurveyFields,

  // For ATTEMPTING THE SURVEY
  // GET
  gettingFieldsForAttempt,

  // POST
  submitSurveyResponse,
};
