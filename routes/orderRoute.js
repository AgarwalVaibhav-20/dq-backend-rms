const express = require("express");
const router = express.Router();
const orderController = require("../controllers/OrderController");
const {authMiddleware} = require("../middleware/authMiddleware");

// 📦 Order Routes
// Public route - Priority: body.restaurantId (FIRST - from localStorage) > env RESTAURANT_ID (fallback) > req.userId
// 🔥 CRITICAL: localStorage की restaurantId को FIRST PRIORITY दी गई है
// 🔥 NOTE: If you change RESTAURANT_ID in .env file, RESTART the backend server
router.post("/create/order", orderController.createOrder); // Public - customer menu se order bnane ke liye

// Public route to get orders by restaurantId (query parameter only - .env RESTAURANT_ID NOT used)
router.get("/public/orders", orderController.getPublicOrders);

// Authenticated route - req.userId से restaurantId fetch करते हैं (.env RESTAURANT_ID NOT used)
router.get("/all/order", authMiddleware, orderController.getAllOrders);
router.get("/test-connection", orderController.testOrderConnection); // Test endpoint without auth
router.put('/orders/:id/status' , authMiddleware , orderController.updateOrderStatus)
router.put("/orders/:id", authMiddleware, orderController.updateOrder);
router.post('/orders/active-tables',authMiddleware , orderController.getCombinedOrders);
router.get("/:id", authMiddleware, orderController.getOrderById);
router.delete("/:id", authMiddleware, orderController.deleteOrder);
router.get('/order/statistics', authMiddleware, orderController.getOrderStatistics);
router.get('/order/rejectedStatistics', authMiddleware, orderController.getRejectedOrderStatistics);

module.exports = router;
