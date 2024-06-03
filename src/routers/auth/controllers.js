const jwt = require("jsonwebtoken");

const User = require("../../models/userSchema");
const { Password } = require("../../config/Password");
const { BadRequestError } = require("../../errors/bad-request-error");
const { default: axios } = require("axios");

const login = async (req, res) => {
  const { email, password } = req.body;
  const existingUser = await User.findOne({ email });
  if (!existingUser) {
    throw new BadRequestError("This email is not registered yet. Please SignUp.");
  }
  const passwordsMatch = await Password.compare(existingUser.password, password);
  if (!passwordsMatch) {
    throw new BadRequestError("Invalid Credentials");
  }
  // Generate JWT
  const userJwt = jwt.sign(
    {
      id: existingUser._id,
      email: existingUser.email,
    },
    process.env.JWT_KEY
  );

  let user = {
    userId: existingUser._id,
    name: existingUser.name,
    email: existingUser.email,
    role: existingUser.role,
    type: existingUser.subscriptionType,
    logo: existingUser.logo,  
  };
  res.status(200).send({ user, token: userJwt });
};

const loginWithGoogle = async (req, res) => {
  const { googleAccessToken } = req.body;
  const { data } = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${googleAccessToken}`,
    },
  });

  const email = data.email;
  const existingUser = await User.findOne({ email });
  if (!existingUser) {
    throw new BadRequestError("This email is not registered yet. Please SignUp.");
  }

  const userJwt = jwt.sign(
    {
      id: existingUser._id,
      email: existingUser.email,
    },
    process.env.JWT_KEY
  );

  let user = {
    name: existingUser.name,
    email: existingUser.email,
    role: existingUser.role,
    type: existingUser.subscriptionType,
    logo: existingUser.logo,
  };
  res.status(200).send({ user, token: userJwt });
};

const signupWithGoogle = async (req, res) => {
  const { googleAccessToken } = req.body;

  const { data } = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${googleAccessToken}`,
    },
  });
  const email = data.email;
  const name = data.name;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new BadRequestError("Email in use");
  }

  const user = new User({ email, name });
  await user.save();

  const userJwt = jwt.sign(
    {
      id: user._id,
      email: user.email,
    },
    process.env.JWT_KEY
  );

  let userData = {
    name: user.name,
    email: user.email,
    role: user.role,
    type: user.subscriptionType,
  };
  res.status(200).send({ user: userData, token: userJwt });
};

const signup = async (req, res) => {
  const { email, password, name } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new BadRequestError("Email in use");
  }

  const user = new User({ email, password, name });
  await user.save();

  const userJwt = jwt.sign(
    {
      id: user._id,
      email: user.email,
    },
    process.env.JWT_KEY
  );

  let userData = {
    name: user.name,
    email: user.email,
    role: user.role,
    type: user.subscriptionType,
  };
  res.status(200).send({ user: userData, token: userJwt });
};

const logout = (req, res) => {
  // req.clearCookie = null;
  res.clearCookie("session");

  res.send({});
};

const currentSubs = async (req, res) => {
  if (!req.currentUser) {
    return res.send({ user: null });
  } else {
    const userExist = await User.findById(req.currentUser.id);

    return res.send({
      user: {
        name: userExist.name,
        email: userExist.email,
        role: userExist.role,
      },
    });
  }
};

const currentAdmins = async (req, res) => {
  return res.send({ currentUser: req.currentUser || null });
};

const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.currentUser.id);
  if (!user) {
    throw new BadRequestError("User not found.");
  }

  const passwordsMatch = await Password.compare(user.password, currentPassword);
  if (!passwordsMatch) {
    throw new BadRequestError("Your current password is incorrect.");
  }

  user.password = newPassword;
  await user.save();

  res.json({ message: "Password updated successfully." });
};

module.exports = {
  login,
  signup,
  logout,
  currentSubs,
  currentAdmins,
  loginWithGoogle,
  signupWithGoogle,
  updatePassword,
};
