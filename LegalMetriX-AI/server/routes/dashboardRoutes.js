import express from "express";
import Inspection from "../models/Inspection.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [totalInspections, compliant, nonCompliant, needsReview, recent] =
      await Promise.all([
        Inspection.countDocuments(),
        Inspection.countDocuments({ "complianceReport.status": "compliant" }),
        Inspection.countDocuments({ "complianceReport.status": "non_compliant" }),
        Inspection.countDocuments({ "complianceReport.status": "needs_review" }),
        Inspection.find()
          .sort({ createdAt: -1 })
          .limit(10)
          .select("inspectionId productFields complianceReport createdAt ocrConfidence")
          .lean()
      ]);

    const violations = {};

    const violationRows = await Inspection.find({
      "complianceReport.status": "non_compliant"
    })
      .select("declarations")
      .lean();

    for (const row of violationRows) {
      for (const declaration of row.declarations || []) {
        if (declaration.status !== "non_compliant") continue;
        const key = declaration.key || declaration.label || "unknown";
        violations[key] = (violations[key] || 0) + 1;
      }
    }

    const topViolations = Object.entries(violations)
      .sort((a, b) => b[1] - a[1])
      .map(([field, count]) => ({ field, count }));

    res.json({
      success: true,
      data: {
        totalInspections,
        compliant,
        nonCompliant,
        needsReview,
        recent,
        topViolations
      }
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard."
    });
  }
});

export default router;
