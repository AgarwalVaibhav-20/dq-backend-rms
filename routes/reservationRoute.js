const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/ReservationController");
const {authMiddleware, optionalAuthMiddleware} = require("../middleware/authMiddleware");

// IMPORTANT: Specific routes MUST come BEFORE parameterized routes (/:id)
// Public routes - work with env RESTAURANT_ID or query params
router.get("/available-slots", optionalAuthMiddleware, reservationController.getAvailableTimeSlots); // Must be before /:id
router.get("/all", optionalAuthMiddleware, reservationController.getAllReservations);
router.get("/debug/all", authMiddleware, reservationController.getAllReservations);
// Route using authMiddleware restaurantId (req.userId)
router.post("/add", authMiddleware, reservationController.createReservation);
// Route using .env restaurantId (no authentication required)
router.post("/add/env", reservationController.createReservationWithEnv);

// Parameterized routes (must come AFTER specific routes)
router.put("/:id", optionalAuthMiddleware, reservationController.updateReservation);
router.delete("/:id", optionalAuthMiddleware, reservationController.cancelReservation);

module.exports = router;
