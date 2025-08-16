// 📁 backend/routes/investmentAnalysisRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const analysisController = require('../controllers/investmentAnalysisController');

router.use(authMiddleware);

// GET /api/investments/irr
router.get('/irr', analysisController.getInvestmentsIRR);

module.exports = router;
