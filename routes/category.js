const express = require('express');
const router = express.Router();
const Category = require('../model/Category');
const User = require('../model/User');
const multer = require('multer');
const { authMiddleware } = require('../middleware/authMiddleware');
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

// ---------- Multer Config with Memory Storage ----------
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ---------- Cloudinary Upload Helper ----------
const uploadToCloudinary = (fileBuffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });

// ---------- CREATE CATEGORY ----------
// router.post(
//   "/category",
//   authMiddleware,
//   upload.single("categoryImage"),
//   async (req, res) => {
//     try {
//       const restaurantId = req.user.restaurantId;
//       const { categoryName, basePrice, description, size } = req.body;

//       console.log("Request Body:", req.body);
//       console.log("Uploaded File:", req.file);

//       if (!categoryName || !req.file) {
//         return res
//           .status(400)
//           .json({ message: "categoryName and categoryImage are required" });
//       }

//       // Upload to Cloudinary inside "category" folder
//       const result = await cloudinary.uploader.upload(req.file.path, {
//         folder: "category",
//         public_id: `${Date.now()}-${path
//           .basename(req.file.originalname, path.extname(req.file.originalname))}`,
//       });

//       // Delete local temp file
//       fs.unlinkSync(req.file.path);

//       const newCategory = new Category({
//         categoryName,
//         categoryImage: result.secure_url, // Cloudinary image URL
//         restaurantId,
//         basePrice,
//         description,
//         size,
//       });

//       await newCategory.save();

//       console.log("New Category Saved:", newCategory);
//       res.status(201).json(newCategory);
//     } catch (err) {
//       console.error("Error creating category:", err);
//       res.status(500).json({ message: err.message || "Server error" });
//     }
//   }
// );

router.post(
  "/category",
  authMiddleware,
  upload.single("categoryImage"),
  async (req, res) => {
    try {
      const { restaurantId, categoryName, basePrice, description, size } = req.body;

      if (!restaurantId) {
        return res.status(400).json({ message: "restaurantId is required" });
      }

      if (!categoryName || !req.file) {
        return res.status(400).json({ message: "categoryName and categoryImage are required" });
      }

      // Upload image to Cloudinary
      const imageUrl = await uploadToCloudinary(req.file.buffer, "category");

      const newCategory = new Category({
        restaurantId,
        categoryName,
        categoryImage: imageUrl,
        basePrice,
        description,
        size,
      });

      await newCategory.save();

      res.status(201).json(newCategory);
    } catch (err) {
      console.error("Error creating category:", err);
      res.status(500).json({ message: err.message || "Server error" });
    }
  }
);


