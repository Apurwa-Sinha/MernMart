
const braintree = require('braintree');
const Product = require('../models/product');
require('dotenv').config();

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox, // Production
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

exports.generateToken = (req, res) => {
  gateway.clientToken.generate({}, (err, response) => {
    if (err) {
      console.error('Braintree clientToken error:', err);
      return res.status(500).json({ error: 'Unable to generate client token' });
    }
    res.send(response);
  });
};

exports.processPayment = async (req, res) => {
  const nonceFromTheClient = req.body.paymentMethodNonce;
  // client sends which products + how many, e.g. [{ _id, count }, ...]
  // (matches the shape the frontend cart already stores) — but the
  // PRICE is always looked up fresh from the database below, never
  // trusted from the client, so a tampered client-side price can't
  // change what's actually charged.
  const cartProducts = req.body.products;

  try {
    if (!cartProducts || cartProducts.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const productIds = cartProducts.map((item) => item._id);
    const dbProducts = await Product.find({ _id: { $in: productIds } });

    if (dbProducts.length !== cartProducts.length) {
      return res.status(400).json({
        error: 'One or more items in your cart are no longer available',
      });
    }

    let amount = 0;
    for (const cartItem of cartProducts) {
      const dbProduct = dbProducts.find(
        (p) => String(p._id) === String(cartItem._id)
      );
      if (cartItem.count > dbProduct.quantity) {
        return res.status(400).json({
          error: `Only ${dbProduct.quantity} left of ${dbProduct.name}`,
        });
      }
      amount += dbProduct.price * cartItem.count;
    }

    gateway.transaction.sale(
      {
        amount: amount.toFixed(2),
        paymentMethodNonce: nonceFromTheClient,
        options: {
          submitForSettlement: true,
        },
      },
      (error, result) => {
        if (error || !result.success) {
          console.error('Braintree transaction error:', error || result.message);
          return res.status(500).json({ error: 'Payment could not be processed' });
        }
        // send back the verified amount too, so the client can use the
        // server-computed total (not its own) when creating the Order record
        res.json({ ...result, verifiedAmount: amount.toFixed(2) });
      }
    );
  } catch (err) {
    console.error('Payment processing error:', err);
    res.status(500).json({ error: 'Payment could not be processed' });
  }
};
