// 📁 backend/routes/performanceRoutes.js
const express = require('express');
const router = express.Router();
const performanceController = require('../controllers/performanceController');

router.get('/performance', performanceController.getPerformance);

module.exports = router;
