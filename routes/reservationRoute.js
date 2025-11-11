const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/ReservationController");
const {authMiddleware, optionalAuthMiddleware} = require("../middleware/authMiddleware");

// IMPORTANT: Specific routes MUST come BEFORE parameterized routes (/:id)
// Public routes - ONLY use query/body.restaurantId (from frontend VITE_RESTAURENT_ID) - backend .env RESTAURANT_ID NOT used
router.get("/available-slots", optionalAuthMiddleware, reservationController.getAvailableTimeSlots); // Must be before /:id
router.get("/all", optionalAuthMiddleware, reservationController.getAllReservations);
router.get("/debug/all", authMiddleware, reservationController.getAllReservations);
// Route using authMiddleware restaurantId (req.userId)
router.post("/add", authMiddleware, reservationController.createReservation);
// Route using body.restaurantId from frontend VITE_RESTAURENT_ID (no authentication required) - backend .env NOT used
router.post("/add/env", reservationController.createReservationWithEnv);

// Parameterized routes (must come AFTER specific routes)
router.put("/:id", optionalAuthMiddleware, reservationController.updateReservation);
router.delete("/:id", optionalAuthMiddleware, reservationController.cancelReservation);

module.exports = router;
