// models/order.js

const mongoose = require("mongoose");

// ✅ قم بتعديل هذا الجزء
const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  title: { type: String, required: true },
  quantity: { type: Number, required: true },
  size: { type: String, required: true },
  price: { type: String, required: true },
  image: { type: String, required: true }, // ✨ أضف هذا السطر
});

// (لا حاجة لتعديل باقي الملف)
const orderSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    items: [orderItemSchema], // سيتم استخدام الـ Schema المُعدّل هنا
    totalPrice: { type: String, required: true },
    orderDate: { type: Date, default: Date.now },
    status: { type: String, default: "Pending" },
    review: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);