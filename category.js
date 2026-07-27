
const Category = require('../models/category');
const { errorHandler } = require('../helpers/dbErrorHandler');

exports.categoryById = async (req, res, next, id) => {
  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(400).json({
        error: "Category doesn't exist",
      });
    }
    req.category = category;
    next();
  } catch (err) {
    return res.status(400).json({
      error: "Category doesn't exist",
    });
  }
};

exports.create = async (req, res) => {
  try {
    const category = new Category(req.body);
    const data = await category.save();
    res.json({ data });
  } catch (err) {
    return res.status(400).json({
      error: errorHandler(err),
    });
  }
};

exports.read = (req, res) => {
  return res.json(req.category);
};

exports.update = async (req, res) => {
  try {
    if (!req.body.name) {
      return res.status(400).json({
        error: 'Name is required',
      });
    }
    const category = req.category;
    category.name = req.body.name;
    const data = await category.save();
    res.json(data);
  } catch (err) {
    return res.status(400).json({
      error: errorHandler(err),
    });
  }
};

exports.remove = async (req, res) => {
  try {
    const category = req.category;
    await category.deleteOne();
    res.json({
      message: 'Category deleted',
    });
  } catch (err) {
    return res.status(400).json({
      error: errorHandler(err),
    });
  }
};

exports.list = async (req, res) => {
  try {
    const data = await Category.find();
    res.json(data);
  } catch (err) {
    return res.status(400).json({
      error: errorHandler(err),
    });
  }
};

