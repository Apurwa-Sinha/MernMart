
const User = require('../models/user');
const jwt = require('jsonwebtoken'); // to generate signed token
const { expressjwt } = require('express-jwt'); // for auth check (express-jwt v6+)
const { errorHandler } = require('../helpers/dbErrorHandler');
require('dotenv').config();

exports.signup = async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    user.salt = undefined;
    user.hashed_password = undefined;
    res.json({
      user,
    });
  } catch (err) {
    return res.status(400).json({
      err: errorHandler(err),
    });
  }
};

exports.signin = async (req, res) => {
  // find the user based on email
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        error: "User with that email doesn't exist. Please signup.",
      });
    }
    // if user found make sure the email and password match
    // create authenticate method in user model
    if (!user.authenticate(password)) {
      return res.status(401).json({
        error: "Email and password didn't match",
      });
    }
    // generate a signed token with user id and secret
    const token = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    // persist the token as 't' in cookie with expiry date
    res.cookie('t', token, { expires: new Date(Date.now() + 24 * 60 * 60 * 1000) });
    // return response with user and token to frontend client
    const { _id, name, role } = user;
    return res.json({ token, user: { _id, email, name, role } });
  } catch (err) {
    return res.status(400).json({
      error: errorHandler(err),
    });
  }
};

exports.signout = (req, res) => {
  res.clearCookie('t');
  res.json({ message: 'Signout success' });
};

exports.requireSignin = expressjwt({
  secret: process.env.JWT_SECRET,
  algorithms: ['HS256'],
  userProperty: 'auth',
});

exports.isAuth = (req, res, next) => {
  let user = req.profile && req.auth && req.profile._id == req.auth._id;
  if (!user) {
    return res.status(403).json({
      error: 'Access denied',
    });
  }
  next();
};

exports.isAdmin = (req, res, next) => {
  if (req.profile.role === 0) {
    return res.status(403).json({
      error: 'Admin resource! Access denied',
    });
  }
  next();
};
      

