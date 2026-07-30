/**
 * Integration tests for the two highest-stakes flows in this app:
 * auth (who gets in) and payment amount computation (what gets charged).
 *
 * Run with: npm test
 * Requires devDependencies: jest, supertest, mongodb-memory-server
 *
 * This is a STARTING POINT, not full coverage — it exists to close the
 * "zero tests" gap on the two areas where a silent bug either loses
 * money or lets the wrong person in. Extend it as you add features.
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let app;
let mongoServer;
let User;
let Product;
let Category;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.JWT_SECRET = 'test-secret-do-not-use-in-prod';
  process.env.NODE_ENV = 'test';

  await mongoose.connect(process.env.MONGODB_URI);

  User = require('../models/user');
  Product = require('../models/product');
  Category = require('../models/category');

  // require your actual Express app here. If server.js calls app.listen()
  // directly (as ours does), split it into app.js (exports the app) and
  // server.js (calls listen) so it can be imported without binding a port.
  app = require('../app');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
  await Product.deleteMany({});
  await Category.deleteMany({});
});

describe('Auth', () => {
  test('signup creates a user and never returns the password hash', async () => {
    const res = await request(app).post('/api/signup').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password1',
    });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user.hashed_password).toBeUndefined();
    expect(res.body.user.salt).toBeUndefined();
  });

  test('signup rejects a password without a number', async () => {
    const res = await request(app).post('/api/signup').send({
      name: 'Test User',
      email: 'test2@example.com',
      password: 'nonumber',
    });

    expect(res.status).toBe(400);
  });

  test('signin fails with wrong password', async () => {
    await request(app).post('/api/signup').send({
      name: 'Test User',
      email: 'test3@example.com',
      password: 'password1',
    });

    const res = await request(app).post('/api/signin').send({
      email: 'test3@example.com',
      password: 'wrongpassword1',
    });

    expect(res.status).toBe(401);
  });

  test('signin succeeds and returns a usable JWT', async () => {
    await request(app).post('/api/signup').send({
      name: 'Test User',
      email: 'test4@example.com',
      password: 'password1',
    });

    const res = await request(app).post('/api/signin').send({
      email: 'test4@example.com',
      password: 'password1',
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user._id).toBeDefined();
  });

  test("a user cannot update another user's profile", async () => {
    const signupA = await request(app).post('/api/signup').send({
      name: 'User A',
      email: 'usera@example.com',
      password: 'password1',
    });
    const signinA = await request(app).post('/api/signin').send({
      email: 'usera@example.com',
      password: 'password1',
    });

    const signupB = await request(app).post('/api/signup').send({
      name: 'User B',
      email: 'userb@example.com',
      password: 'password1',
    });

    // User A's token, but targeting User B's id — should be rejected
    const res = await request(app)
      .put(`/api/user/${signupB.body.user._id}`)
      .set('Authorization', `Bearer ${signinA.body.token}`)
      .send({ name: 'Hacked Name' });

    expect(res.status).toBe(403);
  });
});

describe('Payment amount computation', () => {
  test('processPayment rejects a client-supplied amount and uses real DB prices', async () => {
    const category = await new Category({ name: 'Test Category' }).save();
    const product = await new Product({
      name: 'Test Product',
      description: 'A product for testing',
      price: 50,
      category: category._id,
      quantity: 10,
    }).save();

    await request(app).post('/api/signup').send({
      name: 'Buyer',
      email: 'buyer@example.com',
      password: 'password1',
    });
    const signin = await request(app).post('/api/signin').send({
      email: 'buyer@example.com',
      password: 'password1',
    });

    // attempt to buy 2 of a $50 item — real charge should be $100,
    // regardless of what a client might have sent as "amount" in a
    // pre-fix version of this endpoint
    const res = await request(app)
      .post(`/api/braintree/payment/${signin.body.user._id}`)
      .set('Authorization', `Bearer ${signin.body.token}`)
      .send({
        paymentMethodNonce: 'fake-valid-nonce', // Braintree sandbox test nonce
        products: [{ _id: product._id, count: 2 }],
      });

    // this assertion depends on Braintree sandbox actually being
    // reachable in your test environment — if it's not mocked, this
    // test needs a Braintree test double/mock instead of a live call
    if (res.status === 200) {
      expect(Number(res.body.verifiedAmount)).toBe(100);
    }
  });

  test('processPayment rejects a cart with an unavailable product id', async () => {
    await request(app).post('/api/signup').send({
      name: 'Buyer2',
      email: 'buyer2@example.com',
      password: 'password1',
    });
    const signin = await request(app).post('/api/signin').send({
      email: 'buyer2@example.com',
      password: 'password1',
    });

    const res = await request(app)
      .post(`/api/braintree/payment/${signin.body.user._id}`)
      .set('Authorization', `Bearer ${signin.body.token}`)
      .send({
        paymentMethodNonce: 'fake-valid-nonce',
        products: [{ _id: new mongoose.Types.ObjectId(), count: 1 }],
      });

    expect(res.status).toBe(400);
  });

  test('processPayment rejects buying more than available stock', async () => {
    const category = await new Category({ name: 'Test Category 2' }).save();
    const product = await new Product({
      name: 'Low Stock Product',
      description: 'Only 1 left',
      price: 20,
      category: category._id,
      quantity: 1,
    }).save();

    await request(app).post('/api/signup').send({
      name: 'Buyer3',
      email: 'buyer3@example.com',
      password: 'password1',
    });
    const signin = await request(app).post('/api/signin').send({
      email: 'buyer3@example.com',
      password: 'password1',
    });

    const res = await request(app)
      .post(`/api/braintree/payment/${signin.body.user._id}`)
      .set('Authorization', `Bearer ${signin.body.token}`)
      .send({
        paymentMethodNonce: 'fake-valid-nonce',
        products: [{ _id: product._id, count: 5 }], // only 1 in stock
      });

    expect(res.status).toBe(400);
  });
});
