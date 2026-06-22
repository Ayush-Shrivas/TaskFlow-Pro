const express = require('express');
const router = express.Router();
const { prioritizeTask, generateSprintPlan, detectProjectRisks, generateProjectSummary } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/prioritize', protect, prioritizeTask);
router.post('/sprint-plan', protect, generateSprintPlan);
router.get('/risk-detection/:projectId', protect, detectProjectRisks);
router.get('/project-summary/:projectId', protect, generateProjectSummary);

module.exports = router;
