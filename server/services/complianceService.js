import declarationRules from "../rules/declarationRules.js";

function text(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeStatus(status) {
  if (status === "compliant") return "compliant";
  if (status === "non_compliant") return "non_compliant";
  return "needs_review";
}

export function evaluateCompliance(
  fields = {},
  {
    lowOcrConfidence = false,
    validationIssues = [],
  } = {}
) {
  const declarations = [];

  for (const rule of declarationRules) {
    /*
      IMPORTANT:
      declarationRules uses `key` and `label`.
      Earlier service was checking the wrong property,
      causing every declaration to become found:false.
    */

    const key = rule.key;
    const label = rule.label;

    const rawValue = fields[key];
    const value = text(rawValue);

    const found = value.length > 0;

    let status = "needs_review";
    let reason = "";

    if (found) {
      status = "compliant";

      // Generic name inferred from product name needs human review.
      if (
        key === "genericName" &&
        fields.genericNameSource === "inferred"
      ) {
        status = "needs_review";
        reason =
          "Generic/common name was inferred from the detected product name and should be verified.";
      } else {
        reason = "Declaration detected by OCR.";
      }
    } else if (rule.required) {
      status = lowOcrConfidence
        ? "needs_review"
        : "non_compliant";

      reason = lowOcrConfidence
        ? "Declaration was not confidently detected because OCR confidence is low."
        : "Required declaration was not detected by OCR.";
    } else {
      status = "needs_review";
      reason = rule.applicability || "Applicability requires review.";
    }

    declarations.push({
      id: rule.id,
      key,
      label,
      required: Boolean(rule.required),
      applicability: rule.applicability || "",
      found,
      value,
      status: normalizeStatus(status),
      reason,
      evidence: value ? [value] : [],
    });
  }

  /*
    Validation problems are real compliance issues.
    Only override the declaration related to the validation field.
  */

  for (const issue of validationIssues) {
    const declaration = declarations.find(
      (item) => item.key === issue.field
    );

    if (declaration) {
      declaration.status = "non_compliant";
      declaration.reason = issue.issue || "Validation failed.";
    }
  }

  const requiredDeclarations = declarations.filter(
    (item) => item.required
  );

  const compliantRequired = requiredDeclarations.filter(
    (item) => item.status === "compliant"
  );

  const nonCompliant = declarations.filter(
    (item) => item.status === "non_compliant"
  );

  const needsReview = declarations.filter(
    (item) => item.status === "needs_review"
  );

  /*
    Score only based on required declarations.
    This prevents optional declarations from unfairly
    reducing the compliance percentage.
  */

  const score =
    requiredDeclarations.length > 0
      ? Math.round(
          (compliantRequired.length / requiredDeclarations.length) * 100
        )
      : 0;

  let status = "compliant";

  if (nonCompliant.length > 0) {
    status = "non_compliant";
  } else if (needsReview.length > 0) {
    status = "needs_review";
  }

  return {
    status,
    score,

    declarations,

    summary: {
      compliant: declarations.filter(
        (item) => item.status === "compliant"
      ).length,

      nonCompliant: nonCompliant.length,

      needsReview: needsReview.length,

      total: declarations.length,

      requiredChecks: requiredDeclarations.length,

      detected: declarations.filter(
        (item) => item.found
      ).length,

      violations: nonCompliant.length,
    },

    ruleVersion:
      "Packaged Commodities Rules, 2011 - current applicable rules",

    source:
      "Department of Consumer Affairs, Legal Metrology",

    disclaimer:
      "AI/OCR screening is an assistive compliance check. Final legal compliance requires verification against the applicable current Legal Metrology rules.",
  };
}

export default evaluateCompliance;