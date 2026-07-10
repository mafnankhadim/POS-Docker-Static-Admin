const mongoose = require("mongoose");

const invoiceItemSchema = new mongoose.Schema(
  {
    Probarcode: { type: Number, required: true },
    ProductName: { type: String, required: true },
    Category: { type: String, required: true },
    Company: { type: String, required: true },
    RetailPrice: { type: Number, required: true },
    CostPrice: { type: Number, required: true },
    ProImage: { type: String, required: true },
    Unit: { type: String, required: true },
    Quantity: { type: Number, required: true, default: 1 },
    ExpiryDate: { type: Date, required: true },
    Profit: { type: Number, required: true },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: Number, unique: true },
    customerName: { type: String, required: true },
    customerContactNo: { type: Number, required: true },
    billedBy: { type: String, required: true },
    items: [invoiceItemSchema],
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, required: true },
    changeAmount: { type: Number, required: true },
    totalProfit: { type: Number, required: true },
  },
  { timestamps: true }
);

// Auto-increment InvoiceNo
invoiceSchema.pre("save", async function (next) {
  if (this.isNew) {
    const lastInvoice = await this.constructor
      .findOne()
      .sort({ invoiceNo: -1 });
    this.invoiceNo = lastInvoice ? lastInvoice.invoiceNo + 1 : 1;
  }
  // Calculate Profit for Each Item
  this.items.forEach((item) => {
    item.Profit = (item.RetailPrice - item.CostPrice) * item.Quantity;
  });

  // Calculate Total Profit for the Invoice
  this.totalProfit = this.items.reduce((acc, item) => acc + item.Profit, 0);
  next();
});

const Invoice = mongoose.model("Invoice", invoiceSchema);
module.exports = Invoice;
