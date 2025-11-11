const express = require("express");
const router = express.Router();
const CustomerController = require("../controllers/CustomerController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/customer/add", authMiddleware, CustomerController.createCustomer);
// Public API for customer creation using localStorage restaurantId (no auth required)
router.post("/customer/public/add", CustomerController.createCustomer);
// Public API for customer creation using body.restaurantId from frontend VITE_RESTAURENT_ID (no auth required - for frontend ecommerce) - backend .env NOT used
router.post("/customer/public/env/add", CustomerController.createCustomerWithEnvId);
router.get("/customer/all", authMiddleware, CustomerController.getAllCustomersForReservation);
// ✅ Customer report - MUST be before parameterized routes
router.get('/customer/report', authMiddleware, CustomerController.getCustomerReport);
router.get("/customer/type/:restaurantId/:customerType", authMiddleware, CustomerController.getCustomersByType);
router.post('/customer/admin-reward-points/add/:id', authMiddleware, CustomerController.addAdminRewardPoints);
router.put("/customer/update/:id", authMiddleware, CustomerController.updateCustomer);
router.put("/customer/frequency/:id", authMiddleware, CustomerController.updateCustomerFrequency);
// ⚠️ Parameterized routes should be at the end
router.get("/customer/:restaurantId", authMiddleware, CustomerController.getAllCustomers);
router.get("/customer/:id", authMiddleware, CustomerController.getCustomerById);

router.delete("/customer/delete/:id", authMiddleware, CustomerController.deleteCustomer);
// Add these routes
router.patch('/customer/reward-points/add/:id', authMiddleware, CustomerController.addRewardPoints);
router.patch('/customer/reward-points/deduct/:id', authMiddleware, CustomerController.deductRewardPoints);
router.post("/customer/calculate-total-spent", authMiddleware, CustomerController.calculateCustomerTotalSpent);
router.post("/customer/calculate-total-spent/:customerId", authMiddleware, CustomerController.calculateSingleCustomerTotalSpent);
router.post("/send-message", authMiddleware, CustomerController.sendMessage);
module.exports = router;
