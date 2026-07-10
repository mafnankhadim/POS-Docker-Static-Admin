const express = require("express");
const Detail = require("../models/Detail");
const Login = require("../models/Login");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const upload = require("../middlewares/upload");

const router = express.Router();

// POST Add Store Details
router.post("/addDetail", upload.single("logo"), async (req, res) => {
  try {
    const { storeName, contactNo, email, address } = req.body;
    const logo = req.file ? req.file.path : null;

    // Check if store details already exist
    let existingDetail = await Detail.findOne();

    if (existingDetail) {
      // Update existing record
      existingDetail.storeName = storeName || existingDetail.storeName;
      existingDetail.contactNo = contactNo || existingDetail.contactNo;
      existingDetail.email = email || existingDetail.email;
      existingDetail.address = address || existingDetail.address;
      if (logo) existingDetail.logo = logo;

      await existingDetail.save();
      return res.json({
        message: "Store details updated successfully",
        detail: existingDetail,
      });
    } else {
      // Create a new record if none exists
      const newDetail = new Detail({
        storeName,
        logo,
        contactNo,
        email,
        address,
      });
      await newDetail.save();
      return res.json({
        message: "Store details added successfully",
        detail: newDetail,
      });
    }
  } catch (err) {
    res.status(500).json({ error: "Error processing store details" });
  }
});

// PUT Update Store Details
router.put("/updateDetail", upload.single("logo"), async (req, res) => {
  try {
    const { storeName, contactNo, email, address, currentPassword, username } =
      req.body;
    const logo = req.file ? req.file.path : null;

    // Fetch store details
    let existingDetail = await Detail.findOne();
    if (!existingDetail) {
      return res.status(404).json({ error: "Store details not found" });
    }

    // Fetch user/admin responsible for updates
    const user = await Login.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Validate current password
    if (!currentPassword) {
      return res.status(400).json({ error: "Current password is required." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect current password." });
    }

    // Proceed with store detail updates
    if (storeName) existingDetail.storeName = storeName;
    if (contactNo) existingDetail.contactNo = contactNo;
    if (email) existingDetail.email = email;
    if (address) existingDetail.address = address;
    if (logo) existingDetail.logo = logo;

    await existingDetail.save();
    res.json({
      message: "Store details updated successfully",
      detail: existingDetail,
    });
  } catch (err) {
    res.status(500).json({ error: "Error updating store details" });
  }
});

// GET Store Details
router.get("/getDetail", async (req, res) => {
  try {
    const details = await Detail.find();
    res.json(details);
  } catch (err) {
    res.status(500).json({ error: "Error fetching store details" });
  }
});

module.exports = router;
