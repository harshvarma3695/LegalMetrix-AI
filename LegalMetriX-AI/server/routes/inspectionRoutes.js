import express from "express";
import mongoose from "mongoose";
import { uploadProductImage } from "../middleware/uploadMiddleware.js";
import { optionalAuth } from "../middleware/authMiddleware.js";
import Inspection from "../models/Inspection.js";
import { performOCR } from "../services/ocrService.js";
import { extractProductFields } from "../services/productExtractionService.js";
import { analyzeReadability } from "../services/readabilityService.js";
import { analyzePlacement } from "../services/placementService.js";
import { evaluateCompliance } from "../services/complianceService.js";
import { validateProductFields } from "../services/validationService.js";

const router = express.Router();

function makeInspectionId() {
  return `INS-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function findByIdOrInspectionId(id) {
  const conditions = [{ inspectionId: id }];

  if (mongoose.isValidObjectId(id)) {
    conditions.unshift({ _id: id });
  }

  return Inspection.findOne({ $or: conditions });
}

router.post(
  "/scan",
  optionalAuth,
  uploadProductImage.single("productImage"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Product image is required.",
        });
      }

      console.log("Image uploaded:", req.file.path);

      const ocr = await performOCR(req.file.path);
      const productFields = extractProductFields(ocr.text);
      console.log("/n --------PRODUCT EXTRACTION DEBUG--------");
      console.log(JSON.stringify(productFields,null,2));
      console.log("----------------------------\n");
      
      
      
      const validationIssues = validateProductFields(productFields);
      const readabilityResult = analyzeReadability(ocr.words);
      const placementResult = analyzePlacement(ocr.text, ocr.words);

      const complianceReport = evaluateCompliance(productFields, {
  lowOcrConfidence: ocr.confidence < 60,
  validationIssues,
  ocrText: ocr.text,
});

      const inspection = await Inspection.create({
        inspectionId: makeInspectionId(),
        imagePath: req.file.path,
        originalFilename: req.file.originalname,
        extractedText: ocr.text,
        ocrConfidence: ocr.confidence,
        ocrWords: ocr.words,
        productFields,
        declarations: complianceReport.declarations,
        complianceReport,
        validationIssues,
        readabilityResult,
        placementResult,
        ruleVersion: complianceReport.ruleVersion,
        ruleSource: complianceReport.source,
        createdBy: req.user?.id || null,
      });

      res.status(201).json({
        success: true,
        message: "Product scanned and inspected successfully.",
        inspectionId: inspection.inspectionId,
        inspection,
      });
    } catch (error) {
      console.error("Inspection scan error:", error);

      res.status(500).json({
        success: false,
        message: "Product scan failed.",
        error: error.message,
      });
    }
  },
);

router.get("/:id", async (req, res) => {
  try {
    const inspection = await findByIdOrInspectionId(req.params.id);

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: "Inspection not found.",
      });
    }

    res.json({ success: true, inspection });
  } catch (error) {
    console.error("Inspection fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load inspection.",
    });
  }
});

export default router;
