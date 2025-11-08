const express = require("express");
const mongoose = require('mongoose')
const cors = require("cors");
const dotenv = require("dotenv");
const DBConnect = require("./DB/DBconnect.js");
const authRouter = require("./routes/auth.js");
const transactionRoutes = require("./routes/transactionRoute.js");
const userProfileRoutes = require("./routes/userProfileRoute.js");
const category = require('./routes/category.js');
const customer = require('./routes/CustomerRoute.js')
const supplier = require('./routes/supplierRoute.js')
const inventory = require('./routes/inventoryRoute.js')
const reservation = require('./routes/reservationRoute.js')
const menu = require('./routes/menu.js')
const subcategory = require('./routes/subcategory.js')
const qr = require('./routes/QrRoutes.js')
const floor = require('./routes/floorRoute.js')
const due = require('./routes/due.js')
const devlieryTiming = require('./routes/deliverymanagement.js')
const banner = require('./routes/banner.js')
const order = require('./routes/orderRoute.js')
const path = require("path");
const report = require('./routes/reportRoute.js')
const dashboard = require('./routes/dashboardRoute.js')
const coupen = require('./routes/CoupenRoute.js')
const uploadRoute = require("./routes/uploadRoute.js");
const restaurant = require('./routes/restaurant.js')
const loginActivity = require('./routes/loginActivity.js')
const settingsRoute = require('./routes/settingsRoute.js')
const taxRoute = require('./routes/taxRoute.js')
const memberRoute = require('./routes/memberRoutes.js')
const customerSettingsRoutes = require('./routes/customerSettings.js');
const Message = require('./routes/Message.js');
const inventoryStockSettingsRoutes = require('./routes/inventoryStockSettingsRoute.js');
const lowStockRoutes = require('./routes/lowStockRoute.js');
const emailTestRoutes = require('./routes/emailTestRoute.js');
const debugRoute = require('./routes/debugRoute.js');
const { startCronJobs } = require('./services/CronJobService');
const { initializeAutoEmailService } = require('./services/AutoEmailService');
const Waste = require('./routes/WasteRoute.js')
const notificationRoute = require('./routes/notificationRoute.js')
const shortcutRoute = require('./routes/keyboardshortcutRoute.js')
const SpinAndWin = require('./routes/spinaandwinRoute.js')
dotenv.config();

// Helper function to get restaurant ID from env (supports both spellings)
function getRestaurantIdFromEnv() {
  // Check both spellings: RESTAURANT_ID (correct) and RESTAURENT_ID (typo)
  return process.env.RESTAURANT_ID || process.env.RESTAURENT_ID;
}

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
const allowedOrigins = [
  'https://dq-rms.vercel.app',
  'http://localhost:3000', // React default port
  'http://localhost:5173', // Vite default port
  'http://localhost:5174', // Vite alternate port
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true, // If you need to send cookies or authorization headers
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// DB connection
// DBConnect("mongodb+srv://nileshgoyal624_db_user:nilesh774@cluster0.t0sg444.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/dqdashboard");
DBConnect(process.env.MONGO_URL)
mongoose.connection.on("connected", () => {
  console.log("✅ Mongoose connected to MongoDB Atlas");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("⚠️ Mongoose disconnected");
});

// Log RESTAURANT_ID on server startup
const restaurantIdFromEnv = getRestaurantIdFromEnv();
console.log('═══════════════════════════════════════════════════════════');
console.log('🚀 BACKEND SERVER STARTING...');
console.log('═══════════════════════════════════════════════════════════');
console.log('📋 ENVIRONMENT VARIABLES:');
console.log('   🔹 RESTAURANT_ID (correct):', process.env.RESTAURANT_ID || '⚠️ NOT SET');
console.log('   🔹 RESTAURENT_ID (typo):', process.env.RESTAURENT_ID || '⚠️ NOT SET');
console.log('   🔹 FINAL RESTAURANT_ID:', restaurantIdFromEnv || '⚠️ NOT SET - Please set in .env file');
console.log('   🔹 MONGO_URL:', process.env.MONGO_URL ? '✅ SET' : '⚠️ NOT SET');
console.log('   🔹 PORT:', process.env.PORT || 4000);
console.log('═══════════════════════════════════════════════════════════');

// Export helper function for use in other files
global.getRestaurantIdFromEnv = getRestaurantIdFromEnv;

// Default route
app.get("/", (req, res) => {
  res.send("Hello World");
});

// Public routes (must be registered BEFORE auth routes to avoid conflicts)
const customLayoutRoute = require('./routes/customLayoutRoute');
app.use("/", customLayoutRoute); // Public custom layout routes

// Routes
app.use("/", authRouter);
app.use(Waste)
app.use(SpinAndWin)
app.use(category)
app.use(customer)
app.use(supplier)
app.use(subcategory)
app.use("/reservations", reservation)
app.use(inventory)
app.use(memberRoute)
app.use(menu);
app.use(qr)
app.use(due)
app.use(floor)
app.use(devlieryTiming)
app.use(transactionRoutes);
app.use(userProfileRoutes);
app.use(order)
app.use(banner)
app.use(report)
app.use("/api/restaurant", restaurant)
app.use(dashboard)
app.use("/api/coupon", coupen)
app.use("/api/login-activity", loginActivity)
app.use("/api/settings", settingsRoute)
app.use("/api/tax", taxRoute)
app.use("/api/customer-settings", customerSettingsRoutes);
app.use("/api/send-message", Message);
app.use("/api/inventory-stock-settings", inventoryStockSettingsRoutes);
app.use("/api/low-stock", lowStockRoutes);
app.use("/api/email-test", emailTestRoutes);
app.use("/api/debug", debugRoute);
app.use("/api/notifications", notificationRoute);
app.use(uploadRoute);
app.use(shortcutRoute);
// Start cron jobs
startCronJobs();

// Initialize auto email service
initializeAutoEmailService();

// 1. COMMENT this (for prod)
app.listen(PORT, () => {
  console.log(`🚀 Server started at http://localhost:${PORT}`);
});

// UNcomment this (for prod)
// module.exports = app;