// =============================================================
//  src/routes/aiRoutes.js
// =============================================================

const express = require('express');
const { freeModel, premiumModel, purgeCache } = require('../controllers/aiController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// All AI routes require a valid access token
router.use(protect);

// GET  /api/ai/free-model  –  any logged-in user
router.get('/free-model', freeModel);

// POST /api/ai/premium-model  –  Premium_User or Admin
router.post('/premium-model', restrictTo('Premium_User', 'Admin'), premiumModel);

// DELETE /api/ai/purge-cache  –  Admin only
router.delete('/purge-cache', restrictTo('Admin'), purgeCache);

module.exports = router;
