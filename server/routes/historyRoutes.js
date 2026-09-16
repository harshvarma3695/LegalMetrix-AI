import express from "express";
import Inspection from "../models/Inspection.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "").trim();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));

    const query = {};

    if (["compliant", "non_compliant", "needs_review"].includes(status)) {
      query["complianceReport.status"] = status;
    }

    if (search) {
      query.$or = [
        { inspectionId: { $regex: search, $options: "i" } },
        { extractedText: { $regex: search, $options: "i" } },
        { "productFields.productName": { $regex: search, $options: "i" } },
        { "productFields.genericName": { $regex: search, $options: "i" } },
        { "productFields.manufacturer": { $regex: search, $options: "i" } },
        { "productFields.mrp": { $regex: search, $options: "i" } }
      ];
    }

    const skip = (page - 1) * limit;

    const [inspections, total] = await Promise.all([
      Inspection.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Inspection.countDocuments(query)
    ]);

    res.json({
      success: true,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      inspections
    });
  } catch (error) {
    console.error("History error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load inspection history."
    });
  }
});

export default router;
