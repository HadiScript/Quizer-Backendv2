require("express-async-errors");
require("dotenv").config();

const cors = require("cors");
const path = require("path");
const express = require("express");
const { json } = require("body-parser");
const cookieSession = require("cookie-session");
const corsOptions = require("./config/cors/options");
const { errorHandler } = require("./middlewares/error-handler");
const { NotFoundError } = require("./errors/not-found-error");

const app = express();
app.set("trust proxy", true);
app.use(json());
// app.use(cors(corsOptions));

app.use(
  cors({
    origin: ["https://quizer-frontend.vercel.app", "http://localhost:5173"],
    credentials: true,
  })
);
app.use(
  cookieSession({
    signed: false,
    secure: process.env.NODE_ENV === "production" || false,
  })
);

// APIS
app.use("/api/auth", require("./routers/auth"));
app.use("/api/user", require("./routers/user"));
app.use("/api/quiz", require("./routers/quiz"));
app.use("/api/question", require("./routers/question"));
app.use("/api/attempt", require("./routers/attempt"));
app.use("/api/report", require("./routers/report"));

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
