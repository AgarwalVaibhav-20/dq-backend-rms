const Order = require("../model/Order");
const Customer = require("../model/Customer");
const Delivery = require("../model/Delivery");
const mongoose = require('mongoose');

exports.createOrder = async (req, res) => {
  try {
    // LOG REQUEST BODY FIRST to see what we're receiving
    console.log("═══════════════════════════════════════════════════════════");
    console.log("📥📥📥 INCOMING REQUEST - FULL BODY 📥📥📥");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("🔍 Request Body Keys:", Object.keys(req.body));
    console.log("🔍 Request Body 'from' field:", req.body.from);
    console.log("🔍 Request Body 'from' type:", typeof req.body.from);
    console.log("🔍 Request Body 'from' === 'delivery':", req.body.from === 'delivery');
    console.log("🔍 Full request body:", JSON.stringify(req.body, null, 2));
    console.log("═══════════════════════════════════════════════════════════");
    
    const {
      customerId,
      items,
      totalAmount,
      status,
      deliveryId,
      restaurantId,
      userId,
      tableNumber,
      customerName,
      customerAddress: bodyCustomerAddress,
      from: fromRequestBody, // Extract 'from' from request body
      orderType,
      tax,
      taxAmount,
      discount,
      discountAmount,
      discountPercentage,
      discountType,
      subtotal,
      systemCharge,
      roundOff,
      kotGenerated,
      paymentStatus,
    } = req.body;
    
    // CRITICAL: Set 'from' field - EXACTLY as received from request body
    // For ecommerce orders, this MUST be 'delivery'
    let from = fromRequestBody;
    
    // If 'from' is not provided, default to 'system'
    if (!from) {
      from = 'system';
      console.log("⚠️ WARNING: 'from' field not found in request body, defaulting to 'system'");
    } else {
      // Normalize: trim and convert to string
      from = from.toString().trim();
      console.log("✅ 'from' field found in request body:", from);
    }
    
    console.log("═══════════════════════════════════════════════════════════");
    console.log("📋 'FROM' FIELD PROCESSING:");
    console.log("   🔹 fromRequestBody (raw from req.body):", fromRequestBody);
    console.log("   🔹 from (processed):", from);
    console.log("   🔹 from type:", typeof from);
    console.log("   🔹 from === 'delivery':", from === 'delivery');
    console.log("   🔹 from.toLowerCase() === 'delivery':", from.toLowerCase() === 'delivery');
    console.log("═══════════════════════════════════════════════════════════");

    // Enhanced validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items array is required and cannot be empty"
      });
    }

    // Check if restaurantId is available from any source
    // 🔥 NOTE: process.env values are loaded at server startup
    // If you change RESTAURANT_ID in .env file, you need to RESTART the backend server
    // The new value will be available immediately after server restart
    const getRestaurantIdFromEnv = () => {
      return process.env.RESTAURANT_ID || process.env.RESTAURENT_ID;
    };
    const envRestaurantId = getRestaurantIdFromEnv();
    // Filter out empty strings - treat empty string as undefined
    const bodyRestaurantId = (restaurantId && restaurantId.trim() !== '') ? restaurantId : undefined;
    const userRestaurantId = req.userId;
    
    console.log('🔍 Restaurant ID resolution (Backend):', {
      envRestaurantId: envRestaurantId || 'NOT SET',
      bodyRestaurantId: bodyRestaurantId || 'NOT PROVIDED',
      userRestaurantId: userRestaurantId || 'NOT PROVIDED',
      originalBodyRestaurantId: restaurantId,
      note: 'Priority: body.restaurantId (FIRST - from localStorage) > env RESTAURANT_ID (fallback) > req.userId'
    });
    
    if (!bodyRestaurantId && !envRestaurantId && !userRestaurantId) {
      return res.status(400).json({
        success: false,
        message: "Restaurant ID is required. Set RESTAURANT_ID in env, provide in request body (from localStorage), or authenticate."
      });
    }

    if (!tableNumber) {
      return res.status(400).json({
        success: false,
        message: "Table number is required"
      });
    }

    // 🔥 CRITICAL FIX: Priority - body.restaurantId (FIRST) > env RESTAURANT_ID (fallback) > req.userId
    // अगर localStorage में restaurantId है, तो उसे use करेंगे (body में आती है)
    // अगर localStorage में restaurantId नहीं है, तो backend env RESTAURANT_ID use होगी
    const finalRestaurantId = bodyRestaurantId || envRestaurantId || userRestaurantId;
    // For public routes, if userId is not provided, use restaurantId as userId (same restaurant owner)
    // This allows public orders to work without authentication
    const finalUserId = userId || req.userId || finalRestaurantId;
    
    // Validate finalRestaurantId is not empty
    if (!finalRestaurantId || (typeof finalRestaurantId === 'string' && finalRestaurantId.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: "Invalid Restaurant ID. Please set RESTAURANT_ID in backend .env file."
      });
    }
    
    // Validate finalUserId is not empty (should always have a value now)
    if (!finalUserId || (typeof finalUserId === 'string' && finalUserId.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: "User ID is required. Please authenticate or set RESTAURANT_ID in backend .env file."
      });
    }

    console.log("🔍 Creating order with restaurantId:", finalRestaurantId);
    console.log("🔍 Source: RESTAURANT_ID=", process.env.RESTAURANT_ID, "RESTAURENT_ID=", process.env.RESTAURENT_ID, "body=", restaurantId, "user=", req.userId);
    console.log("🔍 Final restaurantId:", finalRestaurantId);
    console.log("🔍 Final restaurantId source:", bodyRestaurantId && finalRestaurantId === bodyRestaurantId ? 'body (localStorage from frontend) - FIRST PRIORITY ✅' : (envRestaurantId && finalRestaurantId === envRestaurantId ? 'env RESTAURANT_ID (fallback)' : 'req.userId'));
    if (bodyRestaurantId && finalRestaurantId === bodyRestaurantId) {
      console.log("🔍✅✅✅ LOCALSTORAGE RESTAURANTID IS BEING USED (FIRST PRIORITY)");
    } else if (envRestaurantId && finalRestaurantId === envRestaurantId) {
      console.log("🔍✅✅✅ ENV RESTAURANT_ID IS BEING USED (FALLBACK - localStorage में नहीं थी)");
    }
    console.log("Final userId:", finalUserId);

    // Validate status enum values
    const validStatuses = ["pending", "confirmed", "preparing", "ready", "served", "completed", "cancelled"];
    const orderStatus = status || "pending";
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: [`Status must be one of: ${validStatuses.join(", ")}. Received: ${orderStatus}`]
      });
    }

    // Calculate totalAmount if not provided (apply discount if exists)
    let calculatedTotalAmount = totalAmount;
    if (!calculatedTotalAmount && subtotal !== undefined) {
      const discountAmt = discountAmount || 0;
      const taxAmt = taxAmount || tax || 0;
      const sysCharge = systemCharge || 0;
      const roundOffVal = roundOff || 0;
      calculatedTotalAmount = Math.max(0, subtotal - discountAmt + taxAmt + sysCharge + roundOffVal);
    }

    let orderData = {
      items,
      totalAmount: calculatedTotalAmount || subtotal || 0, // Use provided totalAmount (with discount applied) or calculate
      status: orderStatus,
      restaurantId: finalRestaurantId,
      userId: finalUserId,
      tableNumber: tableNumber || "Table-1", // Default table if not provided
      subtotal: subtotal || 0,
      // NOTE: 'from' field will be set explicitly later to ensure it's correct
    };
    
    // CRITICAL: Set 'from' field explicitly - MUST be set correctly for ecommerce orders
    // Check if 'from' is 'delivery' (case-insensitive)
    const fromNormalized = from ? from.toString().trim().toLowerCase() : '';
    const isDelivery = fromNormalized === 'delivery';
    
    if (isDelivery) {
      orderData.from = 'delivery'; // Explicitly set to 'delivery' for ecommerce
      console.log("✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅");
      console.log("✅✅✅ ECOMMERCE ORDER DETECTED: 'from' field set to 'delivery' ✅✅✅");
      console.log("✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅");
    } else if (from && from.toString().trim()) {
      orderData.from = from.toString().trim();
      console.log("✅ 'from' field set to:", orderData.from);
    } else {
      orderData.from = 'system';
      console.log("✅ 'from' field set to default 'system'");
    }
    
    console.log("═══════════════════════════════════════════════════════════");
    console.log("📋 'FROM' FIELD SET IN orderData:");
    console.log("   🔹 from (processed):", from);
    console.log("   🔹 fromNormalized:", fromNormalized);
    console.log("   🔹 isDelivery:", isDelivery);
    console.log("   🔹 orderData.from:", orderData.from);
    console.log("   🔹 Expected for ecommerce: 'delivery'");
    console.log("═══════════════════════════════════════════════════════════");
    
    // Save discount fields (but don't apply to totalAmount)
    // Convert to numbers to ensure proper type
    if (discountAmount !== undefined && discountAmount !== null) {
      orderData.discountAmount = Number(discountAmount) || 0;
    }
    if (discountPercentage !== undefined && discountPercentage !== null) {
      orderData.discountPercentage = Number(discountPercentage) || 0;
    }
    if (discountType !== undefined && discountType !== null) {
      orderData.discountType = String(discountType);
    }
    if (discount !== undefined && discount !== null) {
      orderData.discount = Number(discount) || 0;
    }
    
    console.log('💾 Saving discount fields:', {
      discountAmount: orderData.discountAmount,
      discountPercentage: orderData.discountPercentage,
      discountType: orderData.discountType,
      discountAmountType: typeof orderData.discountAmount,
      discountPercentageType: typeof orderData.discountPercentage
    });
    
    orderData.customerName = customerName || "Walk-in Customer";
    
    // Set customerAddress from request body if provided, otherwise will be populated from customer
    if (bodyCustomerAddress && bodyCustomerAddress.trim()) {
      orderData.customerAddress = bodyCustomerAddress.trim();
    }

    let finalCustomerId = null;

    if (customerId) {
      finalCustomerId = customerId;
      orderData.customerId = customerId;
      // Fetch customer address if customerId is provided and address not already set from body
      if (!orderData.customerAddress) {
        const customer = await Customer.findById(customerId);
        if (customer && customer.address) {
          orderData.customerAddress = customer.address;
        }
      }
    } else if (customerName) {
      // Try to find existing customer by name
      // Use finalRestaurantId instead of restaurantId from body (which might be empty)
      let customer = await Customer.findOne({
        name: customerName,
        restaurantId: finalRestaurantId
      });

      if (!customer && customerName !== 'Walk-in Customer') {
        // Only create customer if restaurantId is valid and not empty
        if (!finalRestaurantId || (typeof finalRestaurantId === 'string' && finalRestaurantId.trim() === '')) {
          console.error('⚠️ Cannot create customer: restaurantId is empty or invalid');
          console.error('   finalRestaurantId:', finalRestaurantId);
          return res.status(400).json({
            success: false,
            message: "Restaurant ID is required to create customer. Please set RESTAURANT_ID in backend .env file."
          });
        }
        
        // Validate that restaurantId is a valid MongoDB ObjectId format
        if (!mongoose.Types.ObjectId.isValid(finalRestaurantId)) {
          console.error('⚠️ Cannot create customer: restaurantId is not a valid ObjectId');
          console.error('   finalRestaurantId:', finalRestaurantId, 'Type:', typeof finalRestaurantId);
          return res.status(400).json({
            success: false,
            message: `Invalid Restaurant ID format: "${finalRestaurantId}". It must be a valid MongoDB ObjectId.`
          });
        }
        
        console.log('✅ Creating new customer with restaurantId:', finalRestaurantId);
        customer = new Customer({
          name: customerName,
          restaurantId: finalRestaurantId,
          address: bodyCustomerAddress && bodyCustomerAddress.trim() ? bodyCustomerAddress.trim() : undefined,
        });
        await customer.save();
        console.log('✅ Customer created successfully:', customer._id);
      }

      if (customer) {
        finalCustomerId = customer._id;
        orderData.customerId = customer._id;
        // Use address from request body if provided, otherwise use customer's existing address
        if (bodyCustomerAddress && bodyCustomerAddress.trim()) {
          orderData.customerAddress = bodyCustomerAddress.trim();
          // Also update customer's address if it was provided
          if (!customer.address || customer.address !== bodyCustomerAddress.trim()) {
            customer.address = bodyCustomerAddress.trim();
            await customer.save();
          }
        } else if (customer.address && !orderData.customerAddress) {
          orderData.customerAddress = customer.address;
        }
      }
    }

    // CRITICAL: Check if this is an ecommerce order (from: 'delivery')
    // Ecommerce orders MUST ALWAYS create a new order, NEVER merge with existing orders
    // Check both the request body 'from' and orderData.from to ensure we catch it
    const fromRequest = from ? from.toString().trim().toLowerCase() : '';
    const fromOrderData = orderData.from ? orderData.from.toString().trim().toLowerCase() : '';
    const isEcommerceOrder = fromRequest === 'delivery' || fromOrderData === 'delivery';
    
    console.log("═══════════════════════════════════════════════════════════");
    console.log("📋 ECOMMERCE ORDER DETECTION:");
    console.log("   🔹 from (request):", from, "→ normalized:", fromRequest);
    console.log("   🔹 orderData.from:", orderData.from, "→ normalized:", fromOrderData);
    console.log("   🔹 isEcommerceOrder:", isEcommerceOrder);
    console.log("═══════════════════════════════════════════════════════════");
    
    console.log("═══════════════════════════════════════════════════════════");
    console.log("📋 ORDER CREATION CHECK:");
    console.log("   🔹 from field (raw):", from);
    console.log("   🔹 from field (type):", typeof from);
    console.log("   🔹 from field (trimmed):", from ? from.toString().trim() : 'undefined');
    console.log("   🔹 isEcommerceOrder:", isEcommerceOrder);
    console.log("   🔹 finalCustomerId:", finalCustomerId);
    console.log("   🔹 tableNumber:", tableNumber);
    console.log("═══════════════════════════════════════════════════════════");
    
    if (isEcommerceOrder) {
      console.log("🛒 ✅ ECOMMERCE ORDER DETECTED (from: 'delivery')");
      console.log("🚫 EXISTING ORDER CHECK WILL BE SKIPPED");
      console.log("✅ WILL ALWAYS CREATE A BRAND NEW ORDER");
      console.log("❌ WILL NEVER MERGE WITH EXISTING ORDERS");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    } else {
      console.log("🏪 POS/KOT ORDER DETECTED (from: '" + (from || 'system') + "')");
      console.log("✅ Will check for existing orders and merge if found");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    }
    
    // ============================================================================
    // ABSOLUTE SAFEGUARD: If ecommerce order, NEVER check for existing orders
    // ============================================================================
    // Use explicit boolean to prevent any accidental execution
    const shouldCheckExistingOrder = !isEcommerceOrder && finalCustomerId && tableNumber;
    
    if (isEcommerceOrder) {
      console.log("🔒🔒🔒 SAFEGUARD ACTIVATED: Ecommerce order detected - existing order check BLOCKED 🔒🔒🔒");
    }
    
    // CRITICAL: For ecommerce orders (from: 'delivery'), COMPLETELY SKIP existing order check
    // This ensures EVERY ecommerce order creates a NEW order, NEVER merges with existing
    // Only check for existing orders if this is NOT an ecommerce order
    if (shouldCheckExistingOrder) {
      console.log("🏪 POS/KOT ORDER DETECTED - Checking for existing order to merge...");
      const existingPendingOrder = await Order.findOne({
        customerId: finalCustomerId,
        restaurantId: finalRestaurantId,
        tableNumber: tableNumber, // Also check table number
        status: { $nin: ['completed', 'cancelled'] } // Order should not be completed or cancelled
      }).sort({ createdAt: -1 }); // Get the most recent pending order

      if (existingPendingOrder) {
        console.log("Found existing order (not completed/cancelled):", existingPendingOrder._id);
        console.log("Existing order status:", existingPendingOrder.status);
        console.log("Existing order table number:", existingPendingOrder.tableNumber);
        console.log("New order table number:", tableNumber);
        console.log("Existing order items:", existingPendingOrder.items.length);
        console.log("New cart items to update:", items.length);

        // Smart merge logic:
        // 1. If item exists with same quantity → skip (don't add)
        // 2. If item doesn't exist → add new item
        // 3. If item exists but quantity is different → update quantity

        // First, deduplicate cart items by combining same items
        // This ensures we process unique items only
        const deduplicatedCartMap = new Map();
        items.forEach(cartItem => {
          // Convert ObjectId to string for consistent comparison
          const itemIdStr = cartItem.itemId?.toString() || cartItem.itemId;
          const subcatIdStr = cartItem.selectedSubcategoryId?.toString() || cartItem.selectedSubcategoryId || 'null';
          const sizeIdStr = cartItem.sizeId?.toString() || cartItem.sizeId || 'null';
          const itemKey = `${itemIdStr}_${subcatIdStr}_${sizeIdStr}`;
          
          const existingCartItem = deduplicatedCartMap.get(itemKey);
          
          if (existingCartItem) {
            // Same item in cart - combine quantities
            existingCartItem.quantity = (existingCartItem.quantity || 1) + (cartItem.quantity || 1);
          } else {
            // New item in cart
            deduplicatedCartMap.set(itemKey, {
              ...cartItem,
              quantity: cartItem.quantity || 1
            });
          }
        });

        // Convert deduplicated cart to array
        const deduplicatedCartItems = Array.from(deduplicatedCartMap.values());
        console.log(`\n📦 Cart deduplication: ${items.length} items → ${deduplicatedCartItems.length} unique items`);
        deduplicatedCartItems.forEach(item => {
          console.log(`   Cart item: ${item.itemName} - Qty: ${item.quantity} - ID: ${item.itemId?.toString() || item.itemId}`);
        });

        // First, deduplicate existing order items by combining same items
        // This ensures we don't have duplicates in existing order
        const existingItemsDedupMap = new Map();
        existingPendingOrder.items.forEach(item => {
          // Convert ObjectId to string for consistent comparison
          const itemIdStr = item.itemId?.toString() || item.itemId;
          const subcatIdStr = item.selectedSubcategoryId?.toString() || item.selectedSubcategoryId || 'null';
          const sizeIdStr = item.sizeId?.toString() || item.sizeId || 'null';
          const itemKey = `${itemIdStr}_${subcatIdStr}_${sizeIdStr}`;
          
          const existingItem = existingItemsDedupMap.get(itemKey);
          
          if (existingItem) {
            // Same item exists - combine quantities
            existingItem.quantity = (existingItem.quantity || 1) + (item.quantity || 1);
            existingItem.subtotal = existingItem.price * existingItem.quantity;
          } else {
            // New item in existing order
            const itemObj = item.toObject ? item.toObject() : item;
            existingItemsDedupMap.set(itemKey, {
              ...itemObj,
              quantity: item.quantity || 1
            });
          }
        });

        // Replace existing items array with deduplicated items
        existingPendingOrder.items = Array.from(existingItemsDedupMap.values());
        console.log(`Existing order items after deduplication: ${existingPendingOrder.items.length}`);

        // Create a map of deduplicated existing items for quick lookup
        // Key: itemId + selectedSubcategoryId + sizeId
        const existingItemsMap = new Map();
        existingPendingOrder.items.forEach(item => {
          // Convert ObjectId to string for consistent comparison
          const itemIdStr = String(item.itemId?.toString() || item.itemId || '');
          const subcatIdStr = String(item.selectedSubcategoryId?.toString() || item.selectedSubcategoryId || 'null');
          const sizeIdStr = String(item.sizeId?.toString() || item.sizeId || 'null');
          const itemKey = `${itemIdStr}_${subcatIdStr}_${sizeIdStr}`;
          existingItemsMap.set(itemKey, item);
          console.log(`   📋 Added to existing map: ${item.itemName || 'Unknown'} - Key: ${itemKey} - Qty: ${item.quantity}`);
        });
        
        console.log(`\n📊 Existing order items map created with ${existingItemsMap.size} unique items`);

        // Track items that need inventory deduction
        const itemsToDeduct = [];

        // Process deduplicated cart items
        // Logic (itemKey = itemId + selectedSubcategoryId + sizeId):
        // 1. If same item + same size + same quantity → Skip (don't add/update)
        // 2. If same item + same quantity + different size → Add as new item (different itemKey)
        // 3. If same item + same size + different quantity → Update quantity
        // 4. If different item → Add as new item
        for (const newItem of deduplicatedCartItems) {
          // Convert ObjectId to string for consistent comparison
          const itemIdStr = String(newItem.itemId?.toString() || newItem.itemId || '');
          const subcatIdStr = String(newItem.selectedSubcategoryId?.toString() || newItem.selectedSubcategoryId || 'null');
          const sizeIdStr = String(newItem.sizeId?.toString() || newItem.sizeId || 'null');
          const itemKey = `${itemIdStr}_${subcatIdStr}_${sizeIdStr}`; // Includes sizeId for size comparison
          
          const newQuantity = Number(newItem.quantity) || 1;
          const newPrice = Number(newItem.price || newItem.adjustedPrice) || 0;
          const newSize = newItem.size || newItem.selectedSize || null;

          // Debug logging
          console.log(`\n🔍 Processing cart item: ${newItem.itemName}`);
          console.log(`   ItemKey (itemId_subcatId_sizeId): ${itemKey}`);
          console.log(`   Size: ${newSize || 'No size'} | SizeId: ${sizeIdStr}`);
          console.log(`   New Quantity: ${newQuantity}`);
          console.log(`   Existing items in map: ${existingItemsMap.size}`);

          const existingItem = existingItemsMap.get(itemKey);

          if (existingItem) {
            // ItemKey matches = same item + same size (because sizeId is in itemKey)
            // Now check quantity
            const oldQuantity = Number(existingItem.quantity) || 1;
            const oldSize = existingItem.size || null;
            
            console.log(`   ✅ Item found in existing order (same item + same size)`);
            console.log(`   Old Size: ${oldSize || 'No size'} | Old Quantity: ${oldQuantity}`);
            console.log(`   New Size: ${newSize || 'No size'} | New Quantity: ${newQuantity}`);
            console.log(`   Quantities match: ${oldQuantity === newQuantity}`);
            
            // Case 1: Same item + same size + same quantity → Skip
            if (oldQuantity === newQuantity) {
              console.log(`   ⏭️ SKIPPING: Same item + same size + same quantity - no changes needed`);
              continue; // Skip this item completely - don't add, don't update
            } else {
              // Case 3: Same item + same size + different quantity → Update quantity
              console.log(`   🔄 UPDATING: Same item + same size, but quantity changed from ${oldQuantity} to ${newQuantity}`);
              existingItem.quantity = newQuantity;
              existingItem.price = newPrice; // Update price in case it changed
              existingItem.subtotal = newPrice * newQuantity;
              existingItem.taxAmount = Number(newItem.taxAmount) || 0;
              existingItem.taxPercentage = Number(newItem.taxPercentage) || 0;
              // Update size if provided (should be same, but update just in case)
              if (newSize) {
                existingItem.size = newSize;
              }
              if (newItem.sizeId) {
                existingItem.sizeId = newItem.sizeId;
              }
              
              // Track for inventory deduction (only if quantity increased)
              const quantityDifference = newQuantity - oldQuantity;
              if (quantityDifference > 0) {
                itemsToDeduct.push({
                  ...newItem,
                  quantity: quantityDifference // Only deduct the difference
                });
              }
              // Note: If quantity decreased, we're not restoring inventory here
              // In production, you might want to restore inventory for decreased quantities
            }
          } else {
            // ItemKey doesn't match = different item OR different size
            // Case 2: Same item + same quantity + different size → Add as new item
            // Case 4: Different item → Add as new item
            console.log(`   ➕ ADDING: Item not found in existing order (different item or different size)`);
            console.log(`   Size: ${newSize || 'No size'} | Quantity: ${newQuantity}`);
            const newItemToAdd = {
              itemId: newItem.itemId,
              itemName: newItem.itemName,
              price: newPrice,
              quantity: newQuantity,
              selectedSubcategoryId: newItem.selectedSubcategoryId || null,
              sizeId: newItem.sizeId || null,
              size: newSize,
              subtotal: newPrice * newQuantity,
              taxPercentage: Number(newItem.taxPercentage) || 0,
              taxAmount: Number(newItem.taxAmount) || 0
            };
            
            existingPendingOrder.items.push(newItemToAdd);
            
            // Add to map immediately so if same item appears again in same batch, it won't be duplicated
            existingItemsMap.set(itemKey, newItemToAdd);
            
            // Track for inventory deduction
            itemsToDeduct.push(newItem);
          }
        }

        // Also remove items from existing order that are not in new cart
        // (optional - if you want to remove items that were removed from cart)
        // For now, we'll keep this commented out as user didn't mention removing items
        // existingPendingOrder.items = existingPendingOrder.items.filter(existingItem => {
        //   const itemKey = `${existingItem.itemId}_${existingItem.selectedSubcategoryId || 'null'}_${existingItem.sizeId || 'null'}`;
        //   return items.some(newItem => {
        //     const newItemKey = `${newItem.itemId}_${newItem.selectedSubcategoryId || 'null'}_${newItem.sizeId || 'null'}`;
        //     return itemKey === newItemKey;
        //   });
        // });

        // Recalculate totals from updated items array
        const newSubtotal = existingPendingOrder.items.reduce((sum, item) => sum + item.subtotal, 0);
        const newTax = existingPendingOrder.items.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
        
        // Update order totals
        existingPendingOrder.subtotal = newSubtotal;
        existingPendingOrder.tax = newTax;
        
        // Apply discount if exists (use discountAmount field if available, else calculate from discount percentage)
        const discountAmt = existingPendingOrder.discountAmount || 
          (existingPendingOrder.discountPercentage 
            ? (newSubtotal * existingPendingOrder.discountPercentage) / 100 
            : (existingPendingOrder.discount 
              ? (newSubtotal * existingPendingOrder.discount) / 100 
              : 0));
        
        const sysCharge = existingPendingOrder.systemCharge || 0;
        const roundOffVal = existingPendingOrder.roundOff || 0;
        
        existingPendingOrder.totalAmount = Math.max(0, newSubtotal - discountAmt + newTax + sysCharge + roundOffVal);

        // Update other fields if provided
        if (kotGenerated !== undefined) existingPendingOrder.kotGenerated = kotGenerated;
        if (tableNumber) existingPendingOrder.tableNumber = tableNumber;
        if (orderType) existingPendingOrder.orderType = orderType;
        if (paymentStatus) existingPendingOrder.paymentStatus = paymentStatus;

        // Save updated order
        const updatedOrder = await existingPendingOrder.save();
        console.log("Order updated successfully with new cart items:", updatedOrder._id);

        // Deduct inventory only for new items or quantity differences
        // Items with same quantity are skipped (already deducted)
        if (itemsToDeduct.length > 0) {
          try {
            const { deductInventory } = require("../services/InventoryService");
            
            const inventoryResult = await deductInventory(
              itemsToDeduct, 
              finalRestaurantId, 
              updatedOrder._id, 
              'order'
            );
          
          if (!inventoryResult.success) {
            console.error("Inventory deduction failed for order update:", inventoryResult.errors);
          }
          
            if (inventoryResult.warnings.length > 0) {
              console.warn("Inventory deduction warnings for order update:", inventoryResult.warnings);
            }
            
          } catch (inventoryError) {
            console.error("Error deducting inventory for order update:", inventoryError);
          }
        } else {
          console.log("No inventory deduction needed - all items have same quantity or are already present");
        }

        // Credit reward points only for new items or quantity differences
        if (finalCustomerId && itemsToDeduct.length > 0) {
          try {
            const Menu = require("../model/Menu");
            
            let totalRewardPoints = 0;
            
            for (const item of itemsToDeduct) {
              const menuItem = await Menu.findById(item.itemId);
              if (menuItem && menuItem.rewardPoints) {
                totalRewardPoints += menuItem.rewardPoints * (item.quantity || 1);
              }
            }
            
            if (totalRewardPoints > 0) {
              await Customer.findByIdAndUpdate(
                finalCustomerId,
                { $inc: { earnedPoints: totalRewardPoints } },
                { new: true }
              );
              
              console.log(`Credited ${totalRewardPoints} reward points to customer ${finalCustomerId}`);
            }
          } catch (rewardError) {
            console.error("Error crediting reward points:", rewardError);
          }
        }

        await updatedOrder.populate("customerId", "name email");
        if (updatedOrder.deliveryId) {
          await updatedOrder.populate("deliveryId", "deliveryPerson status");
        }

        console.log("=== ORDER UPDATED SUCCESSFULLY ===");
        return res.status(200).json({
          success: true,
          message: "Order updated successfully (items merged with existing order)",
          data: updatedOrder,
          order: updatedOrder
        });
      }
    } else {
      // This block executes when:
      // 1. isEcommerceOrder is true (ecommerce order) - existing check was skipped
      // 2. OR isEcommerceOrder is false but no existing order found or conditions not met
      if (isEcommerceOrder) {
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("🛒 ECOMMERCE ORDER FLOW:");
        console.log("   ✅ Existing order check was SKIPPED (as intended)");
        console.log("   ✅ Proceeding to create BRAND NEW order");
        console.log("   ❌ NO MERGING will occur - this is a separate order");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      } else {
        console.log("✅ No existing order found or conditions not met - proceeding to create NEW order");
      }
    }

    // Process items array to ensure size field is properly set
    if (orderData.items && Array.isArray(orderData.items)) {
      orderData.items = orderData.items.map(item => {
        // Convert selectedSize to size if size is not present
        if (!item.size && item.selectedSize) {
          item.size = item.selectedSize;
        }
        // Ensure sizeId is properly set
        if (!item.sizeId && item.sizeId === undefined) {
          item.sizeId = null;
        }
        return item;
      });
    }

    // Add additional fields if provided
    if (deliveryId) orderData.deliveryId = deliveryId;
    if (orderType) orderData.orderType = orderType;
    if (tax !== undefined) orderData.tax = tax;
    if (discount !== undefined) orderData.discount = Number(discount) || 0;
    // Note: discountAmount, discountPercentage, and discountType are already set above (lines 81-92)
    // Don't overwrite them here
    if (subtotal !== undefined) orderData.subtotal = Number(subtotal) || 0;
    if (kotGenerated !== undefined) orderData.kotGenerated = kotGenerated;
    if (paymentStatus) orderData.paymentStatus = paymentStatus;
    
    // CRITICAL: Ensure 'from' field is explicitly set (don't rely on model default)
    // This is especially important for ecommerce orders
    if (from && from.toString().trim()) {
      orderData.from = from.toString().trim();
      console.log("✅ 'from' field explicitly set in orderData:", orderData.from);
    } else if (isEcommerceOrder) {
      // Safety check: If we detected ecommerce order but 'from' is missing, set it explicitly
      orderData.from = 'delivery';
      console.log("⚠️ 'from' field was missing but ecommerce order detected - setting to 'delivery'");
    } else {
      orderData.from = 'system';
      console.log("✅ 'from' field set to default 'system'");
    }

    console.log("═══════════════════════════════════════════════════════════");
    if (isEcommerceOrder) {
      console.log("🛒 CREATING NEW ECOMMERCE ORDER (from: 'delivery')");
      console.log("   ✅ This will ALWAYS create a NEW order, never merge with existing");
    } else {
      console.log("🏪 CREATING NEW ORDER (from: '" + (from || 'system') + "')");
    }
    console.log("═══════════════════════════════════════════════════════════");
    console.log("Final order data before saving:", JSON.stringify(orderData, null, 2));
    console.log("💾 Discount fields in orderData before creating Order:", {
      discountAmount: orderData.discountAmount,
      discountPercentage: orderData.discountPercentage,
      discountType: orderData.discountType,
      discount: orderData.discount
    });

    // FINAL VERIFICATION: Before creating Order instance, ensure 'from' field is correct
    console.log("═══════════════════════════════════════════════════════════");
    console.log("🔍 PRE-INSTANCE VERIFICATION:");
    console.log("   🔹 orderData.from:", orderData.from);
    console.log("   🔹 isEcommerceOrder:", isEcommerceOrder);
    console.log("   🔹 Request body 'from':", from);
    if (isEcommerceOrder) {
      console.log("   ✅ Ecommerce order - 'from' MUST be 'delivery'");
      // Force set to 'delivery' if ecommerce order
      if (orderData.from !== 'delivery') {
        console.log("   ⚠️ WARNING: orderData.from is not 'delivery' - correcting it now!");
        orderData.from = 'delivery';
      }
    }
    console.log("═══════════════════════════════════════════════════════════");
    
    const order = new Order(orderData);
    console.log("Order instance created, attempting to save...");
    
    // CRITICAL: Verify and FORCE SET 'from' field in Order instance BEFORE saving
    console.log("═══════════════════════════════════════════════════════════");
    console.log("🔍 ORDER INSTANCE 'FROM' FIELD VERIFICATION:");
    console.log("   🔹 order.from (immediately after new Order()):", order.from);
    console.log("   🔹 orderData.from:", orderData.from);
    console.log("   🔹 isEcommerceOrder:", isEcommerceOrder);
    console.log("═══════════════════════════════════════════════════════════");
    
    // FORCE SET: If ecommerce order OR isDelivery, ensure 'from' is 'delivery' in Order instance
    // Use both isEcommerceOrder AND isDelivery checks for maximum safety
    if (isEcommerceOrder || isDelivery) {
      order.from = 'delivery';
      console.log("✅✅✅ FORCED: order.from = 'delivery' for ecommerce order ✅✅✅");
      console.log("   🔹 isEcommerceOrder:", isEcommerceOrder);
      console.log("   🔹 isDelivery:", isDelivery);
      console.log("   🔹 order.from after force set:", order.from);
    } else if (!order.from) {
      order.from = orderData.from || 'system';
      console.log("✅ Set order.from to:", order.from);
    }
    
    // Final verification before save - use BOTH checks
    console.log("🔍 Final check - order.from before save:", order.from);
    if ((isEcommerceOrder || isDelivery) && order.from !== 'delivery') {
      console.error("❌❌❌ CRITICAL ERROR: Order instance 'from' is STILL NOT 'delivery'!");
      console.error("   🔹 isEcommerceOrder:", isEcommerceOrder);
      console.error("   🔹 isDelivery:", isDelivery);
      console.error("   🔹 Forcing again...");
      order.from = 'delivery';
      console.log("   ✅ Forced order.from = 'delivery'");
    }
    console.log("═══════════════════════════════════════════════════════════");
    
    console.log("💾 Discount fields in order instance:", {
      discountAmount: order.discountAmount,
      discountPercentage: order.discountPercentage,
      discountType: order.discountType,
      discount: order.discount
    });
    
    // FINAL CHECK: Before saving, ensure 'from' field is correct
    console.log("═══════════════════════════════════════════════════════════");
    console.log("🔍 FINAL PRE-SAVE CHECK:");
    console.log("   🔹 order.from (before save):", order.from);
    console.log("   🔹 orderData.from:", orderData.from);
    console.log("   🔹 isEcommerceOrder:", isEcommerceOrder);
    console.log("   🔹 isDelivery:", isDelivery);
    
    // ABSOLUTE FINAL FORCE: If ecommerce order, force 'from' to 'delivery'
    if (isEcommerceOrder || isDelivery) {
      order.from = 'delivery';
      orderData.from = 'delivery';
      console.log("🔒🔒🔒 ABSOLUTE FINAL FORCE: order.from = 'delivery' 🔒🔒🔒");
    }
    console.log("   🔹 order.from (after final force):", order.from);
    console.log("═══════════════════════════════════════════════════════════");
    
    const savedOrder = await order.save();
    console.log("═══════════════════════════════════════════════════════════");
    if (isEcommerceOrder || isDelivery) {
      console.log("🛒 ✅ NEW ECOMMERCE ORDER CREATED SUCCESSFULLY!");
      console.log("   📦 Order ID:", savedOrder._id);
      console.log("   📋 Order ID (readable):", savedOrder.orderId);
      console.log("   🔹 from (SAVED IN DB):", savedOrder.from);
      console.log("   🔹 from === 'delivery':", savedOrder.from === 'delivery' ? '✅✅✅ CORRECT ✅✅✅' : '❌❌❌ WRONG! ❌❌❌');
      console.log("   📊 Items count:", savedOrder.items.length);
      console.log("   💰 Total Amount:", savedOrder.totalAmount);
      console.log("   ✅ This is a BRAND NEW order, not merged with any existing order");
      
      // CRITICAL VERIFICATION: Check if 'from' field was saved correctly
      if (savedOrder.from !== 'delivery') {
        console.error("═══════════════════════════════════════════════════════════");
        console.error("❌❌❌❌❌ CRITICAL ERROR ❌❌❌❌❌");
        console.error("'from' field is NOT 'delivery' in saved order!");
        console.error("   🔹 Expected: 'delivery'");
        console.error("   🔹 Actual:", savedOrder.from);
        console.error("   🔹 This should NOT happen for ecommerce orders!");
        console.error("═══════════════════════════════════════════════════════════");
        
        // Try to update it directly
        try {
          savedOrder.from = 'delivery';
          await savedOrder.save();
          console.log("✅✅✅ Fixed: Updated 'from' field to 'delivery' after save");
        } catch (updateError) {
          console.error("❌ Failed to update 'from' field:", updateError);
        }
      } else {
        console.log("✅✅✅ SUCCESS: 'from' field is correctly set to 'delivery' in database! ✅✅✅");
      }
    } else {
      console.log("✅ NEW ORDER CREATED SUCCESSFULLY!");
      console.log("   📦 Order ID:", savedOrder._id);
      console.log("   📋 Order ID (readable):", savedOrder.orderId);
      console.log("   🔹 from:", savedOrder.from);
    }
    console.log("💾 Discount fields in saved order:", {
      discountAmount: savedOrder.discountAmount,
      discountPercentage: savedOrder.discountPercentage,
      discountType: savedOrder.discountType,
      discount: savedOrder.discount
    });
    console.log("═══════════════════════════════════════════════════════════");

    await order.populate("customerId", "name email");
    if (order.deliveryId) {
      await order.populate("deliveryId", "deliveryPerson status");
    }

    // Deduct inventory for all items in the order
    try {
      const { deductInventory } = require("../services/InventoryService");
      
      const inventoryResult = await deductInventory(
        items, 
        orderData.restaurantId, 
        savedOrder._id, 
        'order'
      );
      
      if (!inventoryResult.success) {
        console.error("Inventory deduction failed for order:", inventoryResult.errors);
        // You might want to handle this case differently based on business requirements
      }
      
      if (inventoryResult.warnings.length > 0) {
        console.warn("Inventory deduction warnings for order:", inventoryResult.warnings);
      }
      
    } catch (inventoryError) {
      console.error("Error deducting inventory for order:", inventoryError);
      // Don't fail the order if inventory deduction fails
      // You might want to handle this differently based on business requirements
    }

    // Credit reward points to customer if customerId is provided
    if (orderData.customerId) {
      try {
        const Menu = require("../model/Menu");
        const Customer = require("../model/Customer");
        
        // Calculate total reward points from all items in the order
        let totalRewardPoints = 0;
        
        for (const item of items) {
          // Find the menu item to get its reward points
          const menuItem = await Menu.findById(item.itemId);
          if (menuItem && menuItem.rewardPoints) {
            totalRewardPoints += menuItem.rewardPoints * item.quantity;
          }
        }
        
        // Update customer's earned points if there are reward points to credit
        if (totalRewardPoints > 0) {
          await Customer.findByIdAndUpdate(
            orderData.customerId,
            { $inc: { earnedPoints: totalRewardPoints } },
            { new: true }
          );
          
          console.log(`Credited ${totalRewardPoints} reward points to customer ${orderData.customerId}`);
        }
      } catch (rewardError) {
        console.error("Error crediting reward points:", rewardError);
        // Don't fail the order if reward points fail
      }
    }

    console.log("=== ORDER CREATION COMPLETED ===");
    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: savedOrder,
      order: savedOrder // Add this for frontend compatibility
    });
  } catch (err) {
    console.error("=== ORDER CREATION FAILED ===");
    console.error("Error creating order:", err);
    console.error("Error details:", {
      name: err.name,
      message: err.message,
      code: err.code,
      errors: err.errors
    });
    
    // Handle specific validation errors
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    console.log("=== FETCHING ALL ORDERS ===");
    console.log("User from auth middleware:", req.user);
    
    // 🔥 NOTE: .env RESTAURANT_ID is NOT used in order fetch routes (as per requirement)
    // Authorized route - req.userId से restaurantId fetch करते हैं (authMiddleware से आती है)
    // Priority: req.userId (from auth middleware) > query.restaurantId
    const restaurantId = req.userId || req.query.restaurantId;
    
    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: "Restaurant ID is required. Please authenticate or provide restaurantId in query parameter."
      });
    }
    
    console.log("🔍 Fetching orders with restaurantId:", restaurantId);
    console.log("🔍 Source: req.userId=", req.userId, "query.restaurantId=", req.query.restaurantId);
    console.log("🔍✅✅✅ .env RESTAURANT_ID IS NOT USED IN ORDER FETCH ROUTES (as per requirement)");
    
    let query = { restaurantId };
    
    console.log("Query filter:", query);
    
    const orders = await Order.find(query)
      .populate("customerId", "name email address")
      .populate("deliveryId", "deliveryPerson status")
      .populate("restaurantId", "username email")
      .populate("userId", "username email")
      .sort({ createdAt: -1 });
    
    console.log(`Found ${orders.length} orders`);
    
    // Update orders that don't have customerAddress but have customerId with address
    for (let order of orders) {
      if (!order.customerAddress && order.customerId && order.customerId.address) {
        order.customerAddress = order.customerId.address;
        await order.save();
      }
    }
    
    res.json({
      success: true,
      data: orders,
      orders: orders,
      count: orders.length
    });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// Public API to get orders by restaurantId (for customer menu)
