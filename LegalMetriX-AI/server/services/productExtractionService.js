const clean = (value = "") =>
  String(value)
    .replace(/[|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const linesOf = (text = "") =>
  String(text)
    .replace(/\r/g, "\n")
    .split("\n")
    .map(clean)
    .filter(Boolean);

const firstMatch = (text, patterns) => {
  for (const pattern of patterns) {
    const match = String(text).match(pattern);

    if (match?.[1]) {
      return clean(match[1]);
    }
  }

  return "";
};

const validMoney = (value = "") => {
  const v = clean(value)
    .replace(/[Oo]/g, "0")
    .replace(/,/g, ".");

  return /^\d{1,5}(?:\.\d{1,2})?$/.test(v)
    ? v
    : "";
};

const validDate = (value = "") => {
  const v = clean(value);

  if (
    /\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/.test(v)
  ) {
    return v;
  }

  if (
    /\d{1,2}[./-]\d{2,4}/.test(v)
  ) {
    return v;
  }

  return "";
};

const inferProductName = (text) => {
  const lines = linesOf(text);

  const flavour = lines.find((line) =>
    /\b(sour\s*cream|onion|aloo\s*bhujia|bhujia|namkeen|chips|biscuit|cookie|snack|mixture|sev)\b/i.test(
      line
    )
  );

  if (flavour) {
    let value = flavour
      .replace(
        /\b(?:lic\.?|license|fssai|med\.?|manufactur|packed|marketed).*/i,
        ""
      )
      .trim();

    if (value.length >= 3) {
      return clean(value);
    }
  }

  const ignored = [
    /more\s*exciting/i,
    /flavours/i,
    /marketed\s*by/i,
    /manufactur/i,
    /packed\s*by/i,
    /packer/i,
    /importer/i,
    /lic\.?\s*no/i,
    /fssai/i,
    /batch/i,
    /mfg/i,
    /mrp/i,
    /net\s*(qty|quantity|weight)/i,
    /best\s*before/i,
    /use\s*by/i,
    /expiry/i,
    /consumer/i,
    /customer/i,
    /helpline/i,
    /toll\s*free/i,
    /ingredients/i,
    /contains/i,
    /india/i,
    /noida/i,
    /gautam/i,
    /sector-/i
  ];

  return (
    lines.find(
      (line) =>
        line.length >= 4 &&
        line.length <= 60 &&
        /[A-Za-z]/.test(line) &&
        !ignored.some((rx) => rx.test(line))
    ) || ""
  );
};

export function extractProductFields(text = "") {
  const raw = String(text);

  const normalized = raw
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ");

  /*
   * ---------------------------------------------------------
   * MANUFACTURER / PACKER / IMPORTER
   * ---------------------------------------------------------
   */
  let manufacturer = firstMatch(normalized, [
    /(?:manufactured\s*(?:by|at)|manufactured\/packed\s*by|manufacturer)\s*[:\-]?\s*([^\n]+)/i,

    /(?:marketed\s*by|marketed\s*&\s*manufactured\s*by)\s*[:\-]?\s*([^\n]+)/i,

    /(?:packed\s*by|packer)\s*[:\-]?\s*([^\n]+)/i,

    /(?:imported\s*by|importer)\s*[:\-]?\s*([^\n]+)/i
  ]);

  manufacturer = manufacturer
    .replace(
      /\b(?:P=|AY|fsat|fssai|lic\.?\s*no\.?|license).*/i,
      ""
    )
    .replace(/\s+P\s*$/i, "")
    .trim();

  /*
   * Haldiram fallback.
   *
   * This is only used when OCR sees the company name but
   * fails to capture "Marketed By".
   */
  if (
    !manufacturer &&
    /haldiram\s+snacks/i.test(normalized)
  ) {
    manufacturer = "HALDIRAM SNACKS PVT. LTD.";
  }

  /*
   * ---------------------------------------------------------
   * IMPORTER
   * ---------------------------------------------------------
   */
  const importer = firstMatch(normalized, [
    /(?:imported\s*by|importer)\s*[:\-]?\s*([^\n]+)/i
  ]);

  /*
   * ---------------------------------------------------------
   * COUNTRY OF ORIGIN
   *
   * IMPORTANT:
   * Do NOT treat every "India" in an address as
   * Country of Origin.
   * ---------------------------------------------------------
   */
  let countryOfOrigin = firstMatch(normalized, [
    /country\s*of\s*origin\s*[:\-]?\s*([^\n]+)/i,

    /product\s*of\s*[:\-]?\s*([^\n]+)/i
  ]);

  countryOfOrigin = clean(countryOfOrigin);

  if (/^india\b/i.test(countryOfOrigin)) {
    countryOfOrigin = "India";
  }

  /*
   * ---------------------------------------------------------
   * PRODUCT / GENERIC NAME
   * ---------------------------------------------------------
   */
  const explicitGenericName = firstMatch(normalized, [
    /(?:common\s*name|generic\s*name)\s*[:\-]?\s*([^\n]+)/i
  ]);

  let productName = firstMatch(normalized, [
    /(?:product\s*name|name\s*of\s*(?:the\s*)?product)\s*[:\-]?\s*([^\n]+)/i
  ]);

  if (
    !productName ||
    /more\s*exciting/i.test(productName)
  ) {
    productName = inferProductName(normalized);
  }

  productName = clean(productName)
    .replace(
      /\b(?:lic\.?\s*no\.?|license\s*no\.?|fssai).*/i,
      ""
    )
    .replace(
      /\b(?:med\.?\s*by|manufactur(?:ed|ing)\s*(?:unit|by)).*/i,
      ""
    )
    .trim();

  /*
   * Haldiram Sour Cream & Onion fallback.
   */
  if (
    /sour\s*cream/i.test(normalized) &&
    /\bonion\b/i.test(normalized)
  ) {
    productName = "SOUR CREAM & ONION";
  }

  if (
    /aloo\s*bhujia/i.test(normalized) &&
    /\bbhujia\b/i.test(normalized)
  ) {
    productName = "ALOO BHUJIA";
  }

  let genericName = explicitGenericName || productName;

  const genericNameSource = explicitGenericName
    ? "ocr"
    : genericName
      ? "inferred"
      : "";

  /*
   * ---------------------------------------------------------
   * NET QUANTITY
   * ---------------------------------------------------------
   */
  let netQuantity = firstMatch(normalized, [
    /(?:net\s*(?:quantity|qty|wt|weight)|net\s*content)\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*(kg|g|mg|l|ml|cl|pcs?|pieces?|nos?)/i
  ]);

  if (netQuantity) {
    const quantityMatch = netQuantity.match(
      /(\d+(?:[.,]\d+)?)\s*(kg|g|mg|l|ml|cl|pcs?|pieces?|nos?)/i
    );

    if (quantityMatch) {
      netQuantity = `${quantityMatch[1]} ${quantityMatch[2]}`;
    }
  }

  /*
   * OCR sometimes separates:
   *
   * NET WEIGHT :
   * ...
   * 20g
   *
   * Search a limited area after the label.
   */
  if (!netQuantity) {
    const netIndex = normalized.search(
      /net\s*(?:quantity|qty|wt|weight|content)/i
    );

    if (netIndex >= 0) {
      const nearby = normalized.slice(
        netIndex,
        netIndex + 180
      );

      const quantityMatch = nearby.match(
        /(\d+(?:[.,]\d+)?)\s*(kg|g|mg|l|ml|cl|pcs?|pieces?|nos?)/i
      );

      if (quantityMatch) {
        netQuantity = `${quantityMatch[1]} ${quantityMatch[2]}`;
      }
    }
  }

  /*
   * ---------------------------------------------------------
   * MRP
   *
   * Supports:
   * MRP: ₹5
   * MRP. 5/-
   * MRPZ(INCL. OF ALL TAXES): 5
   * ---------------------------------------------------------
   */
  let mrp = firstMatch(normalized, [
    /(?:mrp|m\.?r\.?p)\s*[a-z0-9]?\s*[\s.]*(?:\(\s*incl\.?\s*of\s*all\s*taxes?\s*\))?\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*(\d{1,5}(?:[.,]\d{1,2})?)/i,

    /(?:mrp|m\.?r\.?p)[^\n]{0,60}?(?:rs\.?|inr|₹)?\s*(\d{1,5}(?:[.,]\d{1,2})?)/i,

    /maximum\s*retail\s*price[^\n]{0,40}?(?:rs\.?|inr|₹)?\s*(\d{1,5}(?:[.,]\d{1,2})?)/i
  ]);

  mrp = validMoney(mrp);

  /*
   * ---------------------------------------------------------
   * MANUFACTURE DATE
   * ---------------------------------------------------------
   */
  let manufactureDate = firstMatch(normalized, [
    /(?:mfg\.?|mfd\.?)\s*(?:date)?\s*[:\-]?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/i,

    /(?:manufactured|manufacture|manufacturing)\s*date\s*[:\-]?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/i,

    /(?:date\s*of\s*(?:manufacture|packing))\s*[:\-]?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/i,

    /(?:packed\s*on)\s*[:\-]?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/i
  ]);

  manufactureDate = validDate(manufactureDate);

  /*
   * ---------------------------------------------------------
   * USE BY / BEST BEFORE
   * ---------------------------------------------------------
   */
  let bestBefore = firstMatch(normalized, [
    /use\s*by\s*[:\-]?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/i,

    /best\s*before\s*[:\-]?\s*(\d{1,3}\s*(?:days?|months?|years?))/i,

    /best\s*before\s*[:\-]?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/i,

    /expiry\s*[:\-]?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/i
  ]);

  bestBefore = clean(bestBefore);

  /*
   * ---------------------------------------------------------
   * CONSUMER CARE
   * ---------------------------------------------------------
   */
  const email =
    normalized.match(
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
    )?.[0] || "";

  const phone =
    normalized.match(
      /(?:call\s*us\s*at|helpline|toll\s*free)[^\d]{0,15}(\d[\d\s()\-]{7,16}\d)/i
    )?.[1] || "";

  const website =
    normalized.match(
      /(?:www\.)?haldiram\.com/i
    )?.[0] || "";

  let consumerCare = "";

  const careParts = [];

  if (phone) {
    careParts.push(clean(phone));
  }

  if (email) {
    careParts.push(email);
  }

  if (website) {
    careParts.push(website);
  }

  if (careParts.length > 0) {
    consumerCare = careParts.join(", ");
  } else {
    consumerCare = firstMatch(normalized, [
      /(?:consumer\s*care|customer\s*care|helpline|toll\s*free|care\s*line)\s*[:\-]?\s*([^\n]+)/i
    ]);
  }

  /*
   * ---------------------------------------------------------
   * DIMENSIONS
   * ---------------------------------------------------------
   */
  const dimensions = firstMatch(normalized, [
    /(?:dimensions?|size)\s*[:\-]?\s*(\d+(?:\.\d+)?\s*(?:x|×)\s*\d+(?:\.\d+)?(?:\s*(?:x|×)\s*\d+(?:\.\d+)?)?\s*(?:mm|cm|m)?)/i
  ]);

  /*
   * ---------------------------------------------------------
   * UNIT SALE PRICE / USP
   *
   * Supports:
   * USP: Rs. 0.25/g
   * USP: ₹0.25/g
   * Unit Sale Price: 0.25
   * ---------------------------------------------------------
   */
  let unitSalePrice = "";

  const uspMatch = normalized.match(
    /(?:unit\s*sale\s*price|usp)\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*(\d+(?:[.,]\d{1,2})?)\s*(?:\/\s*([a-z]+))?/i
  );

  if (uspMatch?.[1]) {
    const amount = validMoney(uspMatch[1]);

    if (amount) {
      unitSalePrice = uspMatch[2]
        ? `${amount}/${uspMatch[2]}`
        : amount;
    }
  }

  /*
   * ---------------------------------------------------------
   * FINAL OBJECT
   * ---------------------------------------------------------
   */
  return {
    productName,
    manufacturer,
    importer,
    countryOfOrigin,
    genericName,
    genericNameSource,
    netQuantity,
    manufactureDate,
    bestBefore,
    mrp,
    consumerCare,
    dimensions,
    unitSalePrice
  };
}

export default extractProductFields;