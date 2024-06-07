const { Survey, Response } = require("../../models/surveySchema");
const { BadRequestError } = require("../../errors/bad-request-error");
const { NotFoundError } = require("../../errors/not-found-error");

function capitalize(text) {
  return text
    ?.split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

const mongoose = require("mongoose");

const getResponseDataByDate = async (req, res) => {
  const { slug } = req.params;
  const createdBy = req.currentUser.id;

  try {
    // First, find the survey to ensure it exists and to get its ID
    const survey = await Survey.findOne({ slug, createdBy });
    if (!survey) {
      return res.status(404).send("Survey not found");
    }

    // Fetch the responses for this survey
    const data = await Response.aggregate([
      { $match: { surveyId: survey._id } },
      {
        $project: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$respondedAt" } },
        },
      },
      {
        $group: {
          _id: "$date",
          value: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 }, // sort by date in ascending order
      },
    ]);

    const formattedData = data.map((item) => ({ date: item._id, value: item.value }));
    res.json(formattedData);
  } catch (error) {
    res.status(500).send("Server error");
  }
};

const getSurveyFieldStats = async (req, res) => {
  const { slug } = req.params;

  const createdBy = req.currentUser.id;
  try {
    const survey = await Survey.findOne({ slug, createdBy });
    if (!survey) {
      return res.status(404).send("Survey not found");
    }

    const stats = {
      requiredFields: 0,
      totalFields: 0,
      radioFields: 0,
      checkboxFields: 0,
      dropdownFields: 0,
      rateFields: 0,
      dateFields: 0,
      rangeFields: 0,
    };

    survey.fields.forEach((field) => {
      stats.totalFields += 1;
      if (field.required) stats.requiredFields += 1;
      if (field.type === "radio") stats.radioFields += 1;
      if (field.type === "checkbox") stats.checkboxFields += 1;
      if (field.type === "dropdown") stats.dropdownFields += 1;
      if (field.type === "rate") stats.rateFields += 1;
      if (field.type === "date") stats.dateFields += 1;
      if (field.type === "range") stats.rangeFields += 1;
    });

    const formattedData = [
      { name: "Total Fields", count: stats.totalFields },
      { name: "Required Fields", count: stats.requiredFields },
      { name: "Radio Fields", count: stats.radioFields },
      { name: "Checkbox Fields", count: stats.checkboxFields },
      { name: "Dropdown Fields", count: stats.dropdownFields },
      { name: "Rate Fields", count: stats.rateFields },
      { name: "Date Fields", count: stats.dateFields },
      { name: "Range Fields", count: stats.rangeFields },
    ];

    res.json(formattedData);
  } catch (error) {
    res.status(500).send("Server error");
  }
};

const getAllFields = async (req, res) => {
  const { slug } = req.params;
  const createdBy = req.currentUser.id;

  try {
    const survey = await Survey.findOne({ slug, createdBy });
    if (!survey) {
      return res.status(404).send("Survey not found");
    }

    // Extract radio fields
    const radioFields = survey.fields
      .filter((field) => field.type === "radio")
      .map((field) => ({
        fieldId: field._id,
        fieldLabel: field.label,
      }));

    const dropdownFields = survey.fields
      .filter((field) => field.type === "dropdown")
      .map((field) => ({
        fieldId: field._id,
        fieldLabel: field.label,
      }));

    const checkboxFields = survey.fields
      .filter((field) => field.type === "checkbox")
      .map((field) => ({
        fieldId: field._id,
        fieldLabel: field.label,
      }));

    const rangeFields = survey.fields
      .filter((field) => field.type === "range")
      .map((field) => ({
        fieldId: field._id,
        fieldLabel: field.label,
      }));

    const dateFields = survey.fields
      .filter((field) => field.type === "date")
      .map((field) => ({
        fieldId: field._id,
        fieldLabel: field.label,
      }));

    const rateFields = survey.fields
      .filter((field) => field.type === "rate")
      .map((field) => ({
        fieldId: field._id,
        fieldLabel: field.label,
      }));

    res.json({
      rateFields,
      radioFields,
      checkboxFields,
      dateFields,
      rangeFields,
      dropdownFields,
    });
  } catch (error) {
    res.status(500).send("Server error");
  }
};

