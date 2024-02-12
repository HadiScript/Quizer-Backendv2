const jwt = require("jsonwebtoken");

const User = require("../../models/userSchema");
const { Password } = require("../../config/Password");
const { BadRequestError } = require("../../errors/bad-request-error");

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

  // Store it on session object
  req.session = {
    jwt: userJwt,
  };

  let user = {
    name: existingUser.name,
    email: existingUser.email,
    role: existingUser.role,
  };

  res.status(200).send(user);
};

const signup = async (req, res) => {
  const { email, password, name } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new BadRequestError("Email in use");
  }

  const user = new User({ email, password, name });
  await user.save();

  // gen jwt token
  const userJwt = jwt.sign(
    {
      id: user._id,
      email: user.email,
    },
    process.env.JWT_KEY
  );

  // store it on the session object
  // req.session.jwt = userJwt; not in Typescript
  req.session = {
    jwt: userJwt,
  };

  let userData = {
    name: user.name,
    email: user.email,
    role: user.role,
  };

  res.status(201).send({ user: userData });
};

const logout = (req, res) => {
  req.session = null;

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

module.exports = {
  login,
  signup,
  logout,
  currentSubs,
  currentAdmins,
};
