const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require('../model/User');
dotenv.config();

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    console.log('Auth header:', authHeader);
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log('No token provided');
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    console.log('Token:', token);

    jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret", async (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          console.log('Token expired error:', err);
          return res.status(401).json({ message: "Token expired" });
        }
        console.log('Token verification error:', err);
        return res.status(403).json({ message: "Invalid token" });
      }

      console.log('Decoded token:', decoded);
      const user = await User.findById(decoded.id);
      if (!user) {
        console.log('User not found with id:', decoded.id);
        return res.status(404).json({ message: 'User not found' });
      }

      console.log('User found:', user._id);
      console.log('User restaurantId:', user.restaurantId);
      console.log('User restaurantId type:', typeof user.restaurantId);
      console.log('User restaurantId toString:', user.restaurantId?.toString());
      req.user = user;
      req.userId = user.restaurantId;
      req.actualUserId = user._id;
      console.log('Final req.userId set to:', req.userId);
      console.log('⚠️ Using ONLY restaurantId, no fallback to _id');
      next();
    });
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ message: "Server error in authMiddleware" });
  }
};

// Optional auth middleware - allows routes to work with or without authentication
// Priority: env RESTAURANT_ID > authenticated user > query params
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    // First try to get restaurantId from env
    const getRestaurantIdFromEnv = () => {
      return process.env.RESTAURANT_ID || process.env.RESTAURENT_ID;
    };
    const envRestaurantId = getRestaurantIdFromEnv();
    
    if (envRestaurantId) {
      req.userId = envRestaurantId;
      req.user = null;
      req.actualUserId = null;
      console.log('✅ Using RESTAURANT_ID from environment');
      return next();
    }

    // If no env restaurantId, try to authenticate
    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
        const user = await User.findById(decoded.id);
        if (user) {
          req.user = user;
          req.userId = user.restaurantId;
          req.actualUserId = user._id;
          console.log('✅ Using restaurantId from authenticated user');
          return next();
        }
      } catch (err) {
        // If auth fails, continue without auth (for public routes)
        console.log('⚠️ Auth failed, continuing without auth:', err.message);
      }
    }
    
    // Continue without auth (for public routes)
    // req.userId and req.user will be undefined, which is OK for public routes
    console.log('⚠️ No authentication or env RESTAURANT_ID, continuing as public route');
    next();
  } catch (err) {
    console.error('Optional auth middleware error:', err);
    // Don't block the request on error, continue as public route
    next();
  }
};

module.exports = { authMiddleware, optionalAuthMiddleware };