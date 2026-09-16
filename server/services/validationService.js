const normalizeMoney = (value = "") =>
  String(value)
    .trim()
    .replace(/^₹\s*/i, "")
    .replace(/^(?:rs\.?|inr)\s*/i, "")
    .replace(/,/g, ".");

const normalizeQuantity = (value = "") =>
  String(value).trim();

export const validateProductFields = (product = {}) => {
  const issues = [];

  // MRP
  const mrp = normalizeMoney(product.mrp);

  if (mrp && !/^\d+(?:\.\d{1,2})?$/.test(mrp)) {
    issues.push({
      field: "mrp",
      issue: "MRP format could not be validated.",
      severity: "High",
      status: "non_compliant",
    });
  }

  // Net quantity
  const quantity = normalizeQuantity(product.netQuantity);

  if (
    quantity &&
    !/^\d+(?:\.\d+)?\s*(?:mg|g|kg|ml|l|cl|pcs?|pieces?|nos?)$/i.test(
      quantity
    )
  ) {
    issues.push({
      field: "netQuantity",
      issue: "Net quantity format could not be validated.",
      severity: "Medium",
      status: "non_compliant",
    });
  }

  // Unit sale price
  const usp = String(product.unitSalePrice || "").trim();

  if (
    usp &&
    !/^₹\d+(?:\.\d+)?(?:\/(?:mg|g|kg|ml|l|unit|pc|piece))?$/i.test(
      usp
    )
  ) {
    issues.push({
      field: "unitSalePrice",
      issue: "Unit sale price format could not be validated.",
      severity: "Medium",
      status: "non_compliant",
    });
  }

  return issues;
};
