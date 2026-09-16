import  declarationRules  from "../rules/declarationRules.js";

export function evaluateCompliance(
  fields = {},
  {
    lowOcrConfidence = false,
    validationIssues = [],
  } = {}
) {
  const declarations = declarationRules.map((rule) => {
    const value = String(fields[rule.field] || "").trim();

    const found = Boolean(value);

    const inferred =
      fields[`${rule.field}Source`] === "inferred";

    let status = "needs_review";
    let reason = rule.applicability;

    if (found && inferred) {
      status = "needs_review";
      reason =
        "Value inferred from OCR. Manual verification is recommended.";
    } else if (found) {
      status = "compliant";
      reason =
        "Declaration detected and value extracted successfully.";
    } else if (rule.required) {
      status = lowOcrConfidence
        ? "needs_review"
        : "non_compliant";

      reason = lowOcrConfidence
        ? "Required declaration was not reliably detected because OCR confidence is low."
        : "Required declaration was not detected by OCR.";
    } else {
      status = "needs_review";
      reason = rule.applicability;
    }

    const issue = validationIssues.find(
      (item) => item.field === rule.field
    );

    if (issue) {
      status = "non_compliant";
      reason = issue.issue;
    }

    return {
      id: rule.id,
      key: rule.field,
      label: rule.name,
      required: rule.required,
      applicability: rule.applicability,

      found,
      value,

      status,
      reason,

      evidence: found ? [value] : [],
    };
  });

  const compliant = declarations.filter(
    (item) => item.status === "compliant"
  ).length;

  const nonCompliant = declarations.filter(
    (item) => item.status === "non_compliant"
  ).length;

  const needsReview = declarations.filter(
    (item) => item.status === "needs_review"
  ).length;

  const requiredDeclarations = declarations.filter(
    (item) => item.required
  );

  const passedRequired = requiredDeclarations.filter(
    (item) => item.status === "compliant"
  ).length;

  const score = requiredDeclarations.length
    ? Math.round(
        (passedRequired / requiredDeclarations.length) * 100
      )
    : 0;

  let status = "compliant";

  if (nonCompliant > 0) {
    status = "non_compliant";
  } else if (needsReview > 0 || lowOcrConfidence) {
    status = "needs_review";
  }

  return {
    status,

    score,

    declarations,

    summary: {
      compliant,
      nonCompliant,
      needsReview,

      total: declarations.length,

      requiredChecks: requiredDeclarations.length,

      detected: declarations.filter(
        (item) => item.found
      ).length,

      violations: nonCompliant,
    },

    ruleVersion:
      "Packaged Commodities Rules, 2011 - current applicable rules",

    source:
      "Department of Consumer Affairs, Legal Metrology",

    disclaimer:
      "AI/OCR screening is an assistive compliance check. Final legal compliance requires verification against the applicable current Legal Metrology rules.",
  };
}