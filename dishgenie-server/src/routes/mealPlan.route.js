const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const {
  getWeekPlan,
  setSlot,
  clearSlot
} = require('../controllers/mealPlan.controller');

router.get('/', requireAuth, getWeekPlan);
router.put('/:week', requireAuth, setSlot);
router.delete('/:week/:day/:mealType', requireAuth, clearSlot);

module.exports = router;
