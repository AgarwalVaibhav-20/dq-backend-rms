// routes/menuRoutes.js
const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  createMenuItem,
  uploadMiddleware,
  getMenuItems,
  updateMenuItem,
  // deleteMenuItem,
  hardDeleteMenuItem,
  updateMenuStatus,
  deductStockFromMenu
} = require("../controllers/NewMenuController");

router.get("/menu/allmenues", authMiddleware, getMenuItems);
// Public API for customer menu (no auth required)
const { getPublicMenuItems, getPublicMenuItemsWithEnv } = require("../controllers/NewMenuController");
// Route using localStorage restaurantId (from frontend query params)
router.get("/menu/public/allmenues", getPublicMenuItems);
// Route using query.restaurantId from frontend VITE_RESTAURENT_ID - backend .env NOT used
router.get("/menu/public/env/allmenues", getPublicMenuItemsWithEnv);
router.post("/menu/add", authMiddleware, uploadMiddleware, createMenuItem);
router.put('/menus/status', authMiddleware, updateMenuStatus);
router.put("/menu/update/:id", authMiddleware, uploadMiddleware, updateMenuItem);

router.delete("/menu/delete/:id", authMiddleware, hardDeleteMenuItem);

// ==================== DEDUCT STOCK FROM MENU ====================
router.post("/menu/deduct-stock", authMiddleware, deductStockFromMenu);

module.exports = router;
