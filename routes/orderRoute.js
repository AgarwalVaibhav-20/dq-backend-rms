const express = require("express");
const router = express.Router();
const orderController = require("../controllers/OrderController");
const {authMiddleware} = require("../middleware/authMiddleware");

// 📦 Order Routes
// Public route - ONLY uses body.restaurantId (from frontend VITE_RESTAURENT_ID or localStorage) - backend .env RESTAURANT_ID NOT used
// 🔥 CRITICAL: Frontend .env की VITE_RESTAURENT_ID को use किया जाता है - backend .env RESTAURANT_ID use नहीं होती
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
