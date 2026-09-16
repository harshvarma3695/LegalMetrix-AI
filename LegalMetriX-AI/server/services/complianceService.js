import declarationRules from "../rules/declarationRules.js";

function hasValue(value) {
  return (
    value !== null &&
    value !== undefined &&
    String(value).trim() !== ""
  );
}

function normalizeText(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectLabel(key, text) {
  const t = normalizeText(text);

  switch (key) {
    case "manufacturer":
      return (
        /marketed\s*by/i.test(t) ||
        /manufactured\s*by/i.test(t) ||
        /manufactured\s*&\s*marketed\s*by/i.test(t) ||
        /packed\s*by/i.test(t) ||
        /packer/i.test(t) ||
        /importer/i.test(t)
      );

   case "countryOfOrigin":
  return /country\s*of\s*origin/i.test(t);

    case "genericName":
      return (
        /common\s*name/i.test(t) ||
        /generic\s*name/i.test(t) ||
        /product\s*name/i.test(t) ||
        /sour\s*cream/i.test(t) ||
        /onion/i.test(t)
      );

    case "netQuantity":
      return /net\s*(weight|quantity|wt|qty)/i.test(t);

    case "manufactureDate":
      return (
        /mfg\.?\s*date/i.test(t) ||
        /manufactur(ed|e)?\s*date/i.test(t) ||
        /date\s*of\s*mfg/i.test(t) ||
        /date\s*of\s*manufacture/i.test(t)
      );

    case "bestBefore":
      return (
        /best\s*before/i.test(t) ||
        /use\s*by/i.test(t) ||
        /expiry/i.test(t) ||
        /exp\.?\s*date/i.test(t)
      );

    case "mrp":
      // OCR may convert MRP into MRPZ / MRP2 / MRP:
      return (
        /\bmrp\s*[a-z0-9]?\b/i.test(t) ||
        /maximum\s*retail\s*price/i.test(t)
      );

    case "consumerCare":
      return (
        /consumer\s*service/i.test(t) ||
        /consumer\s*care/i.test(t) ||
        /customer\s*care/i.test(t) ||
        /call\s*us/i.test(t) ||
        /e-mail\s*us/i.test(t) ||
        /email\s*us/i.test(t)
      );

    case "dimensions":
      return (
        /\bdimensions?\b/i.test(t) ||
        /\b(length|width|height)\b/i.test(t)
      );

    case "unitSalePrice":
      return (
        /\busp\b/i.test(t) ||
        /unit\s*sale\s*price/i.test(t)
      );

    default:
      return false;
  }
}

export function evaluateCompliance(
  fields = {},
  {
    lowOcrConfidence = false,
    validationIssues = [],
    ocrText = ""
  } = {}
) {
  const declarations = declarationRules.map((rule) => {
    const value = fields[rule.key];
    const valueFound = hasValue(value);
    const labelDetected = detectLabel(rule.key, ocrText);

    let status = "needs_review";
    let reason = rule.applicability;

    /*
     * VALUE FOUND = compliant only when extraction produced
     * an actual usable value.
     */
    if (valueFound) {
      status = "compliant";
      reason = "Declaration detected and value extracted successfully.";
    }

    /*
     * LABEL FOUND BUT VALUE MISSING
     *
     * This is NOT automatically non-compliant.
     * OCR may have detected the declaration but failed to read
     * the actual value.
     */
    else if (labelDetected) {
      status = "needs_review";
      reason =
        "Declaration label detected, but its value could not be reliably extracted by OCR.";
    }

    /*
     * REQUIRED FIELD + NO LABEL
     */
    else if (rule.required) {
      status = "non_compliant";
      reason = "Required declaration was not detected by OCR.";
    }

    /*
     * OPTIONAL FIELD
     */
    else {
      status = "needs_review";
      reason = rule.applicability;
    }

    /*
     * Generic name inferred from product name
     * needs manual verification.
     */
    if (
      rule.key === "genericName" &&
      fields.genericNameSource === "inferred"
    ) {
      status = "needs_review";
      reason =
        "Product/common name was inferred from OCR. Manual verification is recommended.";
    }

    return {
      id: rule.id,
      key: rule.key,
      label: rule.label,
      required: rule.required,
      applicability: rule.applicability,
      found: valueFound || labelDetected,
      value: value || "",
      status,
      reason,
      evidence: valueFound
        ? String(value)
        : labelDetected
          ? "Declaration label detected in OCR"
          : ""
    };
  });

  /*
   * Validation problems always require review.
   */
  for (const issue of validationIssues) {
    const item = declarations.find(
      (declaration) => declaration.key === issue.field
    );

    if (item) {
      item.status = "needs_review";
      item.reason =
        issue.message || "Value requires manual verification.";
    }
  }

  /*
   * Low OCR confidence => extracted values need verification.
   */
  if (lowOcrConfidence) {
    declarations.forEach((item) => {
      if (item.status === "compliant") {
        item.status = "needs_review";
        item.reason =
          "OCR confidence is low; manual verification is recommended.";
      }
    });
  }

  const compliantCount = declarations.filter(
    (item) => item.status === "compliant"
  ).length;

  const nonCompliantCount = declarations.filter(
    (item) => item.status === "non_compliant"
  ).length;

  const reviewCount = declarations.filter(
    (item) => item.status === "needs_review"
  ).length;

  /*
   * Only required declarations and actually detected optional
   * declarations participate in the score.
   */
  const scoreDeclarations = declarations.filter(
  (item) => item.required
);

const score =
  scoreDeclarations.length > 0
    ? Math.round(
        (scoreDeclarations.filter(
          (item) => item.status === "compliant"
        ).length /
          scoreDeclarations.length) *
          100
      )
    : 0;

  let status = "compliant";

  if (nonCompliantCount > 0) {
    status = "non_compliant";
  } else if (reviewCount > 0) {
    status = "needs_review";
  }

  return {
    status,
    score,
    declarations,

    summary: {
      compliant: compliantCount,
      nonCompliant: nonCompliantCount,
      needsReview: reviewCount,
      total: declarations.length
    },

    ruleVersion:
      "Packaged Commodities Rules, 2011 - current applicable rules",

    source:
      "Department of Consumer Affairs, Legal Metrology",

    disclaimer:
      "AI/OCR screening is an assistive compliance check. Final legal compliance requires verification against the applicable current Legal Metrology rules."
  };
}
