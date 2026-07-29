# SmartCart — MERN Ecommerce with AI-Powered Features

A full-stack MERN ecommerce application with authentication, product/category/order management, Braintree payments, and five distinctive AI/ML-powered features layered on top of the base shopping experience.

## Features

### Core
- User authentication (JWT-based sign up/sign in)
- Product catalog with categories, search, and filtering
- Shopping cart (client-side, persisted in `localStorage`)
- Checkout with Braintree payments
- Order history for users, order management for admins
- Admin dashboard: product/category CRUD, order status management

### Distinctive additions
- **Visual search** — upload a photo, find visually similar products (image embeddings via Hugging Face Inference API)
- **Style DNA** — a running "taste profile" per user built from viewed/purchased products, powering personalized "Picked for your style" recommendations
- **AI stylist chat** — a chat widget (Claude API) grounded in the user's Style DNA and your real product catalog — never invents products that don't exist
- **Group-buy / split-the-bill checkout** — start a shared order, invite others by email, each pays their own share via a link before the order ships
- **Return-risk indicator** — category-level return-rate signal shown on product pages, computed from real order history

## Tech stack

- **Frontend**: React 16, React Router v5, Material-UI v4
- **Backend**: Node.js, Express, MongoDB/Mongoose
- **Auth**: JWT (`jsonwebtoken`, `express-jwt`), bcrypt password hashing
- **Payments**: Braintree (sandbox)
- **AI/ML**: Hugging Face Inference API (image embeddings), Anthropic API (stylist chat)

## Project structure (expected)

```
/server
  /controllers   — auth, user, product, category, order, braintree, groupOrder, stylist
  /models         — User, Product, Category, Order, GroupOrder
  /routes         — one file per resource
  /helpers        — dbErrorHandler, imageEmbedding, stylistHelper
  /scripts        — backfillEmbeddings.js
  server.js

/client
  /src
    /pages        — Home, ProductDetail, Cart, Checkout, Signin, Signup,
                     AdminDashboard, AddCategory, ManageCategories,
                     AddProduct, ManageProducts, UpdateProduct, AdminOrders,
                     OrderHistory, CreateGroupOrder, GroupOrderPay
    /components   — Header, PrivateRoute, AdminRoute, VisualSearch,
                     StyleDNARecommendations, StylistChat, ReturnRiskBadge
    /helpers      — authHelpers, cartHelpers
    /hooks        — useTrackProductView
    App.jsx
```

## Setup

### 1. Install dependencies

```bash
# server
cd server
npm install

# client
cd ../client
npm install
```

### 2. Environment variables

Create a `.env` file in your server root (see `.env.example`):

```
# Core app
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>

# Auth
JWT_SECRET=replace_with_a_long_random_string

# Braintree (sandbox) — get credentials from braintreegateway.com
BRAINTREE_MERCHANT_ID=
BRAINTREE_PUBLIC_KEY=
BRAINTREE_PRIVATE_KEY=

# Frontend URL — used to build shareable group-order links
CLIENT_URL=http://localhost:3000

# Visual search — free tier key at huggingface.co/settings/tokens
HUGGINGFACE_API_KEY=

# AI stylist chat — key at console.anthropic.com/settings/keys
ANTHROPIC_API_KEY=
```

In your client's `.env`:
```
REACT_APP_API_URL=http://localhost:5000
```

### 3. Run the backend

```bash
cd server
npm run dev
```

### 4. Backfill embeddings for existing products (one-time, optional)

If you already have products in your database before enabling visual search / Style DNA, run:

```bash
node scripts/backfillEmbeddings.js
```

New products created after this point get an embedding automatically.

### 5. Run the frontend

```bash
cd client
npm start
```

## Known gaps / things to verify before relying on this in production

This project has been built up incrementally and reasoned through carefully, but **has not yet been run end-to-end**. Before treating any of this as production-ready:

- [ ] Confirm your actual `routes/order.js` has a route for `GET /api/orders/by/user/:userId` (needed by the "My Orders" page) — add if missing:
  ```js
  const { purchaseHistory } = require('../controllers/user');
  router.get('/orders/by/user/:userId', requireSignin, isAuth, purchaseHistory);
  ```
- [ ] Confirm `routes/category.js` exposes `GET /api/categories`, and `PUT`/`DELETE /api/category/:categoryId/:userId` — assumed by the admin category management page but never directly verified.
- [ ] Confirm `routes/user.js` includes the Style DNA view-tracking route:
  ```js
  router.post('/user/track-view/:userId', requireSignin, isAuth, trackProductView);
  ```
- [ ] Double-check installed versions of `express-jwt`, `express-validator`, and `formidable` against what the code assumes (v8+, v7+, and v1.x respectively) — mismatches here are the most likely source of a hard crash.
- [ ] No automated tests exist yet.
- [ ] No pagination on admin lists or the homepage product grid (fine for small catalogs, not for scale).
- [ ] No password reset flow.
- [ ] No product reviews/ratings or wishlist feature yet.
- [ ] No email notifications (order confirmations, group-buy invites currently rely purely on manually sharing a link).

## Security notes

- Passwords are hashed with bcrypt (cost factor 10); Braintree handles all payment card data — no card details ever touch this server.
- Product prices are always recomputed server-side at checkout, never trusted from the client.
- The stylist chat is explicitly constrained to only recommend products that exist in your actual catalog — the system prompt instructs it never to invent products, and recommendations are resolved against real product IDs before being returned to the frontend.












