import express from "express";
import mongoose from "mongoose";
import Inspection from "../models/Inspection.js";
import { buildPdf, buildDocx } from "../services/reportService.js";

const router = express.Router();

function findByIdOrInspectionId(id) {
  const conditions = [{ inspectionId: id }];

  if (mongoose.isValidObjectId(id)) {
    conditions.unshift({ _id: id });
  }

  return Inspection.findOne({ $or: conditions });
}

router.get("/:id", async (req, res) => {
  try {
    const inspection = await findByIdOrInspectionId(req.params.id);

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: "Inspection not found."
      });
    }

    res.json({ success: true, inspection });
  } catch (error) {
    console.error("Report fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load report."
    });
  }
});

router.get("/:id/pdf", async (req, res) => {
  try {
    const inspection = await findByIdOrInspectionId(req.params.id);

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: "Inspection not found."
      });
    }

    buildPdf(inspection, res);
  } catch (error) {
    console.error("PDF report error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to generate PDF report."
      });
    }
  }
});

router.get("/:id/docx", async (req, res) => {
  try {
    const inspection = await findByIdOrInspectionId(req.params.id);

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: "Inspection not found."
      });
    }

    const buffer = await buildDocx(inspection);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${inspection.inspectionId}.docx"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    res.send(buffer);
  } catch (error) {
    console.error("DOCX report error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to generate editable report."
      });
    }
  }
});

export default router;
