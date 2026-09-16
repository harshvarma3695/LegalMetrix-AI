const declarationKeywords = {
  manufacturer: ["manufactured", "manufacturer", "packed by", "packer"],
  importer: ["imported by", "importer"],
  countryOfOrigin: ["country of origin", "product of"],
  genericName: ["common name", "generic name"],
  netQuantity: ["net quantity", "net wt", "net weight", "net qty"],
  manufactureDate: ["mfg", "manufacture", "manufactured", "packed on"],
  bestBefore: ["best before", "use by", "expiry", "exp."],
  mrp: ["mrp", "maximum retail price"],
  consumerCare: ["consumer care", "customer care", "helpline", "toll free"],
  dimensions: ["dimension", "dimensions", "size"],
  unitSalePrice: ["unit sale price", "usp"]
};

export function analyzePlacement(text = "", words = []) {
  const lowerText = text.toLowerCase();

  return Object.entries(declarationKeywords).map(([key, keywords]) => {
    const matched = keywords.find((keyword) =>
      lowerText.includes(keyword.toLowerCase())
    );

    const evidence = words.filter((word) =>
      keywords.some((keyword) =>
        word.text.toLowerCase().includes(keyword.toLowerCase())
      )
    );

    return {
      field: key,
      status: matched ? "detected" : "not_detected",
      keyword: matched || null,
      evidence: matched ? evidence.slice(0, 10) : [],
      note: matched
        ? "Declaration keyword/region detected. Full principal-display-panel placement requires package geometry and rule-specific review."
        : "Declaration keyword not detected by OCR."
    };
  });
}
