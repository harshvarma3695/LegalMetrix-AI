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
  return `INS-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase()}`;
}

function findByIdOrInspectionId(id) {
  const conditions = [
    {
      inspectionId: id,
    },
  ];

  if (mongoose.isValidObjectId(id)) {
    conditions.unshift({
      _id: id,
    });
  }

  return Inspection.findOne({
    $or: conditions,
  });
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
          message:
            "Product image is required.",
        });
      }

      console.log(
        "\n======================================"
      );

      console.log(
        "LEGALMETRIX AI - INSPECTION START"
      );

      console.log(
        "IMAGE:",
        req.file.path
      );

      console.log(
        "======================================\n"
      );

      // ===============================
      // OCR
      // ===============================

      const ocr =
        await performOCR(
          req.file.path
        );

      console.log(
        "\n========== OCR =========="
      );

      console.log(
        "CONFIDENCE:",
        ocr.confidence
      );

      console.log(
        ocr.text
      );

      console.log(
        "=========================\n"
      );

      // ===============================
      // EXTRACTION
      // ===============================

      const productFields =
        extractProductFields(
          ocr.text
        );

      console.log(
        "\n========== EXTRACTION =========="
      );

      console.log(
        JSON.stringify(
          productFields,
          null,
          2
        )
      );

      console.log(
        "================================\n"
      );

      // ===============================
      // VALIDATION
      // ===============================

      const validationIssues =
        validateProductFields(
          productFields
        );

      console.log(
        "\n========== VALIDATION =========="
      );

      console.log(
        JSON.stringify(
          validationIssues,
          null,
          2
        )
      );

      console.log(
        "================================\n"
      );

      // ===============================
      // READABILITY
      // ===============================

      const readabilityResult =
        analyzeReadability(
          ocr.words
        );

      // ===============================
      // PLACEMENT
      // ===============================

      const placementResult =
        analyzePlacement(
          ocr.text,
          ocr.words
        );

      // ===============================
      // COMPLIANCE
      // ===============================

      const complianceReport = evaluateCompliance(productFields, {
  lowOcrConfidence: ocr.confidence < 60,
  validationIssues,
});

      console.log(
        "\n========== COMPLIANCE =========="
      );

      console.log(
        JSON.stringify(
          complianceReport,
          null,
          2
        )
      );

      console.log(
        "================================\n"
      );

      // ===============================
      // SAVE
      // ===============================

      const inspection =
        await Inspection.create({
          inspectionId:
            makeInspectionId(),

          imagePath:
            req.file.path,

          originalFilename:
            req.file.originalname,

          extractedText:
            ocr.text,

          ocrConfidence:
            ocr.confidence,

          ocrWords:
            ocr.words,

          productFields,

          declarations:
            complianceReport.declarations,

          complianceReport,

          validationIssues,

          readabilityResult,

          placementResult,

          ruleVersion:
            complianceReport.ruleVersion,

          ruleSource:
            complianceReport.source,

          createdBy:
            req.user?.id || null,
        });

      console.log(
        "Inspection saved:",
        inspection.inspectionId
      );

      return res.status(201).json({
        success: true,

        message:
          "Product scanned and inspected successfully.",

        inspectionId:
          inspection.inspectionId,

        inspection,
      });
    } catch (error) {
      console.error(
        "Inspection scan error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Product scan failed.",

        error:
          error.message,
      });
    }
  }
);

router.get(
  "/:id",
  async (req, res) => {
    try {
      const inspection =
        await findByIdOrInspectionId(
          req.params.id
        );

      if (!inspection) {
        return res.status(404).json({
          success: false,
          message:
            "Inspection not found.",
        });
      }

      return res.json({
        success: true,
        inspection,
      });
    } catch (error) {
      console.error(
        "Inspection fetch error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load inspection.",
      });
    }
  }
);

export default router;
