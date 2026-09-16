function clean(value = "") {
  return String(value)
    .replace(/\s+/g, " ")
    .replace(/[|]+/g, " ")
    .trim();
}

function linesOf(text = "") {
  return String(text)
    .split(/\r?\n/)
    .map(clean)
    .filter(Boolean);
}

function normalizeOCR(text = "") {
  return String(text)
    .replace(/[₹]/g, "Rs ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function normalizeDigits(value = "") {
  return String(value)
    .replace(/[Oo]/g, "0")
    .replace(/[Il]/g, "1")
    .replace(/[Ss]/g, "5")
    .replace(/[Bb]/g, "8");
}

function firstMatch(lines, patterns) {
  for (const line of lines) {
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        return clean(match[1] || match[0]);
      }
    }
  }

  return "";
}

function nearbyLine(lines, index) {
  return [
    lines[index - 1] || "",
    lines[index] || "",
    lines[index + 1] || "",
    lines[index + 2] || "",
  ]
    .map(clean)
    .filter(Boolean)
    .join(" ");
}

/* -------------------------------------------------
   MANUFACTURER / PACKER / IMPORTER
------------------------------------------------- */

function extractManufacturer(lines) {
  const labelPatterns = [
    /(?:manufactured|manufactured\s*by|manufactured\s*&\s*marketed\s*by)\s*[:\-]?\s*(.+)$/i,
    /(?:manufactured\s+at|packed\s+by|packed\s+at)\s*[:\-]?\s*(.+)$/i,
    /(?:manufacturer|manufacturer\/packer|manufacturer\s*\/\s*packer)\s*[:\-]?\s*(.+)$/i,
    /(?:packer|packed\s+for)\s*[:\-]?\s*(.+)$/i,
    /(?:importer|imported\s+by)\s*[:\-]?\s*(.+)$/i,
  ];

  const value = firstMatch(lines, labelPatterns);

  if (value) {
    return value
      .replace(/^(by|at|:|-)\s*/i, "")
      .trim();
  }

  const companyCandidates = lines.filter((line) =>
    /\b(private\s+limited|pvt\.?\s*ltd\.?|limited|ltd\.?|industries|foods?|food\s+products?|enterprises?|company|co\.?)\b/i.test(
      line
    )
  );

  if (companyCandidates.length > 0) {
    companyCandidates.sort((a, b) => {
      const score = (value) => {
        let s = 0;

        if (/\bprivate\s+limited\b/i.test(value)) s += 5;
        if (/\bpvt\.?\s*ltd\.?\b/i.test(value)) s += 5;
        if (/\bltd\.?\b/i.test(value)) s += 4;
        if (/\bfoods?\b/i.test(value)) s += 2;
        if (/\bmanufactur/i.test(value)) s += 4;

        return s;
      };

      return score(b) - score(a);
    });

    return companyCandidates[0];
  }

  return "";
}

/* -------------------------------------------------
   PRODUCT NAME
------------------------------------------------- */

function extractProductName(lines) {
  const explicitPatterns = [
    /(?:product\s*name|name\s+of\s+product)\s*[:\-]\s*(.+)$/i,
    /(?:common\s+name|generic\s+name)\s*[:\-]\s*(.+)$/i,
  ];

  const explicit = firstMatch(lines, explicitPatterns);

  if (explicit) {
    return explicit;
  }

  /*
    Product-name candidates:
    Avoid declaration/legal/instruction lines.
  */

  const ignored = [
    /manufacturer/i,
    /manufactured/i,
    /packer/i,
    /packed/i,
    /importer/i,
    /mrp/i,
    /maximum\s+retail/i,
    /net\s+(quantity|weight)/i,
    /best\s+before/i,
    /use\s+by/i,
    /expiry/i,
    /mfg/i,
    /manufacture/i,
    /consumer\s+care/i,
    /customer\s+care/i,
    /country\s+of\s+origin/i,
    /made\s+in/i,
    /ingredients/i,
    /nutrition/i,
    /barcode/i,
    /batch/i,
    /lot/i,
    /usp/i,
    /unit\s+sale/i,
    /ready[- ]to[- ]eat/i,
  ];

  const candidates = lines.filter((line) => {
    if (line.length < 3 || line.length > 60) return false;
    if (ignored.some((pattern) => pattern.test(line))) return false;
    if (/^\d+$/.test(line)) return false;

    return /[A-Za-z]/.test(line);
  });

  /*
    Prefer short, product-like lines.
  */

  candidates.sort((a, b) => {
    const score = (line) => {
      let s = 0;

      if (line.length <= 30) s += 3;
      if (line.length <= 20) s += 2;
      if (/^[A-Z0-9 &-]+$/.test(line)) s += 3;
      if (!/\d{5,}/.test(line)) s += 2;

      return s;
    };

    return score(b) - score(a);
  });

  return candidates[0] || "";
}

