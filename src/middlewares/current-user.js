const jwt = require("jsonwebtoken");
const { NotAuthorizedError } = require("../errors/not-authorized-error");
const User = require("../models/userSchema");

const currentUser = (req, res, next) => {
  // console.log(req.headers.cookie.split("=")[1], "session");
  let token = req.headers?.cookie?.split("=")[1];
  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_KEY);
    console.log("going");
    req.currentUser = payload;
  } catch (err) {}

  next();
};

const currentsubs = async (req, res, next) => {
  if (!req.currentUser) {
    throw new NotAuthorizedError();
  }

  const user = await User.findById(req.currentUser.id);

  if (user.role === "subscriber") {
    next();
  } else {
    throw new NotAuthorizedError();
  }
};

const currentadmin = async (req, res, next) => {
  if (!req.currentUser) {
    throw new NotAuthorizedError();
  }

  // console.log(req.currentUser);
  const user = await User.findById(req.currentUser.id);

  if (user.role === "admin") {
    next();
  } else {
    throw new NotAuthorizedError();
  }
};

module.exports = { currentUser, currentsubs, currentadmin };
