const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const admin = require('../controllers/admin.controller');

// Every admin endpoint requires a valid Firebase ID token AND a persisted
// admin role. Order matters: requireAuth verifies the token and attaches
// req.user, then requireAdmin checks the MongoDB role server-side.
router.use(requireAuth, requireAdmin);

router.get('/me', admin.adminStatus);
router.get('/stats', admin.stats);
router.get('/recipes', admin.listAdminRecipes);
router.get('/recipes/:id', admin.getAdminRecipe);
router.post('/recipes', admin.createAdminRecipe);
router.put('/recipes/:id', admin.updateAdminRecipe);
router.delete('/recipes/:id', admin.deleteAdminRecipe);

module.exports = router;
