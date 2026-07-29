const express = require('express');
const router = express.Router();

const {
  userById,
  read,
  update,
  trackProductView,
} = require('../controllers/user');
const { requireSignin, isAuth } = require('../controllers/auth');

router.get('/user/:userId', requireSignin, isAuth, read);
router.put('/user/:userId', requireSignin, isAuth, update);

// Style DNA — folds a viewed product's embedding into the user's
// taste profile. Called by the frontend's useTrackProductView hook.
router.post('/user/track-view/:userId', requireSignin, isAuth, trackProductView);

router.param('userId', userById);

module.exports = router;
