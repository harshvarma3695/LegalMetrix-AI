import mongoose from "mongoose";

const declarationSchema = new mongoose.Schema(
  {
    id: String,
    key: String,
    label: String,
    required: Boolean,
    applicability: String,
    found: Boolean,
    value: String,
    status: {
      type: String,
      enum: ["compliant", "non_compliant", "needs_review"]
    },
    reason: String,
    evidence: [String]
  },
  { _id: false }
);

const inspectionSchema = new mongoose.Schema(
  {
    inspectionId: { type: String, unique: true, index: true, required: true },
    imagePath: { type: String, required: true },
    originalFilename: String,
    extractedText: { type: String, default: "" },
    ocrConfidence: { type: Number, default: 0 },
    ocrWords: { type: Array, default: [] },
    productFields: { type: Object, default: {} },
    declarations: { type: [declarationSchema], default: [] },
    complianceReport: { type: Object, default: {} },
    validationIssues: { type: Array, default: [] },
    readabilityResult: { type: Array, default: [] },
    placementResult: { type: Array, default: [] },
    ruleVersion: { type: String, default: "PCR-2011-current-baseline" },
    ruleSource: { type: String, default: "Department of Consumer Affairs" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model("Inspection", inspectionSchema);
