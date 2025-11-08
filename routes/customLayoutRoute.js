const express = require('express');
const router = express.Router();
const customLayoutController = require('../controllers/CustomLayoutController');

// Public routes - work with env RESTAURANT_ID or query/params
// Support both with and without trailing slash
router.get('/custom-layout/:restaurantId', customLayoutController.getCustomLayout);
router.get('/custom-layout/', customLayoutController.getCustomLayout); // Support trailing slash
router.get('/custom-layout', customLayoutController.getCustomLayout); // Works with query param or env
router.post('/custom-layout/:restaurantId', customLayoutController.saveCustomLayout);
router.post('/custom-layout/', customLayoutController.saveCustomLayout); // Support trailing slash
router.post('/custom-layout', customLayoutController.saveCustomLayout); // Works with body or env
router.delete('/custom-layout/:restaurantId', customLayoutController.deleteCustomLayout);

module.exports = router;

