const mongoose = require("mongoose");

const loginSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "active", "disabled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Login = mongoose.model("Login", loginSchema);

module.exports = Login;