const getRadioFieldData = async (req, res) => {
  const { fieldIds } = req.body;
  const { slug } = req.params;
  const createdBy = req.currentUser.id;

  // Validate that no more than three field IDs are sent
  if (!fieldIds || fieldIds.length > 3) {
    throw new BadRequestError("You can select up to three radio fields only.");
  }

  const survey = await Survey.findOne({ slug, createdBy });
  if (!survey) {
    throw new NotFoundError("Survey not found");
  }

  const fieldsData = await Promise.all(
    fieldIds.map(async (fieldId) => {
      // Aggregate to get the count of each response option for the field
      const responseData = await Response.aggregate([
        { $match: { "responses.fieldId": new mongoose.Types.ObjectId(fieldId) } },
        { $unwind: "$responses" },
        { $match: { "responses.fieldId": new mongoose.Types.ObjectId(fieldId) } },
        { $group: { _id: "$responses.value", count: { $sum: 1 } } },
      ]);

      const field = survey.fields.id(fieldId);
      return {
        fieldLabel: field.label,
        count: responseData.map((item) => ({ name: item._id, value: item.count })),
      };
    })
  );

  res.json(fieldsData);
};

const getCheckboxFieldData = async (req, res) => {
  const { fieldIds } = req.body;
  const { slug } = req.params;
  const createdBy = req.currentUser.id;

  // Validate that no more than three field IDs are sent
  if (!fieldIds || fieldIds.length > 3) {
    throw new BadRequestError("You can select up to three checkbox fields only.");
  }

  const survey = await Survey.findOne({ slug, createdBy });
  if (!survey) {
    throw new NotFoundError("Survey not found");
  }

  const fieldsData = await Promise.all(
    fieldIds.map(async (fieldId) => {
      // Aggregate to get the count of each response option for the field
      const responseData = await Response.aggregate([
        { $match: { "responses.fieldId": new mongoose.Types.ObjectId(fieldId) } },
        { $unwind: "$responses" },
        { $match: { "responses.fieldId": new mongoose.Types.ObjectId(fieldId) } },
        { $unwind: "$responses.value" }, // Unwind the array of selected checkbox values
        { $group: { _id: "$responses.value", count: { $sum: 1 } } },
      ]);

      const field = survey.fields.id(fieldId);
      return {
        fieldLabel: field.label,
        count: responseData.map((item) => ({ name: capitalize(item._id), value: item.count })),
      };
    })
  );

  res.json(fieldsData);
};

const getRateFieldData = async (req, res) => {
  const { fieldIds } = req.body;
  const { slug } = req.params;
  const createdBy = req.currentUser.id;

  // Validate that no more than three field IDs are sent
  if (!fieldIds || fieldIds.length > 3) {
    throw new BadRequestError("You can select up to three rate fields only.");
  }

  const survey = await Survey.findOne({ slug, createdBy });
  if (!survey) {
    throw new NotFoundError("Survey not found");
  }

  const fieldsData = await Promise.all(
    fieldIds.map(async (fieldId) => {
      // Aggregate to get the average, count of each response, and detailed counts
      const responseData = await Response.aggregate([
        { $match: { "responses.fieldId": new mongoose.Types.ObjectId(fieldId) } },
        { $unwind: "$responses" },
        { $match: { "responses.fieldId": new mongoose.Types.ObjectId(fieldId) } },
        {
          $group: {
            _id: "$responses.value",
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } }, // Sort by rate value if needed
      ]);

      const field = survey.fields.id(fieldId);
      const totalResponses = responseData.reduce((acc, cur) => acc + cur.count, 0);
      const averageRating = responseData.reduce((acc, cur) => acc + cur._id * cur.count, 0) / totalResponses;

      return {
        fieldLabel: field.label,
        averageRating: averageRating.toFixed(2),
        totalCount: totalResponses,
        count: responseData.map((item) => ({ name: item._id, value: item.count })),
      };
    })
  );

  res.json(fieldsData);
};

const getDropdownFieldData = async (req, res) => {
  const { fieldIds } = req.body;
  const { slug } = req.params;
  const createdBy = req.currentUser.id;

  // Validate that no more than three field IDs are sent
  if (!fieldIds || fieldIds.length > 3) {
    throw new BadRequestError("You can select up to three dropdown fields only.");
  }

  const survey = await Survey.findOne({ slug, createdBy });
  if (!survey) {
    throw new NotFoundError("Survey not found");
  }

  const fieldsData = await Promise.all(
    fieldIds.map(async (fieldId) => {
      // Aggregate to get the count of each response option for the field
      const responseData = await Response.aggregate([
        { $match: { "responses.fieldId": new mongoose.Types.ObjectId(fieldId) } },
        { $unwind: "$responses" },
        { $match: { "responses.fieldId": new mongoose.Types.ObjectId(fieldId) } },
        {
          $group: {
            _id: "$responses.value",
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } }, // Sort by option value if needed
      ]);

      const field = survey.fields.id(fieldId);
      return {
        fieldLabel: field.label,
        count: responseData.map((item) => ({ name: capitalize(item._id), value: item.count })),
      };
    })
  );

  res.json(fieldsData);
};

