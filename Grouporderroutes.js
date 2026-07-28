
const express = require('express');
const router = express.Router();

const {
  createGroupOrder,
  getGroupOrderByToken,
  payShare,
  cancelGroupOrder,
  getClientToken,
} = require('../controllers/groupOrder');
const { requireSignin, isAuth } = require('../controllers/auth');
const { userById } = require('../controllers/user');

// only a signed-in user can start a group order
router.post(
  '/group-order/create/:userId',
  requireSignin,
  isAuth,
  createGroupOrder
);

// public — invited participants may not have an account
router.get('/group-order/:token', getGroupOrderByToken);
router.get('/group-order/:token/client-token', getClientToken);
router.post('/group-order/:token/pay', payShare);

// only the initiator can cancel, so this stays behind auth
router.delete(
  '/group-order/:token/:userId',
  requireSignin,
  isAuth,
  cancelGroupOrder
);

router.param('userId', userById);

module.exports = router;
