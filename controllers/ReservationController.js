const Reservation = require("../model/Reservation");

// 📌 Create Reservation (uses only req.userId from authMiddleware)
exports.createReservation = async (req, res) => {
  try {
    // Use only restaurantId from authMiddleware (req.userId)
    const restaurantId = req.userId;
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📅 CREATE RESERVATION API CALLED (authMiddleware)');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 RESTAURANT_ID SOURCE:');
    console.log('   🔹 From req.userId (authMiddleware):', restaurantId || 'NOT PROVIDED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ FINAL RESTAURANT_ID BEING USED:', restaurantId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: "Restaurant ID is required. Please authenticate using authMiddleware."
      });
    }

    const { customerId, startTime, endTime, customerName, tableNumber, advance, payment, notes } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Start time and end time are required"
      });
    }

    const reservation = new Reservation({
      restaurantId: restaurantId,
      customerId,
      customerName,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      tableNumber: tableNumber || '',
      advance: advance || 0,
      payment: payment || 0,
      notes: notes || '',
    });

    await reservation.save();
    console.log('✅ Reservation created successfully:', reservation._id);
    console.log('═══════════════════════════════════════════════════════════');
    
    res.status(201).json({ 
      success: true,
      message: "Reservation created successfully", 
      reservation 
    });
  } catch (err) {
    console.error("❌ Error creating reservation:", err);
    res.status(500).json({ 
      success: false,
      message: "Error creating reservation", 
      error: err.message 
    });
  }
};

// 📌 Create Reservation with ENV (ONLY uses body.restaurantId from frontend VITE_RESTAURENT_ID)
exports.createReservationWithEnv = async (req, res) => {
  try {
    // ✅ ONLY use body.restaurantId (from frontend VITE_RESTAURENT_ID) - backend .env RESTAURANT_ID NOT used
    const restaurantId = req.body.restaurantId && req.body.restaurantId.trim() !== '' ? req.body.restaurantId.trim() : undefined;
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📅 CREATE RESERVATION API CALLED (ENV)');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 RESTAURANT_ID SOURCE:');
    console.log('   🔹 From body.restaurantId (frontend VITE_RESTAURENT_ID):', restaurantId || 'NOT PROVIDED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ FINAL RESTAURANT_ID BEING USED:', restaurantId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: "Restaurant ID is required. Provide restaurantId in request body (from frontend VITE_RESTAURENT_ID)."
      });
    }

    const { customerId, startTime, endTime, customerName, tableNumber, advance, payment, notes } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Start time and end time are required"
      });
    }

    const reservation = new Reservation({
      restaurantId: restaurantId,
      customerId,
      customerName,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      tableNumber: tableNumber || '',
      advance: advance || 0,
      payment: payment || 0,
      notes: notes || '',
    });

    await reservation.save();
    console.log('✅ Reservation created successfully:', reservation._id);
    console.log('═══════════════════════════════════════════════════════════');
    
    res.status(201).json({ 
      success: true,
      message: "Reservation created successfully", 
      reservation 
    });
  } catch (err) {
    console.error("❌ Error creating reservation:", err);
    res.status(500).json({ 
      success: false,
      message: "Error creating reservation", 
      error: err.message 
    });
  }
};

// 📌 Get all reservations (Public route - ONLY uses query.restaurantId from frontend VITE_RESTAURENT_ID or req.userId)
exports.getAllReservations = async (req, res) => {
  try {
    // ✅ Priority: query.restaurantId (from frontend VITE_RESTAURENT_ID) FIRST > req.userId (optional) - backend .env RESTAURANT_ID NOT used
    const queryRestaurantId = req.query.restaurantId && req.query.restaurantId.trim() !== '' ? req.query.restaurantId.trim() : undefined;
    const restaurantId = queryRestaurantId || req.userId;
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📅 GET ALL RESERVATIONS API CALLED');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 RESTAURANT_ID SOURCES:');
    console.log('   🔹 From query.restaurantId (frontend VITE_RESTAURENT_ID):', queryRestaurantId || 'NOT PROVIDED');
    console.log('   🔹 From req.userId (optional):', req.userId || 'NOT PROVIDED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ FINAL RESTAURANT_ID BEING USED:', restaurantId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!restaurantId) {
      console.warn('⚠️ No restaurantId provided');
      return res.status(400).json({
        success: false,
        message: "Restaurant ID is required. Provide restaurantId in query parameter (from frontend VITE_RESTAURENT_ID) or authenticate."
      });
    }

    // Populate customer data if you have a reference
    const reservations = await Reservation.find({ restaurantId })
      .populate('customerId', 'name phoneNumber address')
      .sort({ startTime: 1 }) // Sort by start time
      .exec();

    console.log('✅ RESERVATIONS FOUND:', reservations.length);
    console.log('═══════════════════════════════════════════════════════════');

    // Transform data to match frontend expectations
    const transformedReservations = reservations.map(reservation => ({
      _id: reservation._id,
      id: reservation._id,
      date: reservation.startTime ? new Date(reservation.startTime).toISOString().split('T')[0] : null,
      time: reservation.startTime ? new Date(reservation.startTime).toTimeString().split(' ')[0].substring(0, 5) : null,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      payment: reservation.payment,
      advance: reservation.advance,
      notes: reservation.notes,
      tableNumber: reservation.tableNumber,
      customerId: reservation.customerId?._id || reservation.customerId,
      customerName: reservation.customerId?.name || reservation.customerName || 'N/A',
      customerPhoneNumber: reservation.customerId?.phoneNumber || 'N/A',
      customerAddress: reservation.customerId?.address || 'N/A',
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt
    }));

    res.json({ 
      success: true,
      reservations: transformedReservations,
      count: transformedReservations.length
    });
  } catch (err) {
    console.log(err, "reservation err");
    res.status(500).json({
      success: false,
      message: "Error fetching reservations",
      error: err.message,
    });
  }
};