const getSurveyResponses = async (req, res) => {
  const { slug } = req.params;
  const { page = 1, pageSize = 10, search = "" } = req.query;
  const createdBy = req.currentUser.id; // Assuming this is set from the authenticated user session

  const survey = await Survey.findOne({ slug, createdBy });
  if (!survey) {
    throw new NotFoundError("Survey not found");
  }

  // Find email and name field IDs for filtering and searching
  const emailField = survey.fields.find((field) => field.label.toLowerCase() === "email" && field.required);
  const nameField = survey.fields.find((field) => field.label.toLowerCase() === "name" && field.required);

  // Constructing the match condition based on search input
  let matchCondition = { surveyId: survey._id };
  if (search && (emailField || nameField)) {
    matchCondition["$or"] = [
      { responses: { $elemMatch: { fieldId: emailField?._id, value: new RegExp(search, "i") } } },
      { responses: { $elemMatch: { fieldId: nameField?._id, value: new RegExp(search, "i") } } },
    ];
  }

  const total = await Response.countDocuments(matchCondition);
  const responses = await Response.find(matchCondition)
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();

  // Format responses to only include email, name, and respondedAt
  const formattedResponses = responses.map((response) => {
    return {
      email: response.responses.find((r) => r.fieldId.equals(emailField?._id))?.value,
      name: response.responses.find((r) => r.fieldId.equals(nameField?._id))?.value,
      respondedAt: response.respondedAt,
      _id: response._id,
    };
  });

  res.json({
    data: formattedResponses,
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
  });
};

const getSingleResponse = async (req, res) => {
  const { responseId } = req.params;
  const createdBy = req.currentUser.id;

  // Find the response by ID and ensure it belongs to a survey created by the current user
  const response = await Response.findOne({ _id: responseId }).populate({
    path: "surveyId",
    match: { createdBy: createdBy },
  });

  // If the response does not exist or does not belong to a survey by the current user
  if (!response || !response.surveyId) {
    throw new NotFoundError("Not Found");
  }

  // Optionally, include more details from the survey fields in the response data
  const survey = await Survey.findById(response.surveyId._id);
  const detailedResponses = response.responses.map((r) => {
    const field = survey.fields?.id(r.fieldId);
    return {
      fieldLabel: field ? field.label : "Field not found",
      responseValue: r.value,
      respondedAt: response.respondedAt,
    };
  });

  res.json(detailedResponses);
};

const getFieldOverview = async (req, res) => {
  const { slug } = req.params;
  const createdBy = req.currentUser.id; // Assuming this is set from the authenticated user session

  const survey = await Survey.findOne({ slug, createdBy });
  if (!survey) {
    throw new NotFoundError("Not Found");
  }

  const fieldOverviews = await Promise.all(
    survey.fields.map(async (field) => {
      const fieldData = {
        fieldId: field._id,
        fieldLabel: field.label,
      };

      switch (field.type) {
        case "rate":
          const rateData = await Response.aggregate([
            { $unwind: "$responses" },
            { $match: { "responses.fieldId": field._id } },
            { $group: { _id: null, averageRate: { $avg: "$responses.value" } } },
          ]);
          fieldData.averageRate = rateData[0] ? rateData[0].averageRate.toFixed(2) : "No data";
          break;

        case "checkbox":
        case "radio":
        case "dropdown":
          const responseData = await Response.aggregate([
            { $unwind: "$responses" },
            { $match: { "responses.fieldId": field._id } },
            { $group: { _id: "$responses.value", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 },
          ]);
          fieldData.mostSelected = responseData[0]
            ? { option: responseData[0]._id, count: responseData[0].count }
            : { option: "No data", count: 0 };
          break;

        default:
          break;
      }
      return fieldData;
    })
  );

  res.json(fieldOverviews);
};

module.exports = {
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
};
