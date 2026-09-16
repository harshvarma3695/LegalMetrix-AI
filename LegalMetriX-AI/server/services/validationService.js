export const validateProductFields = (product = {}) => {
  const issues = [];

  const mrp = String(product.mrp || "").trim();

  if (mrp && !/^\d+(?:[.,]\d{1,2})?$/.test(mrp)) {
    issues.push({
      field: "mrp",
      issue: "MRP format could not be validated.",
      severity: "High",
      status: "non_compliant"
    });
  }

  const netQuantity = String(product.netQuantity || "").trim();

  if (
    netQuantity &&
    !/^\d+(?:[.,]\d+)?\s*(?:mg|g|kg|ml|l|cl|pcs?|pieces?|nos?)$/i.test(netQuantity)
  ) {
    issues.push({
      field: "netQuantity",
      issue: "Net quantity format could not be validated.",
      severity: "Medium",
      status: "non_compliant"
    });
  }

  return issues;
};
