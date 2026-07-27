const formidable = require('formidable');
const _ = require('lodash');
const fs = require('fs');
const Product = require('../models/product');
const { errorHandler } = require('../helpers/dbErrorHandler');
const {
  getImageEmbedding,
  cosineSimilarity,
} = require('../helpers/imageEmbedding');

exports.productById = async (req, res, next, id) => {
  try {
    const product = await Product.findById(id).populate('category');
    if (!product) {
      return res.status(400).json({
        error: 'Product not found',
      });
    }
    req.product = product;
    next();
  } catch (err) {
    return res.status(400).json({
      error: 'Product not found',
    });
  }
};

exports.read = (req, res) => {
  req.product.photo = undefined;
  return res.json(req.product);
};

exports.create = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: 'Image could not be uploaded',
      });
    }
    // check for all fields
    const { name, description, price, category, quantity, shipping } = fields;

    if (
      !name ||
      !description ||
      !price ||
      !category ||
      !quantity ||
      !shipping
    ) {
      return res.status(400).json({
        error: 'All fields are required',
      });
    }

    let product = new Product(fields);

    // 1kb = 1000
    // 1mb = 1000000

    if (files.photo) {
      if (files.photo.size > 1000000) {
        return res.status(400).json({
          error: 'Image should be less than 1mb in size',
        });
      }
      product.photo.data = fs.readFileSync(files.photo.path);
      product.photo.contentType = files.photo.type;

      // generate a visual embedding for this product's photo so it can
      // be found via visual search later. Non-fatal if it fails — the
      // product still saves, it just won't be visually searchable yet.
      try {
        product.embedding = await getImageEmbedding(product.photo.data);
      } catch (embeddingErr) {
        console.log('EMBEDDING GENERATION FAILED (non-fatal):', embeddingErr.message);
      }
    }

    try {
      const result = await product.save();
      res.json(result);
    } catch (error) {
      console.log('PRODUCT CREATE ERROR ', error);
      return res.status(400).json({
        error: errorHandler(error),
      });
    }
  });
};

exports.remove = async (req, res) => {
  try {
    const product = req.product;
    await product.deleteOne();
    res.json({
      message: 'Product deleted successfully',
    });
  } catch (err) {
    return res.status(400).json({
      error: errorHandler(err),
    });
  }
};

exports.update = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: 'Image could not be uploaded',
      });
    }

    let product = req.product;
    product = _.extend(product, fields);

    // 1kb = 1000
    // 1mb = 1000000

    if (files.photo) {
      if (files.photo.size > 1000000) {
        return res.status(400).json({
          error: 'Image should be less than 1mb in size',
        });
      }
      product.photo.data = fs.readFileSync(files.photo.path);
      product.photo.contentType = files.photo.type;

      // re-generate the embedding since the photo changed
      try {
        product.embedding = await getImageEmbedding(product.photo.data);
      } catch (embeddingErr) {
        console.log('EMBEDDING GENERATION FAILED (non-fatal):', embeddingErr.message);
      }
    }

    try {
      const result = await product.save();
      res.json(result);
    } catch (error) {
      return res.status(400).json({
        error: errorHandler(error),
      });
    }
  });
};

/**
 * sell / arrival
 * by sell = /products?sortBy=sold&order=desc&limit=4
 * by arrival = /products?sortBy=createdAt&order=desc&limit=4
 * if no params are sent, then all products are returned
 */

exports.list = async (req, res) => {
  try {
    let order = req.query.order ? req.query.order : 'asc';
    let sortBy = req.query.sortBy ? req.query.sortBy : '_id';
    let limit = req.query.limit ? parseInt(req.query.limit) : 6;

    const products = await Product.find()
      .select('-photo')
      .populate('category')
      .sort([[sortBy, order]])
      .limit(limit);

    res.json(products);
  } catch (err) {
    return res.status(400).json({
      error: 'Products not found',
    });
  }
};

/**
 * it will find the products based on the req product category
 * other products that has the same category, will be returned
 */

exports.listRelated = async (req, res) => {
  try {
    let limit = req.query.limit ? parseInt(req.query.limit) : 6;

    const products = await Product.find({
      _id: { $ne: req.product._id },
      category: req.product.category,
    })
      .limit(limit)
      .populate('category', '_id name');

    res.json(products);
  } catch (err) {
    return res.status(400).json({
      error: 'Products not found',
    });
  }
};

