import mongoose from "mongoose";
import dotenv from "dotenv";
import Medicine from "./models/Medicine.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/medistock";

// Demo inventory only: sample prices, quantities, batches and expiry dates.
// This script adds missing MED- IDs only. It does not delete or overwrite existing records.
const demoMedicines = [
  { medicineId: "MED-1001", name: 'Paracetamol 500 mg', manufacturer: 'DemoCare Pharmaceuticals', category: 'Pain Relief', batchNumber: "DEMO-2026-001", expiryOffsetDays: 45, price: 18.50, quantity: 120, lowStockThreshold: 10 },
  { medicineId: "MED-1002", name: 'Paracetamol 650 mg', manufacturer: 'NovaMed Laboratories', category: 'Pain Relief', batchNumber: "DEMO-2026-002", expiryOffsetDays: 70, price: 22.00, quantity: 85, lowStockThreshold: 12 },
  { medicineId: "MED-1003", name: 'Ibuprofen 200 mg', manufacturer: 'WellSpring Health Products', category: 'Pain Relief', batchNumber: "DEMO-2026-003", expiryOffsetDays: 85, price: 24.00, quantity: 42, lowStockThreshold: 15 },
  { medicineId: "MED-1004", name: 'Ibuprofen 400 mg', manufacturer: 'PrimeLife Pharma', category: 'Pain Relief', batchNumber: "DEMO-2026-004", expiryOffsetDays: 150, price: 36.00, quantity: 18, lowStockThreshold: 8 },
  { medicineId: "MED-1005", name: 'Aspirin 75 mg', manufacturer: 'CareBridge Laboratories', category: 'Cardiovascular', batchNumber: "DEMO-2026-005", expiryOffsetDays: 240, price: 12.50, quantity: 65, lowStockThreshold: 20 },
  { medicineId: "MED-1006", name: 'Cetirizine 10 mg', manufacturer: 'BluePeak Healthcare', category: 'Allergy', batchNumber: "DEMO-2026-006", expiryOffsetDays: 365, price: 14.00, quantity: 150, lowStockThreshold: 10 },
  { medicineId: "MED-1007", name: 'Levocetirizine 5 mg', manufacturer: 'DemoCare Pharmaceuticals', category: 'Allergy', batchNumber: "DEMO-2026-007", expiryOffsetDays: 540, price: 28.00, quantity: 34, lowStockThreshold: 12 },
  { medicineId: "MED-1008", name: 'Loratadine 10 mg', manufacturer: 'NovaMed Laboratories', category: 'Allergy', batchNumber: "DEMO-2026-008", expiryOffsetDays: 720, price: 32.00, quantity: 25, lowStockThreshold: 15 },
  { medicineId: "MED-1009", name: 'Fexofenadine 120 mg', manufacturer: 'WellSpring Health Products', category: 'Allergy', batchNumber: "DEMO-2026-009", expiryOffsetDays: 900, price: 68.00, quantity: 16, lowStockThreshold: 8 },
  { medicineId: "MED-1010", name: 'Omeprazole 20 mg', manufacturer: 'PrimeLife Pharma', category: 'Gastrointestinal', batchNumber: "DEMO-2026-010", expiryOffsetDays: 600, price: 42.00, quantity: 70, lowStockThreshold: 20 },
  { medicineId: "MED-1011", name: 'Pantoprazole 40 mg', manufacturer: 'CareBridge Laboratories', category: 'Gastrointestinal', batchNumber: "DEMO-2026-011", expiryOffsetDays: 45, price: 55.00, quantity: 90, lowStockThreshold: 10 },
  { medicineId: "MED-1012", name: 'Rabeprazole 20 mg', manufacturer: 'BluePeak Healthcare', category: 'Gastrointestinal', batchNumber: "DEMO-2026-012", expiryOffsetDays: 70, price: 48.00, quantity: 12, lowStockThreshold: 12 },
  { medicineId: "MED-1013", name: 'Famotidine 20 mg', manufacturer: 'DemoCare Pharmaceuticals', category: 'Gastrointestinal', batchNumber: "DEMO-2027-013", expiryOffsetDays: 85, price: 19.00, quantity: 30, lowStockThreshold: 15 },
  { medicineId: "MED-1014", name: 'Ondansetron 4 mg', manufacturer: 'NovaMed Laboratories', category: 'Gastrointestinal', batchNumber: "DEMO-2027-014", expiryOffsetDays: 150, price: 26.00, quantity: 22, lowStockThreshold: 8 },
  { medicineId: "MED-1015", name: 'ORS Sachet', manufacturer: 'WellSpring Health Products', category: 'Rehydration', batchNumber: "DEMO-2027-015", expiryOffsetDays: 240, price: 21.00, quantity: 200, lowStockThreshold: 20 },
  { medicineId: "MED-1016", name: 'Loperamide 2 mg', manufacturer: 'PrimeLife Pharma', category: 'Gastrointestinal', batchNumber: "DEMO-2027-016", expiryOffsetDays: 365, price: 17.00, quantity: 28, lowStockThreshold: 10 },
  { medicineId: "MED-1017", name: 'Domperidone 10 mg', manufacturer: 'CareBridge Laboratories', category: 'Gastrointestinal', batchNumber: "DEMO-2027-017", expiryOffsetDays: 540, price: 23.00, quantity: 15, lowStockThreshold: 12 },
  { medicineId: "MED-1018", name: 'Metformin 500 mg', manufacturer: 'BluePeak Healthcare', category: 'Diabetes Care', batchNumber: "DEMO-2027-018", expiryOffsetDays: 720, price: 28.00, quantity: 110, lowStockThreshold: 15 },
  { medicineId: "MED-1019", name: 'Metformin 850 mg', manufacturer: 'DemoCare Pharmaceuticals', category: 'Diabetes Care', batchNumber: "DEMO-2027-019", expiryOffsetDays: 900, price: 39.00, quantity: 45, lowStockThreshold: 8 },
  { medicineId: "MED-1020", name: 'Glimepiride 1 mg', manufacturer: 'NovaMed Laboratories', category: 'Diabetes Care', batchNumber: "DEMO-2027-020", expiryOffsetDays: 600, price: 31.00, quantity: 20, lowStockThreshold: 20 },
  { medicineId: "MED-1021", name: 'Amlodipine 5 mg', manufacturer: 'WellSpring Health Products', category: 'Cardiovascular', batchNumber: "DEMO-2027-021", expiryOffsetDays: 45, price: 24.00, quantity: 95, lowStockThreshold: 10 },
  { medicineId: "MED-1022", name: 'Amlodipine 10 mg', manufacturer: 'PrimeLife Pharma', category: 'Cardiovascular', batchNumber: "DEMO-2027-022", expiryOffsetDays: 70, price: 35.00, quantity: 14, lowStockThreshold: 12 },
  { medicineId: "MED-1023", name: 'Losartan 50 mg', manufacturer: 'CareBridge Laboratories', category: 'Cardiovascular', batchNumber: "DEMO-2027-023", expiryOffsetDays: 85, price: 52.00, quantity: 60, lowStockThreshold: 15 },
  { medicineId: "MED-1024", name: 'Telmisartan 40 mg', manufacturer: 'BluePeak Healthcare', category: 'Cardiovascular', batchNumber: "DEMO-2027-024", expiryOffsetDays: 150, price: 58.00, quantity: 38, lowStockThreshold: 8 },
  { medicineId: "MED-1025", name: 'Atorvastatin 10 mg', manufacturer: 'DemoCare Pharmaceuticals', category: 'Cardiovascular', batchNumber: "DEMO-2028-025", expiryOffsetDays: 240, price: 44.00, quantity: 80, lowStockThreshold: 20 },
  { medicineId: "MED-1026", name: 'Atorvastatin 20 mg', manufacturer: 'NovaMed Laboratories', category: 'Cardiovascular', batchNumber: "DEMO-2028-026", expiryOffsetDays: 365, price: 67.00, quantity: 17, lowStockThreshold: 10 },
  { medicineId: "MED-1027", name: 'Clopidogrel 75 mg', manufacturer: 'WellSpring Health Products', category: 'Cardiovascular', batchNumber: "DEMO-2028-027", expiryOffsetDays: 540, price: 49.00, quantity: 24, lowStockThreshold: 12 },
  { medicineId: "MED-1028", name: 'Vitamin C 500 mg', manufacturer: 'PrimeLife Pharma', category: 'Vitamins & Supplements', batchNumber: "DEMO-2028-028", expiryOffsetDays: 720, price: 35.00, quantity: 130, lowStockThreshold: 15 },
  { medicineId: "MED-1029", name: 'Vitamin D3 1000 IU', manufacturer: 'CareBridge Laboratories', category: 'Vitamins & Supplements', batchNumber: "DEMO-2028-029", expiryOffsetDays: 900, price: 62.00, quantity: 75, lowStockThreshold: 8 },
  { medicineId: "MED-1030", name: 'Vitamin B-Complex', manufacturer: 'BluePeak Healthcare', category: 'Vitamins & Supplements', batchNumber: "DEMO-2028-030", expiryOffsetDays: 600, price: 29.00, quantity: 105, lowStockThreshold: 20 },
  { medicineId: "MED-1031", name: 'Calcium + Vitamin D3', manufacturer: 'DemoCare Pharmaceuticals', category: 'Vitamins & Supplements', batchNumber: "DEMO-2028-031", expiryOffsetDays: 45, price: 78.00, quantity: 32, lowStockThreshold: 10 },
  { medicineId: "MED-1032", name: 'Ferrous Ascorbate', manufacturer: 'NovaMed Laboratories', category: 'Vitamins & Supplements', batchNumber: "DEMO-2028-032", expiryOffsetDays: 70, price: 85.00, quantity: 11, lowStockThreshold: 12 },
  { medicineId: "MED-1033", name: 'Zinc 20 mg', manufacturer: 'WellSpring Health Products', category: 'Vitamins & Supplements', batchNumber: "DEMO-2028-033", expiryOffsetDays: 85, price: 24.00, quantity: 40, lowStockThreshold: 15 },
  { medicineId: "MED-1034", name: 'Multivitamin Tablets', manufacturer: 'PrimeLife Pharma', category: 'Vitamins & Supplements', batchNumber: "DEMO-2028-034", expiryOffsetDays: 150, price: 95.00, quantity: 55, lowStockThreshold: 8 },
  { medicineId: "MED-1035", name: 'Salbutamol Inhaler', manufacturer: 'CareBridge Laboratories', category: 'Respiratory', batchNumber: "DEMO-2028-035", expiryOffsetDays: 240, price: 115.00, quantity: 19, lowStockThreshold: 20 },
  { medicineId: "MED-1036", name: 'Ambroxol Syrup 100 ml', manufacturer: 'BluePeak Healthcare', category: 'Respiratory', batchNumber: "DEMO-2028-036", expiryOffsetDays: 365, price: 78.00, quantity: 26, lowStockThreshold: 10 },
  { medicineId: "MED-1037", name: 'Dextromethorphan Syrup 100 ml', manufacturer: 'DemoCare Pharmaceuticals', category: 'Respiratory', batchNumber: "DEMO-2029-037", expiryOffsetDays: 540, price: 92.00, quantity: 13, lowStockThreshold: 12 },
  { medicineId: "MED-1038", name: 'Montelukast 10 mg', manufacturer: 'NovaMed Laboratories', category: 'Respiratory', batchNumber: "DEMO-2029-038", expiryOffsetDays: 720, price: 46.00, quantity: 21, lowStockThreshold: 15 },
  { medicineId: "MED-1039", name: 'Fluticasone Nasal Spray', manufacturer: 'WellSpring Health Products', category: 'Respiratory', batchNumber: "DEMO-2029-039", expiryOffsetDays: 900, price: 165.00, quantity: 9, lowStockThreshold: 8 },
  { medicineId: "MED-1040", name: 'Normal Saline 0.9% 100 ml', manufacturer: 'PrimeLife Pharma', category: 'First Aid', batchNumber: "DEMO-2029-040", expiryOffsetDays: 600, price: 32.00, quantity: 40, lowStockThreshold: 20 },
  { medicineId: "MED-1041", name: 'Povidone-Iodine Solution', manufacturer: 'CareBridge Laboratories', category: 'First Aid', batchNumber: "DEMO-2029-041", expiryOffsetDays: 45, price: 68.00, quantity: 24, lowStockThreshold: 10 },
  { medicineId: "MED-1042", name: 'Chlorhexidine Mouthwash', manufacturer: 'BluePeak Healthcare', category: 'Oral Care', batchNumber: "DEMO-2029-042", expiryOffsetDays: 70, price: 88.00, quantity: 18, lowStockThreshold: 12 },
  { medicineId: "MED-1043", name: 'Clotrimazole 1% Cream', manufacturer: 'DemoCare Pharmaceuticals', category: 'Skin Care', batchNumber: "DEMO-2029-043", expiryOffsetDays: 85, price: 42.00, quantity: 47, lowStockThreshold: 15 },
  { medicineId: "MED-1044", name: 'Calamine Lotion 100 ml', manufacturer: 'NovaMed Laboratories', category: 'Skin Care', batchNumber: "DEMO-2029-044", expiryOffsetDays: 150, price: 54.00, quantity: 33, lowStockThreshold: 8 },
  { medicineId: "MED-1045", name: 'Hydrocortisone 1% Cream', manufacturer: 'WellSpring Health Products', category: 'Skin Care', batchNumber: "DEMO-2029-045", expiryOffsetDays: 240, price: 39.00, quantity: 14, lowStockThreshold: 20 },
  { medicineId: "MED-1046", name: 'Mupirocin 2% Ointment', manufacturer: 'PrimeLife Pharma', category: 'Skin Care', batchNumber: "DEMO-2029-046", expiryOffsetDays: 365, price: 92.00, quantity: 8, lowStockThreshold: 10 },
  { medicineId: "MED-1047", name: 'Ketoconazole Shampoo', manufacturer: 'CareBridge Laboratories', category: 'Skin Care', batchNumber: "DEMO-2029-047", expiryOffsetDays: 540, price: 125.00, quantity: 22, lowStockThreshold: 12 },
  { medicineId: "MED-1048", name: 'Artificial Tears 10 ml', manufacturer: 'BluePeak Healthcare', category: 'Eye Care', batchNumber: "DEMO-2029-048", expiryOffsetDays: 720, price: 72.00, quantity: 36, lowStockThreshold: 15 },
  { medicineId: "MED-1049", name: 'Carboxymethylcellulose Eye Drops', manufacturer: 'DemoCare Pharmaceuticals', category: 'Eye Care', batchNumber: "DEMO-2030-049", expiryOffsetDays: 900, price: 98.00, quantity: 12, lowStockThreshold: 8 },
  { medicineId: "MED-1050", name: 'Multivitamin Syrup 200 ml', manufacturer: 'NovaMed Laboratories', category: 'Vitamins & Supplements', batchNumber: "DEMO-2030-050", expiryOffsetDays: 600, price: 110.00, quantity: 29, lowStockThreshold: 20 },
  { medicineId: "MED-1051", name: 'Dicyclomine 10 mg', manufacturer: 'WellSpring Health Products', category: 'Gastrointestinal', batchNumber: "DEMO-2030-051", expiryOffsetDays: 45, price: 25.00, quantity: 16, lowStockThreshold: 10 },
  { medicineId: "MED-1052", name: 'Lactulose Solution 100 ml', manufacturer: 'PrimeLife Pharma', category: 'Gastrointestinal', batchNumber: "DEMO-2030-052", expiryOffsetDays: 70, price: 89.00, quantity: 23, lowStockThreshold: 12 },
  { medicineId: "MED-1053", name: 'Psyllium Husk 100 g', manufacturer: 'CareBridge Laboratories', category: 'Gastrointestinal', batchNumber: "DEMO-2030-053", expiryOffsetDays: 85, price: 145.00, quantity: 31, lowStockThreshold: 15 },
  { medicineId: "MED-1054", name: 'Diclofenac Gel 30 g', manufacturer: 'BluePeak Healthcare', category: 'Pain Relief', batchNumber: "DEMO-2030-054", expiryOffsetDays: 150, price: 75.00, quantity: 44, lowStockThreshold: 8 },
  { medicineId: "MED-1055", name: 'Methyl Salicylate Balm', manufacturer: 'DemoCare Pharmaceuticals', category: 'Pain Relief', batchNumber: "DEMO-2030-055", expiryOffsetDays: 240, price: 48.00, quantity: 57, lowStockThreshold: 20 },
  { medicineId: "MED-1056", name: 'Paracetamol Suspension 60 ml', manufacturer: 'NovaMed Laboratories', category: 'Pain Relief', batchNumber: "DEMO-2030-056", expiryOffsetDays: 365, price: 38.00, quantity: 64, lowStockThreshold: 10 },
  { medicineId: "MED-1057", name: 'Amoxicillin 250 mg', manufacturer: 'WellSpring Health Products', category: 'Antibiotic', batchNumber: "DEMO-2030-057", expiryOffsetDays: 540, price: 54.00, quantity: 26, lowStockThreshold: 12 },
  { medicineId: "MED-1058", name: 'Azithromycin 250 mg', manufacturer: 'PrimeLife Pharma', category: 'Antibiotic', batchNumber: "DEMO-2030-058", expiryOffsetDays: 720, price: 78.00, quantity: 15, lowStockThreshold: 15 },
  { medicineId: "MED-1059", name: 'Cefixime 200 mg', manufacturer: 'CareBridge Laboratories', category: 'Antibiotic', batchNumber: "DEMO-2030-059", expiryOffsetDays: 900, price: 96.00, quantity: 10, lowStockThreshold: 8 },
  { medicineId: "MED-1060", name: 'Doxycycline 100 mg', manufacturer: 'BluePeak Healthcare', category: 'Antibiotic', batchNumber: "DEMO-2030-060", expiryOffsetDays: 600, price: 42.00, quantity: 18, lowStockThreshold: 20 },
  { medicineId: "MED-1061", name: 'Clotrimazole Vaginal Cream', manufacturer: 'DemoCare Pharmaceuticals', category: 'Skin Care', batchNumber: "DEMO-2031-061", expiryOffsetDays: 45, price: 105.00, quantity: 7, lowStockThreshold: 10 },
  { medicineId: "MED-1062", name: 'Hand Sanitizer 100 ml', manufacturer: 'NovaMed Laboratories', category: 'Hygiene', batchNumber: "DEMO-2031-062", expiryOffsetDays: 70, price: 45.00, quantity: 52, lowStockThreshold: 12 },
  { medicineId: "MED-1063", name: 'Medical Adhesive Tape', manufacturer: 'WellSpring Health Products', category: 'First Aid', batchNumber: "DEMO-2031-063", expiryOffsetDays: 85, price: 28.00, quantity: 66, lowStockThreshold: 15 },
  { medicineId: "MED-1064", name: 'Sterile Gauze Pack', manufacturer: 'PrimeLife Pharma', category: 'First Aid', batchNumber: "DEMO-2031-064", expiryOffsetDays: 150, price: 35.00, quantity: 43, lowStockThreshold: 8 },
  { medicineId: "MED-1065", name: 'Digital Thermometer', manufacturer: 'CareBridge Laboratories', category: 'Medical Supplies', batchNumber: "DEMO-2031-065", expiryOffsetDays: 240, price: 145.00, quantity: 12, lowStockThreshold: 20 },
  { medicineId: "MED-1066", name: 'Disposable Face Masks Pack', manufacturer: 'BluePeak Healthcare', category: 'Medical Supplies', batchNumber: "DEMO-2031-066", expiryOffsetDays: 365, price: 65.00, quantity: 80, lowStockThreshold: 10 },
  { medicineId: "MED-1067", name: 'Cotton Roll 100 g', manufacturer: 'DemoCare Pharmaceuticals', category: 'First Aid', batchNumber: "DEMO-2031-067", expiryOffsetDays: 540, price: 42.00, quantity: 38, lowStockThreshold: 12 },
  { medicineId: "MED-1068", name: 'Bandage Roll', manufacturer: 'NovaMed Laboratories', category: 'First Aid', batchNumber: "DEMO-2031-068", expiryOffsetDays: 720, price: 22.00, quantity: 50, lowStockThreshold: 15 },
  { medicineId: "MED-1069", name: 'Antacid Chewable Tablets', manufacturer: 'WellSpring Health Products', category: 'Gastrointestinal', batchNumber: "DEMO-2031-069", expiryOffsetDays: 900, price: 30.00, quantity: 95, lowStockThreshold: 8 },
  { medicineId: "MED-1070", name: 'Simethicone 80 mg', manufacturer: 'PrimeLife Pharma', category: 'Gastrointestinal', batchNumber: "DEMO-2031-070", expiryOffsetDays: 600, price: 33.00, quantity: 27, lowStockThreshold: 20 },
  { medicineId: "MED-1071", name: 'Electrolyte Powder Sachet', manufacturer: 'CareBridge Laboratories', category: 'Rehydration', batchNumber: "DEMO-2031-071", expiryOffsetDays: 45, price: 18.00, quantity: 115, lowStockThreshold: 10 },
  { medicineId: "MED-1072", name: 'Cholecalciferol 60000 IU', manufacturer: 'BluePeak Healthcare', category: 'Vitamins & Supplements', batchNumber: "DEMO-2031-072", expiryOffsetDays: 70, price: 28.00, quantity: 24, lowStockThreshold: 12 },
  { medicineId: "MED-1073", name: 'Iron + Folic Acid Tablets', manufacturer: 'DemoCare Pharmaceuticals', category: 'Vitamins & Supplements', batchNumber: "DEMO-2032-073", expiryOffsetDays: 85, price: 36.00, quantity: 41, lowStockThreshold: 15 },
  { medicineId: "MED-1074", name: 'Loratadine Syrup 60 ml', manufacturer: 'NovaMed Laboratories', category: 'Allergy', batchNumber: "DEMO-2032-074", expiryOffsetDays: 150, price: 48.00, quantity: 19, lowStockThreshold: 8 },
  { medicineId: "MED-1075", name: 'Budesonide Respules', manufacturer: 'WellSpring Health Products', category: 'Respiratory', batchNumber: "DEMO-2032-075", expiryOffsetDays: 240, price: 135.00, quantity: 6, lowStockThreshold: 20 },
  { medicineId: "MED-1076", name: 'Urea 10% Cream', manufacturer: 'PrimeLife Pharma', category: 'Skin Care', batchNumber: "DEMO-2032-076", expiryOffsetDays: 365, price: 88.00, quantity: 16, lowStockThreshold: 10 },
  { medicineId: "MED-1077", name: 'Zinc Oxide Ointment', manufacturer: 'CareBridge Laboratories', category: 'Skin Care', batchNumber: "DEMO-2032-077", expiryOffsetDays: 540, price: 52.00, quantity: 30, lowStockThreshold: 12 },
  { medicineId: "MED-1078", name: 'Oral Rehydration Solution 200 ml', manufacturer: 'BluePeak Healthcare', category: 'Rehydration', batchNumber: "DEMO-2032-078", expiryOffsetDays: 720, price: 26.00, quantity: 72, lowStockThreshold: 15 },
  { medicineId: "MED-1079", name: 'Pregnancy Test Kit', manufacturer: 'DemoCare Pharmaceuticals', category: 'Diagnostics', batchNumber: "DEMO-2032-079", expiryOffsetDays: 900, price: 55.00, quantity: 25, lowStockThreshold: 8 },
  { medicineId: "MED-1080", name: 'Glucose Test Strips Pack', manufacturer: 'NovaMed Laboratories', category: 'Diagnostics', batchNumber: "DEMO-2032-080", expiryOffsetDays: 600, price: 320.00, quantity: 13, lowStockThreshold: 20 },
  { medicineId: "MED-1081", name: 'Alcohol Swabs Pack', manufacturer: 'WellSpring Health Products', category: 'First Aid', batchNumber: "DEMO-2032-081", expiryOffsetDays: 45, price: 38.00, quantity: 58, lowStockThreshold: 10 },
  { medicineId: "MED-1082", name: 'Hot Water Bag', manufacturer: 'PrimeLife Pharma', category: 'Medical Supplies', batchNumber: "DEMO-2032-082", expiryOffsetDays: 70, price: 175.00, quantity: 9, lowStockThreshold: 12 },
  { medicineId: "MED-1083", name: 'Reusable Ice Pack', manufacturer: 'CareBridge Laboratories', category: 'Medical Supplies', batchNumber: "DEMO-2032-083", expiryOffsetDays: 85, price: 120.00, quantity: 11, lowStockThreshold: 15 }
];

async function seedDemoInventory() {
  try {
    await mongoose.connect(MONGODB_URI);
    const ids = demoMedicines.map(item => item.medicineId);
    const existing = await Medicine.find({ medicineId: { $in: ids } }).select("medicineId").lean();
    const existingIds = new Set(existing.map(item => item.medicineId));
    const now = new Date();

    const toInsert = demoMedicines
      .filter(item => !existingIds.has(item.medicineId))
      .map(({ expiryOffsetDays, ...item }) => {
        const expiryDate = new Date(now);
        expiryDate.setDate(expiryDate.getDate() + expiryOffsetDays);
        return { ...item, expiryDate };
      });

    if (toInsert.length === 0) {
      console.log("Demo inventory is already loaded. No records were added.");
      return;
    }

    await Medicine.insertMany(toInsert, { ordered: true });
    console.log(`Added ${toInsert.length} demo medicine records.`);
    console.log(`Skipped ${existingIds.size} records because their demo IDs already existed.`);
    console.log("Open the MediStock dashboard and refresh to see the inventory.");
  } catch (error) {
    console.error("Could not load demo inventory:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedDemoInventory();