//fetching category
router.get('/categories', authMiddleware, async (req, res) => {
  try {
    console.log('🔍 Categories API Debug:');
    console.log('req.query.restaurantId:', req.query.restaurantId);
    console.log('req.userId:', req.userId);
    console.log('req.user:', req.user);
    console.log('req.user.restaurantId:', req.user?.restaurantId);
    console.log('req.user._id:', req.user?._id);
    
    // 🔥 ALWAYS use req.userId (which is now ONLY restaurantId)
    const restaurantId = req.userId;
    console.log('Final restaurantId used:', restaurantId);
    console.log('restaurantId type:', typeof restaurantId);
    console.log('restaurantId toString:', restaurantId?.toString());
    console.log('✅ Using ONLY restaurantId from user collection');
    
    if (!restaurantId) {
      console.log('❌ No restaurantId found');
      return res.status(400).json({ message: 'restaurantId is required' });
    }

    console.log('🔍 Database Query:');
    console.log('Filter:', { isDeleted: false, restaurantId });
    
    const categories = await Category.find({ isDeleted: false, restaurantId });
    console.log('✅ Categories found:', categories.length);
    console.log('Categories data:', categories);
    
    res.json({ data: categories });
  } catch (err) {
    console.error('❌ Categories API Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public API to get categories by restaurantId (for customer menu)
router.get('/public/categories', async (req, res) => {
  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📂 PUBLIC CATEGORIES API CALLED');
    console.log('═══════════════════════════════════════════════════════════');
    
    // Priority: env RESTAURANT_ID (supports both spellings) > query.restaurantId
    const getRestaurantIdFromEnv = () => {
      return process.env.RESTAURANT_ID || process.env.RESTAURENT_ID;
    };
    const envRestaurantId = getRestaurantIdFromEnv();
    const queryRestaurantId = req.query.restaurantId;
    
    console.log('📋 RESTAURANT_ID SOURCES:');
    console.log('   🔹 From ENV RESTAURANT_ID (correct):', process.env.RESTAURANT_ID || 'NOT SET');
    console.log('   🔹 From ENV RESTAURENT_ID (typo):', process.env.RESTAURENT_ID || 'NOT SET');
    console.log('   🔹 From ENV (final):', envRestaurantId || 'NOT SET');
    console.log('   🔹 From query string:', queryRestaurantId || 'NOT PROVIDED');
    console.log('   🔹 Request URL:', req.url);
    console.log('   🔹 Full request query:', JSON.stringify(req.query));
    
    const restaurantId = envRestaurantId || queryRestaurantId;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ FINAL RESTAURANT_ID BEING USED:', restaurantId);
    console.log('   Type:', typeof restaurantId);
    console.log('   Length:', restaurantId ? restaurantId.length : 0);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!restaurantId) {
      console.warn('⚠️ ⚠️ ⚠️ NO RESTAURANT_ID FOUND! ⚠️ ⚠️ ⚠️');
      console.warn('   Please set RESTAURANT_ID in backend .env file');
      console.warn('   Returning empty categories array.');
      return res.status(200).json({ success: true, data: [] }); // Return empty array instead of error
    }

    console.log('🔍 MongoDB Query Filter:', JSON.stringify({ restaurantId, isDeleted: false }, null, 2));
    console.log('🔍 Searching in Category collection...');
    
    const categories = await Category.find({ 
      restaurantId,
      isDeleted: false 
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ CATEGORIES FOUND:', categories.length);
    
    if (categories.length > 0) {
      console.log('📋 CATEGORIES LIST:');
      categories.forEach((cat, index) => {
        console.log(`   ${index + 1}. ${cat.categoryName} (ID: ${cat._id})`);
      });
    } else {
      console.log('⚠️ NO CATEGORIES FOUND!');
      console.log('   Possible reasons:');
      console.log('   1. No categories exist for restaurantId:', restaurantId);
      console.log('   2. All categories are marked as deleted (isDeleted: true)');
      console.log('   3. RestaurantId mismatch in database');
      
      // Check if any categories exist at all
      const allCategoriesCount = await Category.countDocuments({});
      console.log('   📊 Total categories in Category collection:', allCategoriesCount);
      
      if (allCategoriesCount > 0) {
        // Sample a few categories to see their restaurantIds
        const sampleCategories = await Category.find({}).limit(3).select('categoryName restaurantId isDeleted');
        console.log('   📋 Sample categories from database:');
        sampleCategories.forEach((cat, index) => {
          console.log(`      ${index + 1}. ${cat.categoryName} - RestaurantID: ${cat.restaurantId} - Deleted: ${cat.isDeleted}`);
        });
      }
    }
    console.log('═══════════════════════════════════════════════════════════');
    
    res.status(200).json({ success: true, data: categories });
  } catch (err) {
    console.error('❌ Public Categories API Error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});


// ---------- GET CATEGORY BY ID ----------
router.get('/category/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    res.json({ data: category });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- UPDATE CATEGORY ----------
// router.post(
//   "/category/update/:id",
//   upload.single("categoryImage"),
//   async (req, res) => {
//     try {
//       const { categoryName, restaurantId } = req.body;
//       const updateData = {};

//       if (categoryName) updateData.categoryName = categoryName;
//       if (restaurantId) updateData.restaurantId = restaurantId;

//       // If new image uploaded
//       if (req.file) {
//         const result = await cloudinary.uploader.upload(req.file.path, {
//           folder: "category",
//           public_id: `${Date.now()}-${path.basename(
//             req.file.originalname,
//             path.extname(req.file.originalname)
//           )}`,
//         });

//         fs.unlinkSync(req.file.path); // remove temp file

//         updateData.categoryImage = result.secure_url;
//       }

//       const updatedCategory = await Category.findByIdAndUpdate(
//         req.params.id,
//         updateData,
//         { new: true }
//       );

//       if (!updatedCategory) {
//         return res.status(404).json({ message: "Category not found" });
//       }

//       res.json(updatedCategory);
//     } catch (err) {
//       console.error("Error updating category:", err);
//       res.status(500).json({ message: err.message || "Server error" });
//     }
//   }
// );


// // ---------- DELETE CATEGORY ----------
// router.delete('/delete/category/:id', async (req, res) => {
//   try {
//     const category = await Category.findById(req.params.id);
//     if (!category) {
//       return res.status(404).json({ message: 'Category not found' });
//     }

//     // Remove image if you want on delete
//     if (category.categoryImage && fs.existsSync(category.categoryImage)) {
//       fs.unlinkSync(category.categoryImage);
//     }

//     category.isDeleted = true;
//     await category.save();

//     res.json({ message: 'Category marked as deleted successfully' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// })

// -------------------UPDATE-CATEGORY---------------------------
router.put(
  "/category/update/:id",
  upload.single("categoryImage"),
  async (req, res) => {
    try {
      const body = req.body;
      const updateData = {};

      if (body.categoryName) updateData.categoryName = body.categoryName;
      if (body.restaurantId) updateData.restaurantId = body.restaurantId;

      // If a new image is uploaded, handle it from the buffer
      if (req.file) {
        updateData.categoryImage = await uploadToCloudinary(req.file.buffer, "category");
      }

      const updatedCategory = await Category.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );

      if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.json(updatedCategory);
    } catch (err) {
      console.error("Error updating category:", err);
      res.status(500).json({ message: err.message || "Server error" });
    }
  }
);

// ---------- DELETE CATEGORY ----------
router.delete('/delete/category/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // The fs.unlinkSync call was removed as it was incorrect.
    // If you want to delete the image from Cloudinary, you'd do it here.

    category.isDeleted = true;
    await category.save();

    res.json({ message: 'Category marked as deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
