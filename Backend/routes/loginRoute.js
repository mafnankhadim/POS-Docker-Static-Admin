// routes/authRoutes.js

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const Login = require("../models/Login");
const authenticate = require("../middlewares/authMiddleware");

dotenv.config(); // Load environment variables

const router = express.Router();

// Get Logged-in User Details
router.get("/getuser", authenticate, async (req, res) => {
  try {
    const user = await Login.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// User Registration Route
router.post("/register", async (req, res) => {
  try {
    const { username, password, status } = req.body;

    const existingUser = await Login.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already in use" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new Login({
      username,
      password: hashedPassword,
      status: status || "pending",
    });

    await newUser.save();
    res.status(201).json({
      message: "User registered successfully",
      status: newUser.status,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// User Login Route
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await Login.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    if (user.status === "pending") {
      return res.status(403).json({
        message:
          "Your account is pending approval. Please wait for admin approval.",
      });
    }

    if (user.status === "disabled") {
      return res.status(403).json({
        message:
          "Your account has been disabled. Contact support for assistance.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update User Route (Protected Route)
router.put("/updateuser", authenticate, async (req, res) => {
  try {
    const { username, oldPassword, password, status } = req.body;
    const userId = req.user.id;

    const user = await Login.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (oldPassword) {
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Old password is incorrect." });
      }

      if (oldPassword === password) {
        return res.status(400).json({
          message: "New password cannot be the same as the old password.",
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    if (username) user.username = username;
    if (status) user.status = status;

    await user.save();
    res.json({ message: "User updated successfully", status: user.status });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET all users (for Admin Panel)
router.get("/getusers", async (req, res) => {
  try {
    const users = await Login.find().select("-password");
    res.json(users);
  } catch (error) {
    console.error("Error fetching all users:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update User Status (Admin Route)
router.put("/updateStatus", async (req, res) => {
  try {
    const { userId, status } = req.body;

    const validStatuses = ["pending", "active", "disabled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const user = await Login.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.status = status;

    await user.save();
    res.json({
      message: "User status updated successfully",
      status: user.status,
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
