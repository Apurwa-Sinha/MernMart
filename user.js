
const User = require('../models/user');
const { Order } = require('../models/order');
const Product = require('../models/product');
const { errorHandler } = require('../helpers/dbErrorHandler');
const { updateRunningAverage } = require('../helpers/imageEmbedding');

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

    // fold each purchased product's embedding into this user's Style DNA,
    // skipping any product that doesn't have an embedding yet
    try {
      const productIds = req.body.order.products.map((item) => item._id);
      const purchasedProducts = await Product.find({
        _id: { $in: productIds },
        embedding: { $exists: true },
      });

      if (purchasedProducts.length > 0) {
        const user = await User.findById(req.profile._id);
        let vector = user.styleProfile;
        let count = user.styleProfileCount || 0;

        for (const product of purchasedProducts) {
          const updated = updateRunningAverage(vector, count, product.embedding);
          vector = updated.vector;
          count = updated.count;
        }

        user.styleProfile = vector;
        user.styleProfileCount = count;
        await user.save();
      }
    } catch (styleErr) {
      // non-fatal — the order/history update already succeeded
      console.log('STYLE PROFILE UPDATE FAILED (non-fatal):', styleErr.message);
    }

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

/**
 * Called by the frontend when a logged-in user views a product's detail
 * page. Folds that product's embedding into the user's Style DNA profile
 * so browsing (not just purchasing) shapes their "picked for your style"
 * recommendations. Fails silently/non-fatally — this is a nice-to-have,
 * not something that should ever break the page the user is looking at.
 */
exports.trackProductView = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);

    if (!product || !product.embedding) {
      // nothing to learn from a product with no embedding yet
      return res.json({ tracked: false });
    }

    const user = req.profile;
    const updated = updateRunningAverage(
      user.styleProfile,
      user.styleProfileCount || 0,
      product.embedding
    );

    user.styleProfile = updated.vector;
    user.styleProfileCount = updated.count;
    await user.save();

    res.json({ tracked: true });
  } catch (err) {
    // this endpoint should never surface an error to the user —
    // it's a background signal, not a core action
    res.json({ tracked: false });
  }
};
