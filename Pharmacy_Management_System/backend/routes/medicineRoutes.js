import express from "express";
import mongoose from "mongoose";
import Medicine from "../models/Medicine.js";

const router = express.Router();
const allowedCategories = new Set(["General", "Analgesics", "Antibiotics", "Antiseptics", "Cardiac", "Diabetes care", "Digestive health", "First aid", "Vitamins & supplements", "Other"]);

function validateMedicine(body) {
  for (const field of ["medicineId", "name", "manufacturer"]) {
    if (!String(body[field] ?? "").trim()) return `${field} is required`;
  }
  if (String(body.medicineId).trim().length > 40) return "Medicine ID must be 40 characters or fewer";
  if (String(body.name).trim().length > 120) return "Medicine name must be 120 characters or fewer";
  if (String(body.manufacturer).trim().length > 120) return "Manufacturer must be 120 characters or fewer";
  if (!Number.isFinite(Number(body.price)) || Number(body.price) < 0) return "Price must be zero or greater";
  if (!Number.isInteger(Number(body.quantity)) || Number(body.quantity) < 0) return "Quantity must be a whole number zero or greater";
  if (body.lowStockThreshold !== undefined && (!Number.isInteger(Number(body.lowStockThreshold)) || Number(body.lowStockThreshold) < 0)) return "Low-stock threshold must be a whole number zero or greater";
  if (body.category && !allowedCategories.has(String(body.category))) return "Choose a valid medicine category";
  if (body.expiryDate && Number.isNaN(new Date(body.expiryDate).getTime())) return "Expiry date is invalid";
  if (body.batchNumber && String(body.batchNumber).length > 60) return "Batch number must be 60 characters or fewer";
  return null;
}

function medicinePayload(body) {
  return {
    medicineId: String(body.medicineId).trim().toUpperCase(),
    name: String(body.name).trim(),
    manufacturer: String(body.manufacturer).trim(),
    category: String(body.category || "General").trim(),
    batchNumber: String(body.batchNumber || "").trim(),
    expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
    price: Number(body.price),
    quantity: Number(body.quantity),
    lowStockThreshold: body.lowStockThreshold === undefined ? 10 : Number(body.lowStockThreshold),
  };
}

router.get("/", async (req, res) => {
  try {
    const search = String(req.query.search || "").trim().slice(0, 100);
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const filter = search ? { $or: [
      { medicineId: { $regex: escaped, $options: "i" } },
      { name: { $regex: escaped, $options: "i" } },
      { manufacturer: { $regex: escaped, $options: "i" } },
      { batchNumber: { $regex: escaped, $options: "i" } },
    ] } : {};
    const medicines = await Medicine.find(filter).sort({ name: 1 }).lean();
    res.json(medicines);
  } catch (error) {
    console.error("Fetch medicines failed:", error.message);
    res.status(500).json({ message: "Could not fetch medicines" });
  }
});

router.get("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid medicine record ID" });
  try {
    const medicine = await Medicine.findById(req.params.id).lean();
    if (!medicine) return res.status(404).json({ message: "Medicine not found" });
    res.json(medicine);
  } catch (error) {
    console.error("Get medicine failed:", error.message);
    res.status(500).json({ message: "Could not fetch medicine" });
  }
});

router.post("/", async (req, res) => {
  const validationError = validateMedicine(req.body || {});
  if (validationError) return res.status(400).json({ message: validationError });
  try {
    const medicine = await Medicine.create(medicinePayload(req.body));
    res.status(201).json(medicine);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "That medicine ID already exists" });
    if (error.name === "ValidationError") return res.status(400).json({ message: error.message });
    console.error("Create medicine failed:", error.message);
    res.status(500).json({ message: "Could not add medicine" });
  }
});

router.put("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid medicine record ID" });
  const validationError = validateMedicine(req.body || {});
  if (validationError) return res.status(400).json({ message: validationError });
  try {
    const medicine = await Medicine.findByIdAndUpdate(req.params.id, medicinePayload(req.body), { new: true, runValidators: true });
    if (!medicine) return res.status(404).json({ message: "Medicine not found" });
    res.json(medicine);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "That medicine ID already exists" });
    if (error.name === "ValidationError") return res.status(400).json({ message: error.message });
    console.error("Update medicine failed:", error.message);
    res.status(500).json({ message: "Could not update medicine" });
  }
});

router.patch("/:id/stock", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid medicine record ID" });
  const amount = Number(req.body?.quantity);
  const action = req.body?.action;
  if (!Number.isInteger(amount) || amount <= 0) return res.status(400).json({ message: "Enter a positive whole-number quantity" });
  if (!["receive", "sell"].includes(action)) return res.status(400).json({ message: "Action must be receive or sell" });
  try {
    const filter = { _id: req.params.id };
    const update = action === "receive" ? { $inc: { quantity: amount } } : { $inc: { quantity: -amount } };
    if (action === "sell") {
      filter.quantity = { $gte: amount };
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filter.$or = [{ expiryDate: null }, { expiryDate: { $gte: today } }];
    }
    const medicine = await Medicine.findOneAndUpdate(filter, update, { new: true, runValidators: true });
    if (!medicine) {
      const existing = await Medicine.findById(req.params.id).select("quantity expiryDate").lean();
      if (!existing) return res.status(404).json({ message: "Medicine not found" });
      if (action === "sell" && existing.expiryDate && new Date(existing.expiryDate) < new Date(new Date().setHours(0, 0, 0, 0))) {
        return res.status(400).json({ message: "Cannot record a sale for expired medicine" });
      }
      return res.status(400).json({ message: `Only ${existing.quantity} unit(s) are currently in stock` });
    }
    res.json(medicine);
  } catch (error) {
    console.error("Stock update failed:", error.message);
    res.status(500).json({ message: "Could not update stock" });
  }
});

router.delete("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid medicine record ID" });
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);
    if (!medicine) return res.status(404).json({ message: "Medicine not found" });
    res.json({ message: "Medicine deleted successfully" });
  } catch (error) {
    console.error("Delete medicine failed:", error.message);
    res.status(500).json({ message: "Could not delete medicine" });
  }
});

export default router;
