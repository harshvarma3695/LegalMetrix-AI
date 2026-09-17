const normalizeMoney = (value = "") =>
  String(value)
    .trim()
    .replace(/^₹\s*/i, "")
    .replace(/^(?:rs\.?|inr)\s*/i, "")
    .replace(/,/g, ".");

const validUnitSalePrice = (value = "") => {
  const v = String(value).trim();

  return (
    /^(?:₹|rs\.?|inr)?\s*\d+(?:\.\d{1,2})?\s*\/\s*(?:mg|g|kg|ml|cl|l|unit|pc|pcs|piece|pieces|no|nos)$/i.test(
      v
    ) ||
    /^(?:₹|rs\.?|inr)?\s*\d+(?:\.\d{1,2})?\s+per\s+(?:mg|g|kg|ml|cl|l|unit|pc|pcs|piece|pieces|no|nos)$/i.test(
      v
    )
  );
};

export const validateProductFields = (
  product = {}
) => {
  const issues = [];

  /* MRP */

  const mrp = normalizeMoney(product.mrp);

  if (
    mrp &&
    !/^\d+(?:\.\d{1,2})?$/.test(mrp)
  ) {
    issues.push({
      field: "mrp",
      issue:
        "MRP format could not be validated.",
      severity: "High",
      status: "non_compliant"
    });
  }

  /* NET QUANTITY */

  const netQuantity = String(
    product.netQuantity || ""
  ).trim();

  if (
    netQuantity &&
    !/^\d+(?:\.\d+)?\s*(?:mg|g|kg|ml|l|cl|pcs?|pieces?|nos?)$/i.test(
      netQuantity
    )
  ) {
    issues.push({
      field: "netQuantity",
      issue:
        "Net quantity format could not be validated.",
      severity: "Medium",
      status: "non_compliant"
    });
  }

  /* UNIT SALE PRICE */

  const unitSalePrice = String(
    product.unitSalePrice || ""
  ).trim();

  if (
    unitSalePrice &&
    !validUnitSalePrice(unitSalePrice)
  ) {
    issues.push({
      field: "unitSalePrice",
      issue:
        "Unit sale price format could not be validated.",
      severity: "Medium",
      status: "non_compliant"
    });
  }

  return issues;
};