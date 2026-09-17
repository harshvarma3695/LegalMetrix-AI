const declarationRules = [
  {
    id: "LM-001",
    key: "manufacturer",
    label: "Manufacturer / Packer / Importer",
    required: true,
    applicability: "Required declaration.",
  },

  {
    id: "LM-002",
    key: "countryOfOrigin",
    label: "Country of Origin",
    required: false,
    applicability: "Applicable when the product is imported.",
  },

  {
    id: "LM-003",
    key: "genericName",
    label: "Common / Generic Name",
    required: true,
    applicability: "Required declaration.",
  },

  {
    id: "LM-004",
    key: "netQuantity",
    label: "Net Quantity / Net Weight",
    required: true,
    applicability: "Required declaration.",
  },

  {
    id: "LM-005",
    key: "manufactureDate",
    label: "Month / Year of Manufacture",
    required: true,
    applicability: "Required declaration.",
  },

  {
    id: "LM-006",
    key: "bestBefore",
    label: "Best Before / Use By",
    required: false,
    applicability:
      "Applicable where the commodity may become unfit for human consumption after a period.",
  },

  {
    id: "LM-007",
    key: "mrp",
    label: "Retail Sale Price (MRP)",
    required: true,
    applicability: "Required declaration.",
  },

  {
    id: "LM-008",
    key: "consumerCare",
    label: "Consumer Care Details",
    required: true,
    applicability: "Required declaration.",
  },

  {
    id: "LM-009",
    key: "dimensions",
    label: "Dimensions",
    required: false,
    applicability:
      "Applicable where dimensions are relevant to the commodity/package.",
  },

  {
    id: "LM-010",
    key: "unitSalePrice",
    label: "Unit Sale Price",
    required: false,
    applicability:
      "Applicable subject to current rules and applicable exceptions.",
  },
];

export default declarationRules;
