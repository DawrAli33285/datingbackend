const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controller/dashboard');
const protect = require('../middlewares/authMiddleware');

router.get('/dashboard', protect, getDashboard);

module.exports = router;