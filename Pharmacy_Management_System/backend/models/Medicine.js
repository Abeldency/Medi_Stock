import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema({
  medicineId: { type: String, required: true, unique: true, trim: true, uppercase: true, maxlength: 40 },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  manufacturer: { type: String, required: true, trim: true, maxlength: 120 },
  category: { type: String, trim: true, default: "General", maxlength: 60 },
  batchNumber: { type: String, trim: true, default: "", maxlength: 60 },
  expiryDate: { type: Date, default: null },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 0, validate: { validator: Number.isInteger, message: "Quantity must be a whole number" } },
  lowStockThreshold: { type: Number, default: 10, min: 0, validate: { validator: Number.isInteger, message: "Low-stock threshold must be a whole number" } },
}, { timestamps: true, versionKey: false });

medicineSchema.index({ name: 1 });
medicineSchema.index({ category: 1 });

export default mongoose.model("Medicine", medicineSchema);
