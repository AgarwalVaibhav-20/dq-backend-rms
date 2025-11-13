const express = require("express");
const router = express.Router();
const { addFloor, getFloors } = require("../controllers/FloorController");
const { authMiddleware } = require('../middleware/authMiddleware');
const Floor = require("../model/Floor");

router.post("/add/floors/:id", authMiddleware, addFloor);

// router.post("/add/floors", addFloor);
router.get("/get/floors/:restaurantId", authMiddleware, getFloors);

// Public API to get floors by restaurantId (from frontend VITE_RESTAURENT_ID)
router.get('/public/floors', async (req, res) => {
  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📂 PUBLIC FLOORS API CALLED (frontend VITE_RESTAURENT_ID)');
    console.log('═══════════════════════════════════════════════════════════');
    
    // ✅ ONLY use query.restaurantId (from frontend VITE_RESTAURENT_ID) - backend .env RESTAURANT_ID NOT used
    const queryRestaurantId = req.query.restaurantId && req.query.restaurantId.trim() !== '' ? req.query.restaurantId.trim() : undefined;
    const restaurantId = queryRestaurantId;
    
    console.log('📋 RESTAURANT_ID SOURCE:');
    console.log('   🔹 From query.restaurantId (frontend VITE_RESTAURENT_ID):', queryRestaurantId || 'NOT PROVIDED');
    console.log('   🔹 Request URL:', req.url);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ FINAL RESTAURANT_ID BEING USED:', restaurantId || 'NOT PROVIDED');
    if (restaurantId) {
      console.log('   Type:', typeof restaurantId);
      console.log('   Length:', restaurantId.length);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!restaurantId) {
      console.warn('⚠️ ⚠️ ⚠️ NO RESTAURANT_ID FOUND! ⚠️ ⚠️ ⚠️');
      console.warn('   Please provide restaurantId in query parameter (from frontend VITE_RESTAURENT_ID)');
      console.warn('   Returning empty floors array.');
      return res.status(200).json({ success: true, data: [] });
    }

    console.log('🔍 MongoDB Query Filter:', JSON.stringify({ restaurantId }, null, 2));
    console.log('🔍 Searching in Floor collection...');
    
    const floors = await Floor.find({ restaurantId });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ FLOORS FOUND:', floors.length);
    
    if (floors.length > 0) {
      console.log('📋 FLOORS LIST:');
      floors.forEach((floor, index) => {
        console.log(`   ${index + 1}. ${floor.name} (ID: ${floor._id})`);
      });
    } else {
      console.log('⚠️ NO FLOORS FOUND!');
      console.log('   Possible reasons:');
      console.log('   1. No floors exist for restaurantId:', restaurantId);
      console.log('   2. RestaurantId mismatch in database');
      
      // Check if any floors exist at all
      const allFloorsCount = await Floor.countDocuments({});
      console.log('   📊 Total floors in Floor collection:', allFloorsCount);
      
      if (allFloorsCount > 0) {
        // Sample a few floors to see their restaurantIds
        const sampleFloors = await Floor.find({}).limit(3).select('name restaurantId');
        console.log('   📋 Sample floors from database:');
        sampleFloors.forEach((floor, index) => {
          console.log(`      ${index + 1}. ${floor.name} - RestaurantID: ${floor.restaurantId}`);
        });
      }
    }
    console.log('═══════════════════════════════════════════════════════════');
    
    res.status(200).json({ success: true, data: floors });
  } catch (err) {
    console.error('❌ Public Floors API Error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;

// const express = require("express");
// const router = express.Router();
// const { addFloor, getFloors, countTablesPerFloor } = require("../controllers/FloorController");

// router.post("/add/floors", addFloor); // Add floor
// router.get("/get/floors/:restaurantId", getFloors); // Get all floors for a restaurant
// router.get("/:restaurantId/stats", countTablesPerFloor); // Get table count per floor

// module.exports = router;
