const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      maxlength: 32,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: ObjectId,
      ref: 'Category',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    sold: {
      type: Number,
      default: 0,
    },
    photo: {
      data: Buffer,
      contentType: String,
    },
    shipping: {
      required: false,
      type: Boolean,
    },
    // stores the image embedding vector used for visual similarity search.
    // populated by helpers/imageEmbedding.js when a product photo is saved.
    embedding: {
      type: [Number],
      default: undefined,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
