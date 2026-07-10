const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");
const productRoutes = require("./routes/productRoute");
const invoiceRoutes = require("./routes/invoiceRoute");
const categoryRoutes = require("./routes/categoryRoute");
const authRoutes = require("./routes/loginRoute");
const detailRoutes = require("./routes/detailRoute");

const app = express();

app.use(express.json());
app.use(cors());

// Ensure MongoDB is connected before handling any request (serverless-friendly).
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ message: "Database connection failed" });
  }
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/product", productRoutes);
app.use("/api/invoice", invoiceRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/detail", detailRoutes);

// Only start a listener when run directly (local dev). On Vercel the app is
// imported by api/index.js and invoked as a serverless function instead.
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