exports.listCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories);
  } catch (err) {
    return res.status(400).json({
      error: 'Categories not found',
    });
  }
};

/**
 * list products by search
 * we will implement product search in react frontend
 * we will show categories in checkbox and price range in radio buttons
 * as the user clicks on those checkbox and radio buttons
 * we will make api request and show the products to users based on what he wants
 */

exports.listBySearch = async (req, res) => {
  try {
    let order = req.body.order ? req.body.order : 'desc';
    let sortBy = req.body.sortBy ? req.body.sortBy : '_id';
    let limit = req.body.limit ? parseInt(req.body.limit) : 100;
    let skip = parseInt(req.body.skip);
    let findArgs = {};

    for (let key in req.body.filters) {
      if (req.body.filters[key].length > 0) {
        if (key === 'price') {
          // gte -  greater than price [0-10]
          // lte - less than
          findArgs[key] = {
            $gte: req.body.filters[key][0],
            $lte: req.body.filters[key][1],
          };
        } else {
          findArgs[key] = req.body.filters[key];
        }
      }
    }

    const data = await Product.find(findArgs)
      .select('-photo')
      .populate('category')
      .sort([[sortBy, order]])
      .skip(skip)
      .limit(limit);

    res.json({
      size: data.length,
      data,
    });
  } catch (err) {
    return res.status(400).json({
      error: 'Products not found',
    });
  }
};

exports.photo = (req, res, next) => {
  if (req.product.photo.data) {
    res.set('Content-Type', req.product.photo.contentType);
    return res.send(req.product.photo.data);
  }
  next();
};

exports.listSearch = async (req, res) => {
  // create query object to hold search value and category value
  const query = {};

  // if there's no search term, just return an empty result set
  // instead of leaving the request hanging with no response
  if (!req.query.search) {
    return res.json([]);
  }

  // assign search value to query.name
  query.name = { $regex: req.query.search, $options: 'i' };
  // assign category value to query.category
  if (req.query.category && req.query.category != 'All') {
    query.category = req.query.category;
  }

  try {
    const products = await Product.find(query).select('-photo');
    res.json(products);
  } catch (err) {
    return res.status(400).json({
      error: errorHandler(err),
    });
  }
};

/**
 * Visual search: accepts an uploaded image, computes its embedding,
 * and returns products sorted by visual similarity.
 * Expects a multipart form with a single file field named "photo".
 */
exports.visualSearch = async (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;

  form.parse(req, async (err, fields, files) => {
    if (err || !files.photo) {
      return res.status(400).json({
        error: 'An image file is required for visual search',
      });
    }

    try {
      const limit = fields.limit ? parseInt(fields.limit) : 10;

      const searchImageBuffer = fs.readFileSync(files.photo.path);
      const searchEmbedding = await getImageEmbedding(searchImageBuffer);

      // pull every product that has an embedding; fine at small/medium
      // catalog sizes, but for large catalogs you'd want a proper vector
      // index (e.g. MongoDB Atlas Vector Search) instead of comparing
      // in application code.
      const products = await Product.find({ embedding: { $exists: true } })
        .select('-photo')
        .populate('category');

      const ranked = products
        .map((product) => ({
          product,
          similarity: cosineSimilarity(searchEmbedding, product.embedding),
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map((entry) => ({
          ...entry.product.toObject(),
          similarity: entry.similarity,
        }));

      res.json(ranked);
    } catch (error) {
      console.log('VISUAL SEARCH ERROR', error);
      return res.status(400).json({
        error: 'Visual search failed: ' + error.message,
      });
    }
  });
};

exports.decreaseQuantity = async (req, res, next) => {
  try {
    let bulkOps = req.body.order.products.map((item) => {
      return {
        updateOne: {
          filter: { _id: item._id },
          update: { $inc: { quantity: -item.count, sold: +item.count } },
        },
      };
    });

    await Product.bulkWrite(bulkOps);
    next();
  } catch (error) {
    return res.status(400).json({
      error: 'Could not update product',
    });
  }
};
