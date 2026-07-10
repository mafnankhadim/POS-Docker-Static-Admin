const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const upload = require("../middlewares/upload");
const cloudinary = require("../config/cloudinary");

// Add Product Route
router.post("/addproduct", upload.single("ProImage"), async (req, res) => {
  try {
    const {
      Probarcode,
      ProductName,
      Category,
      Company,
      RetailPrice,
      CostPrice,
      Unit,
      Quantity,
      ExpiryDate,
    } = req.body;
    const ProImage = req.file ? req.file.path : null;

    // Check if a product with the same barcode or name already exists
    const existingProduct = await Product.findOne({
      $or: [{ Probarcode }, { ProductName }],
    });

    if (existingProduct) {
      return res.status(400).json({
        error: "Product with the same barcode or name already exists",
      });
    }

    const newProduct = new Product({
      Probarcode,
      ProductName,
      Category,
      Company,
      RetailPrice,
      CostPrice,
      ProImage,
      Unit,
      Quantity,
      ExpiryDate,
    });

    await newProduct.save();
    res
      .status(201)
      .json({ message: "Product added successfully", product: newProduct });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Product Route
router.put(
  "/updateproduct/:id",
  upload.single("ProImage"),
  async (req, res) => {
    try {
      const {
        Probarcode,
        ProductName,
        Category,
        Company,
        RetailPrice,
        CostPrice,
        Unit,
        Quantity,
        ExpiryDate,
      } = req.body;
      const ProImage = req.file ? req.file.path : undefined;

      const updatedData = {
        Probarcode,
        ProductName,
        Category,
        Company,
        RetailPrice,
        CostPrice,
        Unit,
        Quantity,
        ExpiryDate,
      };
      if (ProImage) updatedData.ProImage = ProImage;

      // If a new image was uploaded, remove the previous one from Cloudinary.
      if (req.file) {
        const existing = await Product.findById(req.params.id);
        const oldPublicId = upload.publicIdFromUrl(existing && existing.ProImage);
        if (oldPublicId) {
          await cloudinary.uploader.destroy(oldPublicId).catch(() => {});
        }
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        updatedData,
        { new: true }
      );

      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.status(200).json({
        message: "Product updated successfully",
        product: updatedProduct,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete Product Route
router.delete("/deleteproduct/:id", async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Remove the product image from Cloudinary too.
    const publicId = upload.publicIdFromUrl(deletedProduct.ProImage);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId).catch(() => {});
    }

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Single Product Route
router.get("/getproduct/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get All Product Route
router.get("/getproducts", async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json({ products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Expired Product Route
router.get("/expired-products", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of the day

    const expiredProducts = await Product.find({
      ExpiryDate: { $lt: today }, // Find products where ExpiryDate is before today
    });

    // ✅ Instead of 404, return an empty array when no products are found
    res.status(200).json({
      expiredProducts: expiredProducts.length > 0 ? expiredProducts : [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Expired Product Route
router.put("/update-expiredproduct/:id", async (req, res) => {
  try {
    const { ExpiryDate } = req.body; // Get new expiry date from request

    if (!ExpiryDate) {
      return res.status(400).json({ message: "Expiry date is required" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { ExpiryDate },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Expiry date updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Low Stock Products
router.get("/lowstock", async (req, res) => {
  try {
    // Find products where quantity is less than 10
    const lowStockProducts = await Product.find({ Quantity: { $lt: 10 } });

    if (lowStockProducts.length === 0) {
      return res.status(200).json({ message: "No low stock products found" });
    }

    res.status(200).json({ lowStockProducts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Product Quantity
router.put("/update-lowstock/:id", async (req, res) => {
  try {
    const { Quantity } = req.body;
    const { id } = req.params;

    // Ensure the quantity is provided and is a valid number
    if (Quantity === undefined || isNaN(Quantity)) {
      return res.status(400).json({ error: "Invalid quantity provided" });
    }

    // Find and update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { Quantity },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    res
      .status(200)
      .json({ message: "Product updated successfully", updatedProduct });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Total Number of Products and Total Revenue
router.get("/productstats", async (req, res) => {
  try {
    const today = new Date(); // Get today's date

    // Get total number of products
    const totalProducts = await Product.countDocuments();

    // Get total revenue considering quantity
    const totalRevenueResult = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $multiply: ["$RetailPrice", "$Quantity"] } },
        },
      },
    ]);
    const totalRevenue = totalRevenueResult[0]?.totalRevenue || 0;

    // Get expired products (ExpiryDate is in the past)
    const expiredProducts = await Product.countDocuments({
      ExpiryDate: { $lt: today },
    });

    // Get out-of-stock products (Quantity is 0 or less)
    const outOfStockProducts = await Product.countDocuments({
      Quantity: { $lte: 0 },
    });

    res.status(200).json({
      totalProducts,
      totalRevenue,
      expiredProducts,
      outOfStockProducts,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
