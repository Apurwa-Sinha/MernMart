
const User = require('../models/user');
const { Order } = require('../models/order');
const { errorHandler } = require('../helpers/dbErrorHandler');

exports.userById = async (req, res, next, id) => {
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(400).json({
        error: 'User not found',
      });
    }
    req.profile = user;
    next();
  } catch (err) {
    return res.status(400).json({
      error: 'User not found',
    });
  }
};

exports.read = (req, res) => {
  req.profile.hashed_password = undefined;
  req.profile.salt = undefined;
  return res.json(req.profile);
};

exports.update = async (req, res) => {
  try {
    // Only allow specific fields to be updated. Spreading req.body directly
    // into $set would let a client set arbitrary fields (e.g. role, salt,
    // hashed_password), which is a privilege-escalation risk.
    const { name, password } = req.body;

    const user = req.profile;

    if (name) {
      user.name = name;
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          error: 'Password should be min 6 characters long',
        });
      }
      // assumes User model has a virtual `password` setter that hashes
      // into hashed_password/salt on save
      user.password = password;
    }

    const updatedUser = await user.save();
    updatedUser.hashed_password = undefined;
    updatedUser.salt = undefined;
    res.json(updatedUser);
  } catch (err) {
    console.log('USER UPDATE ERROR', err);
    return res.status(400).json({
      error: errorHandler(err),
    });
  }
};

exports.addOrderToUserHistory = async (req, res, next) => {
  try {
    let history = [];
    req.body.order.products.forEach((item) => {
      history.push({
        _id: item._id,
        name: item.name,
        description: item.description,
        category: item.category,
        quantity: item.count,
        transaction_id: req.body.order.transaction_id,
        amount: req.body.order.amount,
      });
    });

    await User.findOneAndUpdate(
      { _id: req.profile._id },
      { $push: { history: { $each: history } } },
      { new: true }
    );

    next();
  } catch (error) {
    return res.status(400).json({
      error: 'Could not update user purchase history',
    });
  }
};

exports.purchaseHistory = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.profile._id })
      .populate('user', '_id name')
      .sort('-created');
    res.json(orders);
  } catch (err) {
    return res.status(400).json({
      error: errorHandler(err),
    });
  }
};