/* -------------------------------------------------
   NET QUANTITY
------------------------------------------------- */

function extractNetQuantity(lines) {
  const patterns = [
    /(?:net\s*quantity|net\s*weight|net\s*wt\.?|net|quantity|content|contents|weight)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?\s*(?:kg|g|mg|l|ml|cl|pcs?|pieces?|nos?))\b/i,

    /(?:net\s*quantity|net\s*weight|net\s*wt\.?|quantity|content|contents|weight)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(kg|g|mg|l|ml|cl|pcs?|pieces?|nos?)\b/i,
  ];

  for (const line of lines) {
    const normalized = normalizeDigits(line);

    for (const pattern of patterns) {
      const match = normalized.match(pattern);

      if (match) {
        if (match[2]) {
          return `${match[1]} ${match[2]}`.replace(/\s+/g, " ");
        }

        return clean(match[1]);
      }
    }
  }

  return "";
}

/* -------------------------------------------------
   MRP
------------------------------------------------- */

function extractMRP(lines) {
  const patterns = [
    /(?:mrp|m\.r\.p\.|maximum\s+retail\s+price|retail\s+sale\s+price)\s*[:.]?\s*(?:rs\.?|inr)?\s*([0-9]+(?:\.[0-9]{1,2})?)/i,

    /(?:mrp|m\.r\.p\.|maximum\s+retail\s+price|retail\s+sale\s+price)[^0-9]{0,15}([0-9]+(?:\.[0-9]{1,2})?)/i,
  ];

  for (const line of lines) {
    const normalized = normalizeDigits(line);

    for (const pattern of patterns) {
      const match = normalized.match(pattern);

      if (match) {
        return `Rs ${match[1]}`;
      }
    }
  }

  return "";
}

/* -------------------------------------------------
   MANUFACTURE / PACKING DATE
------------------------------------------------- */