// 📌 Get available time slots for a specific date (Public route - ONLY uses query.restaurantId from frontend VITE_RESTAURENT_ID)
exports.getAvailableTimeSlots = async (req, res) => {
  try {
    // ✅ ONLY use query.restaurantId (from frontend VITE_RESTAURENT_ID) - backend .env RESTAURANT_ID NOT used
    const restaurantId = req.query.restaurantId && req.query.restaurantId.trim() !== '' ? req.query.restaurantId.trim() : undefined;
    const { date } = req.query;
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🕐 GET AVAILABLE TIME SLOTS API CALLED');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 RESTAURANT_ID SOURCE:');
    console.log('   🔹 From query.restaurantId (frontend VITE_RESTAURENT_ID):', restaurantId || 'NOT PROVIDED');
    console.log('   🔹 Request date:', date || 'NOT PROVIDED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ FINAL RESTAURANT_ID BEING USED:', restaurantId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: "Restaurant ID is required. Provide restaurantId in query parameter (from frontend VITE_RESTAURENT_ID)."
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required in query parameter (format: YYYY-MM-DD)"
      });
    }

    // Parse the date
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Please use YYYY-MM-DD format."
      });
    }

    // Set time to start of day (00:00:00)
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    // Set time to end of day (23:59:59)
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('🔍 Searching for reservations between:', startOfDay, 'and', endOfDay);

    // Get all reservations for this date
    const reservations = await Reservation.find({
      restaurantId,
      startTime: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).sort({ startTime: 1 });

    console.log('✅ Found', reservations.length, 'reservations for this date');

    // Generate time slots (30-minute intervals from 9 AM to 10 PM)
    const timeSlots = [];
    const slotDuration = 30; // minutes
    const startHour = 9; // 9 AM
    const endHour = 22; // 10 PM (22:00)

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const slotTime = new Date(targetDate);
        slotTime.setHours(hour, minute, 0, 0);
        
        // Skip past time slots for today
        const now = new Date();
        const isToday = targetDate.toDateString() === now.toDateString();
        if (isToday && slotTime < now) {
          continue; // Skip past slots
        }

        const slotEndTime = new Date(slotTime.getTime() + slotDuration * 60 * 1000);
        
        // Check if this slot conflicts with any reservation
        const hasConflict = reservations.some(reservation => {
          const resStart = new Date(reservation.startTime);
          const resEnd = new Date(reservation.endTime);
          
          // Check if slot overlaps with reservation
          return (slotTime < resEnd && slotEndTime > resStart);
        });

        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Get booked tables for this time slot
        const conflictingReservations = reservations.filter(reservation => {
          const resStart = new Date(reservation.startTime);
          const resEnd = new Date(reservation.endTime);
          return (slotTime < resEnd && slotEndTime > resStart);
        });
        
        const bookedTables = conflictingReservations
          .map(res => res.tableNumber)
          .filter(Boolean); // Remove empty/null table numbers
        
        // Generate available tables (assuming 20 tables: T1 to T20)
        // In a real system, you'd fetch table data from a Table model
        const allTables = Array.from({length: 20}, (_, i) => `T${i + 1}`);
        const availableTables = allTables.filter(table => !bookedTables.includes(table));
        
        timeSlots.push({
          time: timeString,
          available: !hasConflict,
          startTime: slotTime,
          endTime: slotEndTime,
          availableTables: availableTables, // Array of available table IDs
          bookedTables: bookedTables, // Array of booked table IDs
        });
      }
    }

    const availableSlots = timeSlots.filter(slot => slot.available);
    const bookedSlots = timeSlots.length - availableSlots.length;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ TIME SLOTS SUMMARY:');
    console.log('   🔹 Total slots:', timeSlots.length);
    console.log('   🔹 Available slots:', availableSlots.length);
    console.log('   🔹 Booked slots:', bookedSlots);
    console.log('═══════════════════════════════════════════════════════════');

    res.json({
      success: true,
      date: date,
      restaurantId: restaurantId,
      timeSlots: timeSlots,
      availableSlots: availableSlots.length,
      bookedSlots: bookedSlots,
      totalSlots: timeSlots.length,
    });
  } catch (err) {
    console.error("❌ Error fetching available time slots:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching available time slots",
      error: err.message,
    });
  }
};

// 📌 Update reservation (change date/time/guests)
exports.updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove undefined values and convert dates properly
    const cleanUpdateData = {};
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && updateData[key] !== null) {
        cleanUpdateData[key] = updateData[key];
      }
    });

    const reservation = await Reservation.findByIdAndUpdate(
      id,
      cleanUpdateData,
      { new: true, runValidators: true }
    );

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found"
      });
    }

    res.json({
      success: true,
      message: "Reservation updated successfully",
      reservation
    });
  } catch (err) {
    console.log(err, "update reservation err");
    res.status(500).json({
      success: false,
      message: "Error updating reservation",
      error: err.message,
    });
  }
};

// 📌 Cancel reservation
exports.cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findByIdAndDelete(id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found"
      });
    }

    res.json({
      success: true,
      message: "Reservation cancelled successfully"
    });
  } catch (err) {
    console.log(err, "cancel reservation err");
    res.status(500).json({
      success: false,
      message: "Error cancelling reservation",
      error: err.message,
    });
  }
};
