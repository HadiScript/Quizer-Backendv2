const mongoose = require("mongoose");

const homePageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true },
  subscriber: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  quizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Quiz" }],

  banner: { type: String },

  createdAt: { type: Date, default: Date.now() },

  settings: {
    showHeader: { type: Boolean },
    header: {
      justify: String,
      gap: Number,
      container: Boolean,
      bgColor: String,
      textColor: String,
      showSocialLinks: Boolean,
      socialLinksGap: Number,
      instagram: {
        show: Boolean,
        link: String,
      },
      facebook: {
        show: Boolean,
        link: String,
      },
      twitter: {
        show: Boolean,
        link: String,
      },
      linkedin: {
        show: Boolean,
        link: String,
      },
    },
    showBanner: { type: Boolean },
    banner: {
      height: Number,
      bannerBgColor: String,
      bannerTextColor: String,
      border: Boolean,
      borderRadius: Number,
      bannerContainer: Boolean,
      text: String,
      para: String,
    },

    quizSection: {
      title: String,
      description: String,
    },
  },
});

const HomePageModel = mongoose.model("HomePage", homePageSchema);

module.exports = HomePageModel;
