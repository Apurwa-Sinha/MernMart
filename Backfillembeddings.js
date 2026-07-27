/**
 * One-time backfill script: generates visual embeddings for every
 * existing product that doesn't have one yet.
 *
 * Run with:  node scripts/backfillEmbeddings.js
 *
 * Requires HUGGINGFACE_API_KEY in your .env, same as the live endpoints.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/product');
const { getImageEmbedding } = require('../helpers/imageEmbedding');

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');

  const products = await Product.find({
    embedding: { $exists: false },
    'photo.data': { $exists: true },
  });

  console.log(`Found ${products.length} products needing embeddings`);

  let succeeded = 0;
  let failed = 0;

  for (const product of products) {
    try {
      const embedding = await getImageEmbedding(product.photo.data);
      product.embedding = embedding;
      await product.save();
      succeeded++;
      console.log(`✓ ${product.name}`);
    } catch (err) {
      failed++;
      console.log(`✗ ${product.name} — ${err.message}`);
    }

    // small delay to be polite to the free-tier rate limit
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`\nDone. Succeeded: ${succeeded}, Failed: ${failed}`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('Backfill script failed:', err);
  process.exit(1);
});
