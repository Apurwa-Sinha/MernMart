const { Order, CartItem } = require('../models/order');
const { errorHandler } = require('../helpers/dbErrorHandler');

exports.orderById = async (req, res, next, id) => {
  try {
    const order = await Order.findById(id).populate(
      'products.product',
      'name price'
    );
    if (!order) {
      return res.status(400).json({
        error: "Order doesn't exist",
      });
    }
    req.order = order;
    next();
  } catch (err) {
    return res.status(400).json({
      error: errorHandler(err),
    });
  }
};

exports.create = async (req, res) => {
  try {
    req.body.order.user = req.profile._id;
    const order = new Order(req.body.order);
    const data = await order.save();
    res.json(data);
  } catch (error) {
    return res.status(400).json({
      error: errorHandler(error),
    });
  }
};

exports.listOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', '_id name address')
      .sort('-created');
    res.json(orders);
  } catch (err) {
    return res.status(400).json({
      error: errorHandler(err),
    });
  }
};

exports.getStatusValues = (req, res) => {
  res.json(Order.schema.path('status').enumValues);
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.body.orderId,
      { $set: { status: req.body.status } },
      { new: true }
    );
    if (!order) {
      return res.status(400).json({
        error: "Order doesn't exist",
      });
    }
    res.json(order);
  } catch (err) {
    return res.status(400).json({
      error: errorHandler(err),
    });
  }
};
  
