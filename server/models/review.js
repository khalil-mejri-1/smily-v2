// models/review.js
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: [true, "اسم العميل مطلوب."],
    trim: true,
  },
  comment: {
    type: String,
    required: [true, "التعليق مطلوب."],
    trim: true,
  },
  imageUrl: {
    type: String, // سنخزن هنا مسار الصورة
    required: false, // الصورة اختيارية
  },
  approved: {
    type: Boolean,
    default: false, // افتراضيًا، التعليق غير موافق عليه
  },
}, {
  timestamps: true, // لإضافة createdAt و updatedAt
});

module.exports = mongoose.model("Review", reviewSchema);