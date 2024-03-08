require("express-async-errors");
require("dotenv").config();

const cors = require("cors");
const path = require("path");
const express = require("express");
const { json } = require("body-parser");
const cookieSession = require("cookie-session");
const cookieParser = require("cookie-parser");
const corsOptions = require("./config/cors/options");
const { errorHandler } = require("./middlewares/error-handler");
const { NotFoundError } = require("./errors/not-found-error");

const session = require("express-session");
const passport = require("passport");
const oAuth2 = require("passport-google-oauth2").Strategy;

const clientId = "779716474567-ga0p4osg530hq2rg4vbqi8q4pi0ute41.apps.googleusercontent.com";
const clientSecret = "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";

const app = express();
app.use(json());
app.use(cors(corsOptions));
app.use("/uploads/logos", express.static("uploads/logos"));

// APIS
app.use("/api/auth", require("./routers/auth"));
app.use("/api/user", require("./routers/user"));
app.use("/api/quiz", require("./routers/quiz"));
app.use("/api/question", require("./routers/question"));
app.use("/api/attempt", require("./routers/attempt"));
app.use("/api/report", require("./routers/report"));
app.use("/api/ai", require("./routers/ai"));
app.use("/api/template", require("./routers/template"));

if (process.env.NODE_ENV === "production") {
  console.log(process.env.NODE_ENV);
  app.use(express.static(path.join(__dirname, "mine/dist")));
  app.get("*", (req, res) => res.sendFile(path.resolve(__dirname, "mine", "dist", "index.html")));
} else {
  console.log(process.env.NODE_ENV);
  app.get("/", (req, res) => {
    res.send("API is running....");
  });
}

app.all("*", async (req, res) => {
  throw new NotFoundError();
});

app.use(errorHandler);

module.exports = { app };