exports.getPublicOrders = async (req, res) => {
  try {
    console.log("=== FETCHING PUBLIC ORDERS ===");
    
    // 🔥 NOTE: .env RESTAURANT_ID is NOT used in order fetch routes (as per requirement)
    // Public route - query.restaurantId से restaurantId fetch करते हैं
    // Priority: query.restaurantId only
    const restaurantId = req.query.restaurantId;
    
    console.log("🔍 Fetching public orders with restaurantId:", restaurantId);
    console.log("🔍 Source: query.restaurantId=", req.query.restaurantId);
    console.log("🔍✅✅✅ .env RESTAURANT_ID IS NOT USED IN ORDER FETCH ROUTES (as per requirement)");
    
    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: "restaurantId is required. Please provide restaurantId in query parameter."
      });
    }
    
    let query = { restaurantId };
    
    // Optional: Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    console.log("Query filter:", query);
    
    const orders = await Order.find(query)
      .populate("customerId", "name email address")
      .populate("deliveryId", "deliveryPerson status")
      .sort({ createdAt: -1 });
    
    console.log(`Found ${orders.length} public orders`);
    
    res.json({
      success: true,
      data: orders,
      orders: orders,
      count: orders.length
    });
  } catch (err) {
    console.error("Error fetching public orders:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

exports.getActiveTables = async (req, res) => {
  try {
    // 🔥 ALWAYS use req.userId (which is user.restaurantId from user collection)
    const restaurantId = req.userId;

    if (!restaurantId) {
      return res.status(400).json({ message: 'restaurantId is required' });
    }

    // Define "active" statuses
    const activeStatuses = ["pending", "confirmed", "preparing", "ready", "served"];

    // Fetch active orders for this restaurant
    const activeOrders = await Order.find({
      restaurantId,
      status: { $in: activeStatuses },
    }).sort({ createdAt: 1 }); // Optional: sort by time

    // Combine orders by tableNumber
    const combinedTables = {};
    activeOrders.forEach(order => {
      if (!combinedTables[order.tableNumber]) {
        combinedTables[order.tableNumber] = [];
      }
      combinedTables[order.tableNumber].push(order);
    });

    res.status(200).json({ combinedTables });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
exports.getCombinedOrders = async (req, res) => {
  try {
    const { restaurantId } = req.query
    const { tableNumbers } = req.body

    if (!restaurantId || !tableNumbers || !Array.isArray(tableNumbers)) {
      return res.status(400).json({ error: 'Restaurant ID and table numbers are required' })
    }

    const orders = await Order.find({
      restaurantId,
      tableNumber: { $in: tableNumbers },
      status: { $ne: 'cancelled' }
    })
      .populate('items.itemId')
      .populate('customerId', 'name email address')

    return res.status(200).json({ success: true, orders })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch combined orders' })
  }
}
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customerId", "name email address")
      .populate("deliveryId", "deliveryPerson status");

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Update order if it doesn't have customerAddress but has customerId with address
    if (!order.customerAddress && order.customerId && order.customerId.address) {
      order.customerAddress = order.customerId.address;
      await order.save();
    }

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status enum values
    const validStatuses = ["pending", "confirmed", "preparing", "ready", "served", "completed", "cancelled"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid status value",
        error: `Status must be one of: ${validStatuses.join(", ")}. Received: ${status}`
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, message: "Order status updated successfully", data: order });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationErrors
      });
    }
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      subtotal,
      discountAmount,
      discountPercentage,
      discountType,
      taxAmount,
      taxPercentage,
      taxType,
      systemCharge,
      roundOff,
      totalAmount,
    } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Check if user has permission to update this order
    if (order.restaurantId.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized to update this order" });
    }

    // Update subtotal if provided (for discount application)
    if (subtotal !== undefined) {
      order.subtotal = Number(subtotal) || 0;
    }

    // Update discount fields if provided
    if (discountAmount !== undefined) {
      order.discountAmount = Number(discountAmount) || 0;
    }
    if (discountPercentage !== undefined) {
      order.discountPercentage = Number(discountPercentage) || 0;
    }
    if (discountType !== undefined) {
      order.discountType = discountType;
    }

    // Update tax fields if provided
    if (taxAmount !== undefined) {
      order.taxAmount = Number(taxAmount) || 0;
    }
    if (taxPercentage !== undefined) {
      order.taxPercentage = Number(taxPercentage) || 0;
    }
    if (taxType !== undefined) {
      order.taxType = taxType;
    }

    // Update other fields
    if (systemCharge !== undefined) {
      order.systemCharge = Number(systemCharge) || 0;
    }
    if (roundOff !== undefined) {
      order.roundOff = Number(roundOff) || 0;
    }

    // Update totalAmount if explicitly provided
    if (totalAmount !== undefined) {
      order.totalAmount = Number(totalAmount) || 0;
    } else {
      // Recalculate totalAmount
      // If subtotal is provided (discount के बाद), use it directly
      // Otherwise calculate from original subtotal
      const currentSubtotal = order.subtotal || 0;
      const discountAmt = order.discountAmount || 0;
      const taxAmt = order.taxAmount || 0;
      const sysCharge = order.systemCharge || 0;
      const roundOffVal = order.roundOff || 0;
      
      // If subtotal was updated (discount के बाद का amount), use it as totalAmount
      // Otherwise calculate: original subtotal - discount + tax + charges
      if (subtotal !== undefined) {
        // Subtotal was explicitly set (discount के बाद का amount), use it as totalAmount
        order.totalAmount = Number(subtotal) || 0;
      } else {
        // Calculate from original subtotal
        order.totalAmount = Math.max(0, currentSubtotal - discountAmt + taxAmt + sysCharge + roundOffVal);
      }
    }

    const updatedOrder = await order.save();

    res.json({
      success: true,
      message: "Order updated successfully",
      data: updatedOrder
    });
  } catch (err) {
    console.error("Error updating order:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    res.json({ success: true, message: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Test endpoint to check database connection and order collection
exports.testOrderConnection = async (req, res) => {
  try {
    console.log("=== TESTING ORDER CONNECTION ===");
    
    // Test database connection
    const mongoose = require('mongoose');
    const connectionState = mongoose.connection.readyState;
    console.log("Mongoose connection state:", connectionState);
    
    // Test order collection access
    const orderCount = await Order.countDocuments();
    console.log("Total orders in collection:", orderCount);
    
    // Get a sample order
    const sampleOrder = await Order.findOne().sort({ createdAt: -1 });
    console.log("Latest order:", sampleOrder ? sampleOrder._id : "No orders found");
    
    res.json({
      success: true,
      message: "Database connection test successful",
      data: {
        connectionState: connectionState,
        totalOrders: orderCount,
        latestOrder: sampleOrder ? {
          id: sampleOrder._id,
          orderId: sampleOrder.orderId,
          status: sampleOrder.status,
          createdAt: sampleOrder.createdAt
        } : null
      }
    });
  } catch (err) {
    console.error("Database connection test failed:", err);
    res.status(500).json({
      success: false,
      message: "Database connection test failed",
      error: err.message
    });
  }
};

exports.getOrderStatistics = async (req, res) => {
  try {
    // ALWAYS use req.userId (which is user.restaurantId from user collection)
    const restaurantId = req.userId;

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: 'Restaurant ID is required' });
    }

    // Get the current date
    const now = new Date();
    
    // 1. Define "Today" range
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0); // Start of today

    // 2. Define "This Week" range (assuming week starts on Sunday)
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - now.getDay()); // Go back to Sunday
    weekStart.setHours(0, 0, 0, 0); // Start of that Sunday

    // 3. Define "This Month" range
    const monthStart = new Date(now);
    monthStart.setDate(1); // First day of the current month
    monthStart.setHours(0, 0, 0, 0); // Start of that day

    // Base query for all counts
    const baseQuery = {
      restaurantId: restaurantId,
      status: 'completed' // Only count 'completed' orders
    };

    // Run all count queries in parallel for better performance
    const [dailyCount, weeklyCount, monthlyCount] = await Promise.all([
      // Daily count
      Order.countDocuments({
        ...baseQuery,
        createdAt: { $gte: todayStart }
      }),
      // Weekly count
      Order.countDocuments({
        ...baseQuery,
        createdAt: { $gte: weekStart }
      }),
      // Monthly count
      Order.countDocuments({
        ...baseQuery,
        createdAt: { $gte: monthStart }
      })
    ]);

    // Send the response
    res.json({
      success: true,
      data: {
        daily: dailyCount,
        weekly: weeklyCount,
        monthly: monthlyCount
      }
    });

  } catch (err) {
    console.error("Error fetching order statistics:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

exports.getRejectedOrderStatistics = async (req, res) => {
  try {
    const restaurantId = req.userId;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID is required',
      });
    }

    const now = new Date();

    // Define date ranges
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Base query
    const baseQuery = { restaurantId, status: 'cancelled' };

    // Run all queries in parallel
    const [dailyRejected, weeklyRejected, monthlyRejected] = await Promise.all([
      Order.countDocuments({
        ...baseQuery,
        createdAt: { $gte: todayStart },
      }),
      Order.countDocuments({
        ...baseQuery,
        createdAt: { $gte: weekStart },
      }),
      Order.countDocuments({
        ...baseQuery,
        createdAt: { $gte: monthStart },
      }),
    ]);

    // Send response
    res.json({
      success: true,
      data: {
        daily: dailyRejected,
        weekly: weeklyRejected,
        monthly: monthlyRejected,
      },
    });

  } catch (err) {
    console.error('Error fetching rejected order statistics:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message,
    });
  }
};