function extractManufactureDate(lines) {
  const patterns = [
    /(?:mfg\.?|mfd\.?|manufactured|manufacture|date\s+of\s+manufacture|date\s+of\s+packing|packed\s+on|packing\s+date)\s*(?:date)?\s*[:.\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,

    /(?:mfg\.?|mfd\.?|manufactured|manufacture|packed|packing)[^0-9]{0,15}(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
  ];

  for (const line of lines) {
    const normalized = normalizeDigits(line);

    for (const pattern of patterns) {
      const match = normalized.match(pattern);

      if (match) {
        return match[1];
      }
    }
  }

  return "";
}

/* -------------------------------------------------
   BEST BEFORE / USE BY / EXPIRY
------------------------------------------------- */

function extractBestBefore(lines) {
  const patterns = [
    /(?:best\s*before|best\s*within|use\s*by|expiry|expires?\s*on)\s*[:.\-]?\s*(.+)$/i,
  ];

  return firstMatch(lines, patterns);
}

/* -------------------------------------------------
   COUNTRY OF ORIGIN
------------------------------------------------- */

function extractCountryOfOrigin(lines) {
  const patterns = [
    /country\s+of\s+origin\s*[:\-]?\s*(.+)$/i,
    /made\s+in\s*[:\-]?\s*(.+)$/i,
    /product\s+of\s*[:\-]?\s*(.+)$/i,
  ];

  return firstMatch(lines, patterns);
}

/* -------------------------------------------------
   CONSUMER CARE
------------------------------------------------- */

function extractConsumerCare(lines) {
  const results = [];

  const phoneRegex =
    /(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b|\b0\d{2,4}[\s-]?\d{6,8}\b/g;

  const emailRegex =
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (
      /consumer\s+care|customer\s+care|contact\s+us|helpline|toll\s*free|complaint|feedback/i.test(
        line
      )
    ) {
      const context = nearbyLine(lines, i);

      const phones = context.match(phoneRegex) || [];
      const emails = context.match(emailRegex) || [];

      results.push(...phones, ...emails);
    }
  }

  return [...new Set(results)].join(", ");
}

/* -------------------------------------------------
   DIMENSIONS
------------------------------------------------- */

function extractDimensions(lines) {
  const patterns = [
    /(?:dimension|dimensions|size)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?\s*[xX×]\s*[0-9]+(?:\.[0-9]+)?(?:\s*[xX×]\s*[0-9]+(?:\.[0-9]+)?)?\s*(?:mm|cm|m)?)/i,

    /([0-9]+(?:\.[0-9]+)?\s*[xX×]\s*[0-9]+(?:\.[0-9]+)?(?:\s*[xX×]\s*[0-9]+(?:\.[0-9]+)?)?\s*(?:mm|cm|m))/i,
  ];

  for (const line of lines) {
    for (const pattern of patterns) {
      const match = line.match(pattern);

      if (match) {
        return clean(match[1]);
      }
    }
  }

  return "";
}

/* -------------------------------------------------
   UNIT SALE PRICE
------------------------------------------------- */

function extractUnitSalePrice(lines) {
  const patterns = [
    /(?:unit\s+sale\s+price|usp)\s*[:\-]?\s*(?:rs\.?|inr)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:\/\s*)?([a-zA-Z]+)/i,

    /(?:unit\s+sale\s+price|usp)[^0-9]{0,15}([0-9]+(?:\.[0-9]+)?)\s*(?:\/\s*)?([a-zA-Z]+)/i,
  ];

  for (const line of lines) {
    const normalized = normalizeDigits(line);

    for (const pattern of patterns) {
      const match = normalized.match(pattern);

      if (match) {
        return `Rs ${match[1]}/${match[2]}`;
      }
    }
  }

  return "";
}

/* -------------------------------------------------
   MAIN EXTRACTION
------------------------------------------------- */

export function extractProductFields(ocrText = "") {
  const normalizedText = normalizeOCR(ocrText);
  const lines = linesOf(normalizedText);

  const productName = extractProductName(lines);

  const explicitGenericName = firstMatch(lines, [
    /generic\s+name\s*[:\-]\s*(.+)$/i,
    /common\s+name\s*[:\-]\s*(.+)$/i,
  ]);

  let genericName = explicitGenericName;
  let genericNameSource = "ocr";

  if (!genericName && productName) {
    genericName = productName;
    genericNameSource = "inferred";
  }

  return {
    manufacturer: extractManufacturer(lines),
    importer: firstMatch(lines, [
      /importer\s*[:\-]?\s*(.+)$/i,
      /imported\s+by\s*[:\-]?\s*(.+)$/i,
    ]),
    countryOfOrigin: extractCountryOfOrigin(lines),
    productName,
    genericName,
    genericNameSource,
    netQuantity: extractNetQuantity(lines),
    manufactureDate: extractManufactureDate(lines),
    bestBefore: extractBestBefore(lines),
    mrp: extractMRP(lines),
    consumerCare: extractConsumerCare(lines),
    dimensions: extractDimensions(lines),
    unitSalePrice: extractUnitSalePrice(lines),
  };
}