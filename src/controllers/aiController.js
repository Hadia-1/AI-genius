// =============================================================
//  src/controllers/aiController.js
//
//  Mock AI endpoints demonstrating RBAC in action.
// =============================================================

// -----------------------------------------------------------------
//  GET /api/ai/free-model  –  All authenticated users
// -----------------------------------------------------------------
function freeModel(req, res) {
  return res.status(200).json({
    status: 'success',
    model: 'AI-Genius Free Model v1.0',
    user: req.user.email,
    role: req.user.role,
    result: '🤖 Generated text from the free-tier model: "The quick brown fox jumps over the lazy dog."',
  });
}

// -----------------------------------------------------------------
//  POST /api/ai/premium-model  –  Premium_User & Admin only
// -----------------------------------------------------------------
function premiumModel(req, res) {
  const { prompt } = req.body;
  return res.status(200).json({
    status: 'success',
    model: 'AI-Genius Premium Model v4.0',
    user: req.user.email,
    role: req.user.role,
    prompt: prompt || '(no prompt provided)',
    result: '✨ High-quality AI generated content: "In a world of infinite possibilities, imagination is the only limit. [Premium Response]"',
    tokensUsed: 42,
  });
}

// -----------------------------------------------------------------
//  DELETE /api/ai/purge-cache  –  Admin only
// -----------------------------------------------------------------
function purgeCache(req, res) {
  return res.status(200).json({
    status: 'success',
    action: 'CACHE_PURGED',
    performedBy: req.user.email,
    role: req.user.role,
    message: '🗑️  All AI model caches have been successfully purged.',
    timestamp: new Date().toISOString(),
  });
}

module.exports = { freeModel, premiumModel, purgeCache };
