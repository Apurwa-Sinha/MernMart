
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const CartItemSchema = new mongoose.Schema(
  {
    product: { type: ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    count: Number,
  },
  { timestamps: true }
);

const CartItem = mongoose.model('CartItem', CartItemSchema);

const OrderSchema = new mongoose.Schema(
  {
    products: [CartItemSchema],
    transaction_id: {},
    amount: { type: Number },
    address: String,
    status: {
      type: String,
      default: 'Not processed',
      enum: [
        'Not processed',
        'Processing',
        'Shipped',
        'Delivered',
        'Cancelled',
      ], // restricts this field to one of the listed string values
    },
    user: { type: ObjectId, ref: 'User' },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

const Order = mongoose.model('Order', OrderSchema);

module.exports = { Order, CartItem };
    
