const mongoose = require("mongoose");

// Define category schema
const categorySchema = new mongoose.Schema(
  {
    categoryId: { type: Number, unique: true }, // Auto-incremented ID
    categoryName: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

// Auto-increment categoryId
categorySchema.pre("save", async function (next) {
  if (this.isNew) {
    const lastCategory = await this.constructor
      .findOne()
      .sort({ categoryId: -1 });
    this.categoryId = lastCategory ? lastCategory.categoryId + 1 : 1;
  }
  next();
});

const Category = mongoose.model("Category", categorySchema);
module.exports = Category;
