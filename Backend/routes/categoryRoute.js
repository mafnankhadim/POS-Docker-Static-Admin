const express = require("express");
const router = express.Router();
const Category = require("../models/Category");

// POST: Add a new category
router.post("/addcategory", async (req, res) => {
  try {
    const { categoryName } = req.body;

    // Check if category name already exists
    const existingCategory = await Category.findOne({ categoryName });
    if (existingCategory) {
      return res.status(400).json({ message: "Category name already exists" });
    }

    const newCategory = new Category({ categoryName });
    await newCategory.save();

    res
      .status(201)
      .json({ message: "Category added successfully", category: newCategory });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// GET: Fetch all categories
router.get("/getcategories", async (req, res) => {
  try {
    const categories = await Category.find();
    res
      .status(200)
      .json({ message: "Categories fetched successfully", categories });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// GET: Fetch a single category
router.get("/getcategory/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res
      .status(200)
      .json({ message: "Category fetched successfully", category });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// PUT: Update category
router.put("/updatecategory/:id", async (req, res) => {
  try {
    const { categoryName } = req.body;
    const { id } = req.params;

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { categoryName },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// DELETE: Delete category
router.delete("/deletecategory/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// GET: Get total number of categories
router.get("/totalcategories", async (req, res) => {
  try {
    const totalCategories = await Category.countDocuments();
    res.status(200).json({
      message: "Total categories fetched successfully",
      total: totalCategories,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

module.exports = router;
