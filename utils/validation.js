const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');

const isId = (value) => mongoose.isValidObjectId(value);

const usernameRule = (field = 'username') => body(field)
  .trim().toLowerCase()
  .matches(/^[a-z0-9_.]{3,30}$/)
  .withMessage('Username must be 3-30 characters and use only letters, numbers, "_" or "."');

const emailRule = (field = 'email') => body(field)
  .trim().toLowerCase()
  .isEmail().withMessage('Valid email is required');

// At least 8 characters, one capital letter and one special character
const passwordRule = (field = 'password') => body(field)
  .isString().isLength({ min: 8, max: 128 }).withMessage('Password must be at least 8 characters')
  .matches(/[A-Z]/).withMessage('Password needs at least one capital letter')
  .matches(/[^A-Za-z0-9]/).withMessage('Password needs at least one special character');

// Runs after the rules; responds 400 with the first problem as `message`
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
};

// Turns a Mongo duplicate-key error into a friendly 409; returns true if handled
const handleDuplicate = (error, res) => {
  if (error?.code !== 11000) return false;
  const field = Object.keys(error.keyPattern || {}).find((k) => k !== 'restaurantId') || 'value';
  res.status(409).json({ message: `That ${field} is already taken` });
  return true;
};

module.exports = { isId, usernameRule, emailRule, passwordRule, validate, handleDuplicate };
