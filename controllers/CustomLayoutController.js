const CustomLayout = require('../model/CustomLayout');

// Get custom layout by restaurantId (public route)
exports.getCustomLayout = async (req, res) => {
  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎯 CUSTOM LAYOUT API CALLED');
    console.log('═══════════════════════════════════════════════════════════');
    
    // Priority: env RESTAURANT_ID (supports both spellings) > params.restaurantId > query.restaurantId
    const getRestaurantIdFromEnv = () => {
      return process.env.RESTAURANT_ID || process.env.RESTAURENT_ID;
    };
    const envRestaurantId = getRestaurantIdFromEnv();
    const paramsRestaurantId = req.params.restaurantId;
    const queryRestaurantId = req.query.restaurantId;
    
    console.log('📋 RESTAURANT_ID SOURCES:');
    console.log('   🔹 From ENV RESTAURANT_ID (correct):', process.env.RESTAURANT_ID || 'NOT SET');
    console.log('   🔹 From ENV RESTAURENT_ID (typo):', process.env.RESTAURENT_ID || 'NOT SET');
    console.log('   🔹 From ENV (final):', envRestaurantId || 'NOT SET');
    console.log('   🔹 From URL params:', paramsRestaurantId || 'NOT PROVIDED');
    console.log('   🔹 From query string:', queryRestaurantId || 'NOT PROVIDED');
    
    const restaurantId = envRestaurantId || paramsRestaurantId || queryRestaurantId;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ FINAL RESTAURANT_ID BEING USED:', restaurantId);
    console.log('   Type:', typeof restaurantId);
    console.log('   Length:', restaurantId ? restaurantId.length : 0);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!restaurantId) {
      console.warn('⚠️ ⚠️ ⚠️ NO RESTAURANT_ID FOUND! ⚠️ ⚠️ ⚠️');
      console.warn('   Please set RESTAURANT_ID in backend .env file');
      return res.status(200).json({ 
        success: true, 
        layout: null,
        message: 'No restaurantId provided' 
      });
    }

    console.log('🔍 Searching in database for restaurantId:', restaurantId);
    const customLayout = await CustomLayout.findOne({ restaurantId });
    
    if (!customLayout) {
      console.log('ℹ️ No custom layout found in database for restaurantId:', restaurantId);
      console.log('   This is OK if layout has not been saved yet.');
      return res.status(200).json({ 
        success: true, 
        layout: null 
      });
    }

    console.log('✅ Custom layout found for restaurantId:', restaurantId);
    console.log('   Layout ID:', customLayout._id);
    console.log('═══════════════════════════════════════════════════════════');
    
    res.status(200).json({ 
      success: true, 
      layout: customLayout.layout 
    });
  } catch (error) {
    console.error('❌ Error fetching custom layout:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch custom layout',
      error: error.message 
    });
  }
};

// Save custom layout (public route - works with env restaurantId)
exports.saveCustomLayout = async (req, res) => {
  try {
    // Priority: env RESTAURANT_ID (supports both spellings) > params.restaurantId > body.restaurantId
    const getRestaurantIdFromEnv = () => {
      return process.env.RESTAURANT_ID || process.env.RESTAURENT_ID;
    };
    const restaurantId = getRestaurantIdFromEnv() || req.params.restaurantId || req.body.restaurantId;
    const { layout } = req.body;
    
    console.log('💾 Saving custom layout for restaurantId:', restaurantId);
    console.log('🔍 Source: RESTAURANT_ID=', process.env.RESTAURANT_ID, 'RESTAURENT_ID=', process.env.RESTAURENT_ID, 'params=', req.params.restaurantId, 'body=', req.body.restaurantId);
    
    if (!restaurantId) {
      return res.status(400).json({ 
        success: false, 
        message: 'restaurantId is required. Set RESTAURANT_ID in env or provide in request.' 
      });
    }

    if (!layout) {
      return res.status(400).json({ 
        success: false, 
        message: 'layout is required' 
      });
    }

    // Upsert: Update if exists, create if not
    const customLayout = await CustomLayout.findOneAndUpdate(
      { restaurantId },
      { 
        restaurantId, 
        layout,
        updatedAt: new Date()
      },
      { 
        new: true, 
        upsert: true 
      }
    );

    console.log('✅ Custom layout saved for restaurant:', restaurantId);
    res.status(200).json({ 
      success: true, 
      message: 'Custom layout saved successfully',
      layout: customLayout.layout 
    });
  } catch (error) {
    console.error('Error saving custom layout:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save custom layout',
      error: error.message 
    });
  }
};

// Delete custom layout (public route)
exports.deleteCustomLayout = async (req, res) => {
  try {
    // Priority: env RESTAURANT_ID (supports both spellings) > params.restaurantId
    const getRestaurantIdFromEnv = () => {
      return process.env.RESTAURANT_ID || process.env.RESTAURENT_ID;
    };
    const restaurantId = getRestaurantIdFromEnv() || req.params.restaurantId;
    
    console.log('🗑️ Deleting custom layout for restaurantId:', restaurantId);
    
    if (!restaurantId) {
      return res.status(400).json({ 
        success: false, 
        message: 'restaurantId is required' 
      });
    }

    const result = await CustomLayout.deleteOne({ restaurantId });

    if (result.deletedCount === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'No custom layout found to delete' 
      });
    }

    console.log('✅ Custom layout deleted for restaurant:', restaurantId);
    res.status(200).json({ 
      success: true, 
      message: 'Custom layout deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting custom layout:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete custom layout',
      error: error.message 
    });
  }
};

