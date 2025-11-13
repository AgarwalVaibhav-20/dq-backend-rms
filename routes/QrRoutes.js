const express = require("express");
const router = express.Router();
const QrController = require("../controllers/QrControllers");
const { authMiddleware } = require('../middleware/authMiddleware');
const QrCode = require("../model/QrCode");
const Floor = require("../model/Floor");

router.post("/create/qrcode", authMiddleware, QrController.addTable);

router.get("/qrcodes/all", authMiddleware, QrController.getQrs);

router.delete("/delete/qrcodes/:id", authMiddleware, QrController.deleteQr);

router.get("/floor/:floorId", QrController.getTablesByFloor);

router.get("/stats/:restaurantId", QrController.countTablesPerFloor);

// Public API to get tables floor-wise (from frontend VITE_RESTAURENT_ID)
// MUST be before /:id route to avoid route conflicts
router.get('/public/tables', async (req, res) => {
  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📂 PUBLIC TABLES API CALLED (frontend VITE_RESTAURENT_ID)');
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
      console.warn('   Returning empty tables array.');
      return res.status(200).json({ success: true, data: [] });
    }

    // Get all floors for this restaurant
    const floors = await Floor.find({ restaurantId });
    console.log('📋 FLOORS FOUND:', floors.length);
    
    // Get all tables (QrCodes) for this restaurant with floor info
    const tables = await QrCode.find({ restaurantId }).populate('floorId');
    console.log('📋 TABLES FOUND:', tables.length);
    
    // Group tables by floor
    const tablesByFloor = {};
    
    floors.forEach(floor => {
      tablesByFloor[floor._id.toString()] = {
        floorId: floor._id,
        floorName: floor.name,
        tables: []
      };
    });
    
    tables.forEach(table => {
      if (table.floorId) {
        const floorId = table.floorId._id ? table.floorId._id.toString() : table.floorId.toString();
        if (tablesByFloor[floorId]) {
          tablesByFloor[floorId].tables.push({
            _id: table._id,
            tableNumber: table.tableNumber,
            floorId: table.floorId._id || table.floorId
          });
        }
      }
    });
    
    // Convert to array format
    const result = Object.values(tablesByFloor);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ TABLES GROUPED BY FLOOR:');
    result.forEach(floorData => {
      console.log(`   ${floorData.floorName}: ${floorData.tables.length} tables`);
    });
    console.log('═══════════════════════════════════════════════════════════');
    
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('❌ Public Tables API Error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Keep generic routes at the end to avoid matching specific routes
router.get("/:id", QrController.getQrById);

module.exports = router;
