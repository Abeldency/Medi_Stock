import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import medicineRoutes from "./routes/medicineRoutes.js";
import Medicine from "./models/Medicine.js";

dotenv.config();
const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173").split(",").map(value => value.trim());
app.disable("x-powered-by");
app.use(cors({ origin(origin, callback) { if (!origin || allowedOrigins.includes(origin)) return callback(null, true); return callback(new Error("Origin not allowed by CORS")); } }));
app.use(express.json({ limit: "1mb" }));
app.use((req, _res, next) => { req.requestStartedAt = Date.now(); next(); });

app.get("/", (_req, res) => res.json({ name: "MediStock API", status: "ok", health: "/api/health" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok", message: "MediStock API is running", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" }));
app.use("/api/medicines", medicineRoutes);

app.get("/api/dashboard", async (_req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const in90Days = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
    const [medicineTypes, aggregate, allExpiry] = await Promise.all([
      Medicine.countDocuments(),
      Medicine.aggregate([{ $group: { _id: null, totalUnits: { $sum: "$quantity" }, inventoryValue: { $sum: { $multiply: ["$price", "$quantity"] } } } }]),
      Medicine.find({ expiryDate: { $ne: null } }).select("expiryDate quantity lowStockThreshold").lean(),
    ]);
    const lowStock = await Medicine.countDocuments({ $expr: { $lte: ["$quantity", { $ifNull: ["$lowStockThreshold", 10] }] } });
    const expired = allExpiry.filter(item => item.expiryDate && new Date(item.expiryDate) < today).length;
    const expiringSoon = allExpiry.filter(item => item.expiryDate && new Date(item.expiryDate) >= today && new Date(item.expiryDate) <= in90Days).length;
    res.json({ medicineTypes, totalUnits: aggregate[0]?.totalUnits ?? 0, lowStock, inventoryValue: Math.round((aggregate[0]?.inventoryValue ?? 0) * 100) / 100, expiringSoon, expired });
  } catch (error) {
    console.error("Dashboard query failed:", error.message);
    res.status(500).json({ message: "Could not load dashboard" });
  }
});

app.use((_req, res) => res.status(404).json({ message: "API route not found" }));
app.use((error, _req, res, _next) => {
  console.error("Request error:", error.message);
  if (error instanceof SyntaxError && "body" in error) return res.status(400).json({ message: "Request body contains invalid JSON" });
  if (error.message === "Origin not allowed by CORS") return res.status(403).json({ message: error.message });
  res.status(500).json({ message: "Unexpected server error" });
});

const PORT = Number(process.env.PORT) || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/medistock";
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`MediStock API running on http://localhost:${PORT}`));
  })
  .catch(error => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
