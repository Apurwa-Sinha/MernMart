const { check, validationResult } = require('express-validator');

exports.userSignupValidator = [
  check('name', 'Name is required').notEmpty(),
  check('email', 'Email must be between 4 to 32 characters')
    .matches(/.+\@.+\..+/)
    .withMessage('Email must contain @')
    .isLength({
      min: 4,
      max: 32,
    }),
  check('password', 'Password is required').notEmpty(),
  check('password')
    .isLength({ min: 6, max: 72 })
    .withMessage('Password must be between 6 and 72 characters')
    .matches(/\d/)
    .withMessage('Password must contain a number'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const firstError = errors.array().map((error) => error.msg)[0];
      return res.status(400).json({ error: firstError });
    }
    next();
  },
];
