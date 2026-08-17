const asyncHandler = require('../middleware/asyncHandler');
const { getOrCreateUser } = require('../services/userService');
const { searchRelevantRecipes } = require('../services/recommendationService');
const aiService = require('../services/aiService');

/* ---------------------------------------------------------
   POST /api/ai/chat
   body: { message }
--------------------------------------------------------- */
exports.chat = asyncHandler(async (req, res) => {
  const message = String((req.body && req.body.message) || '').trim();
  if (!message) {
    return res.status(400).json({ message: 'message is required' });
  }
  if (message.length > 500) {
    return res.status(400).json({ message: 'message is too long' });
  }

  const user = await getOrCreateUser(req.user);

  // MongoDB is the source of truth: pull only the relevant, ranked subset of
  // the database into the AI context. Every candidate is a real Recipe doc.
  const candidates = await searchRelevantRecipes({ message, user, limit: 15 });

  const result = await aiService.chat({ message, recipes: candidates, user });

  res.json({
    reply: result.reply,
    recipeIds: result.recipeIds || [],
    recipes: result.recipes || [],
    mode: result.mode || 'offline'
  });
});
