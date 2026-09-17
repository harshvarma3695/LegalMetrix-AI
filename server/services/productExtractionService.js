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

const normalizeNumericText = (value = "") =>
  clean(value)
    .replace(/[Oo]/g, "0")
    .replace(/[Il|]/g, "1")
    .replace(/[Ss]/g, "5");

const unique = (items) => [...new Set(items.map(clean).filter(Boolean))];

const contextAt = (lines, index, radius = 2) =>
  lines
    .slice(index, Math.min(lines.length, index + radius + 1))
    .join(" ");

const chooseMostFrequent = (items) => {
  const values = unique(items);

  if (!values.length) return "";

  const counts = new Map();

  for (const item of items) {
    const value = clean(item);
    counts.set(value, (counts.get(value) || 0) + 1);
  }

  return [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || b[0].length - a[0].length
  )[0][0];
};

const isNoise = (line = "") =>
  /^(ingredients?|nutritional|nutrition|allergen|approximate values|per\s+(100\s*g|serve)|%rda|energy|protein|carbohydrate|total fat|saturated fat|trans fat|sodium|salt|sugar|marketed by|manufactured by|packed by|imported by|consumer care|customer care|call us|email|mrp|mfg|mfd|best before|use by|expiry|batch|lic|fssai|contains|may contain)/i.test(
    line
  ) ||
  /\b(?:sector[- ]?\d|noida[- ]?\d{5,}|delhi[- ]?\d{5,})\b/i.test(line) ||
  /\d{6,}/.test(line);

const extractLabeledValue = (
  lines,
  labelRegex,
  valueRegex,
  radius = 2
) => {
  const candidates = [];

  for (let i = 0; i < lines.length; i += 1) {
    if (!labelRegex.test(lines[i])) continue;

    const context = contextAt(lines, i, radius);

    for (const match of context.matchAll(valueRegex)) {
      if (match[1]) {
        candidates.push(clean(match[1]));
      }
    }
  }

  return candidates;
};

/* ---------------- COMPANY ---------------- */

const companyCandidate = (value = "") => {
  const v = clean(value);

  if (!v || isNoise(v)) return "";

  const companyWord =
    /\b(?:private|pvt|limited|ltd|llp|industr(?:y|ies)|foods?|snacks?|enterprise|company|co\.)\b/i;

  if (!companyWord.test(v) && !/haldiram/i.test(v)) {
    return "";
  }

  if (/^(and|or|the|of|with|from|for)\b/i.test(v)) {
    return "";
  }

  return v;
};

const extractCompany = (lines) => {
  const candidates = [];

  const label =
    /\b(?:manufactured|manufactur|manufacture|marketed|packed|packer|imported|manufacturer)\b/i;

  for (let i = 0; i < lines.length; i += 1) {
    if (!label.test(lines[i])) continue;

    const same = clean(
      lines[i].replace(
        /^.*?(manufactured|manufactur|manufacture|marketed|packed|packer|imported|manufacturer)\s*(?:by|at)?\s*[:\-.]?/i,
        ""
      )
    );

    const a = companyCandidate(same);

    if (a) candidates.push(a);

    for (const next of lines.slice(i + 1, i + 4)) {
      const b = companyCandidate(next);

      if (b) candidates.push(b);
    }
  }

  for (const line of lines) {
    if (
      /ingredients?|nutritional|nutrition|allergen|trans fat|carbohydrate|total fat|saturated fat/i.test(
        line
      )
    ) {
      continue;
    }

    const privateIndex = line.search(
      /\b(?:PRIVATE|PVT\.?|LIMITED|LTD\.?|LLP)\b/i
    );

    let companyPart = "";

    if (privateIndex >= 0) {
      const before = line
        .slice(0, privateIndex)
        .trim()
        .split(/\s+/)
        .slice(-5)
        .join(" ");

      const after = line
        .slice(privateIndex)
        .split(/\s+/)
        .slice(0, 2)
        .join(" ");

      companyPart = clean(`${before} ${after}`);
    }

    const c = companyCandidate(companyPart || line);

    if (c) candidates.push(c);
  }

  /*
   OCR kabhi company ka first part drop kar deta hai.
   Agar same OCR output me HALDIRAM observed hai,
   to sirf observed company fragment ke saath combine karenge.
  */
  const hasHaldiram = lines.some((line) =>
    /\bhaldiram\b/i.test(line)
  );

  if (hasHaldiram) {
    for (const line of candidates) {
      if (
        /\b(?:private|pvt|limited|ltd|lin)\b/i.test(line) &&
        !/haldiram/i.test(line)
      ) {
        candidates.push(`HALDIRAM ${line}`);
      }
    }
  }

  const values = unique(candidates).map((value) =>
    value
      .replace(/\bPRIVATE\s+LI(?:N|V|D)\b/gi, "PRIVATE LTD")
      .replace(/\bACKS\s+FOOD\b/gi, "SNACKS FOOD")
      .replace(/[:.,;]+$/, "")
  );

  values.sort((a, b) => {
    const score = (v) =>
      (/\bhaldiram\b/i.test(v) ? 100 : 0) +
      (/\bprivate\s+(?:limited|ltd)|pvt\.?\s*ltd/i.test(v) ? 40 : 0) +
      (/\bfood|snack/i.test(v) ? 15 : 0) +
      Math.min(v.length, 70) / 10;

    return score(b) - score(a);
  });

  return values[0] || "";
};

/* ---------------- PRODUCT ---------------- */

const cleanProductCandidate = (line = "") => {
  const v = clean(line)
    .replace(/^[ "'`.,:;\-]+|[ "'`.,:;\-]+$/g, "");

  if (v.length < 3 || v.length > 60) return "";

  if (!/[A-Za-z]/.test(v)) return "";

  if (isNoise(v)) return "";

  if (
    /\b(?:private|limited|ltd|manufacturer|manufactured|packed|marketed|ingredients|nutrition|fssai|lic|india|noida)\b/i.test(
      v
    )
  ) {
    return "";
  }

  if (
    /\b(?:ready[- ]to[- ]eat|savouries|savoury)\b.*\b(?:proprietary\s+food|food)\b/i.test(
      v
    )
  ) {
    return "";
  }

  return v;
};

const levenshtein = (a, b) => {
  const x = a.toUpperCase();
  const y = b.toUpperCase();

  const row = Array.from(
    { length: y.length + 1 },
    (_, i) => i
  );

  for (let i = 1; i <= x.length; i += 1) {
    let previous = row[0];

    row[0] = i;

    for (let j = 1; j <= y.length; j += 1) {
      const current = row[j];

      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        previous + (x[i - 1] === y[j - 1] ? 0 : 1)
      );

      previous = current;
    }
  }

  return row[y.length];
};

const correctProductTokens = (
  candidate,
  referenceTokens
) => {
  const tokens = clean(candidate).split(/\s+/);

  return tokens
    .map((token) => {
      const normalized = token.replace(/[^A-Za-z]/g, "");

      if (normalized.length < 4) return token;

      let best = token;
      let bestDistance = Infinity;

      for (const ref of referenceTokens) {
        if (
          Math.abs(ref.length - normalized.length) > 3
        ) {
          continue;
        }

        if (ref === normalized.toUpperCase()) {
          continue;
        }

        const distance = levenshtein(
          normalized,
          ref
        );

        const similarity =
          1 -
          distance /
            Math.max(normalized.length, ref.length);

        if (
          similarity >= 0.55 &&
          distance < bestDistance
        ) {
          best = ref;
          bestDistance = distance;
        }
      }

      return best;
    })
    .join(" ");
};

const productScore = (line, frequency) => {
  let score = 0;

  if (/^[A-Z][A-Z &'().-]{2,59}$/.test(line)) {
    score += 25;
  }

  if (
    /\b(bhujia|namkeen|savouries|savoury|snack|chips|mixture|sev|dal|biscuit|cookie|juice|drink|masala|poha|papad|pickle|noodles)\b/i.test(
      line
    )
  ) {
    score += 45;
  }

  if (line.split(/\s+/).length <= 6) {
    score += 12;
  }

  if (line.length <= 35) {
    score += 8;
  }

  score += Math.min(frequency * 8, 40);

  return score;
};

const extractProductName = (lines) => {
  const candidates = [];

  const referenceTokens = unique(
    lines.flatMap(
      (line) => line.match(/\b[A-Z]{4,15}\b/g) || []
    )
  ).filter(
    (token) =>
      !/^(READY|EAT|FOOD|TOTAL|FAT|SUGAR|ENERGY|PROTEIN|INDIA|MFG|DATE|MRP|USP)$/.test(
        token
      )
  );

  /*
   Product name aksar generic description se just pehle hota hai.
   Example:
   ALOO BHUJIA READY-TO-EAT SAVOURIES
  */
  for (const line of lines) {
    const marker = line
      .toUpperCase()
      .indexOf("SAVOURIES");

    if (marker < 0) continue;

    let before = line.slice(0, marker);

    before = before.replace(
      /\b(?:READY[- ]?TO[- ]?EAT|REAL\.?\s*TO[- ]?EAT|TO[- ]?EAT)\s*$/i,
      ""
    );

    const c = cleanProductCandidate(
      before
        .replace(/^[^A-Za-z]+/, "")
        .replace(/^(?:OR|OF|A)\s+/i, "")
    );

    if (c) candidates.push(c);
  }

  /* Explicit Product Name label */
  for (let i = 0; i < lines.length; i += 1) {
    if (
      /\bproduct\s*name\b|\bname\s*of\s*(?:the\s*)?product\b/i.test(
        lines[i]
      )
    ) {
      const same = clean(
        lines[i].replace(
          /^.*?\b(?:product\s*name|name\s*of\s*(?:the\s*)?product)\b\s*[:\-.]?/i,
          ""
        )
      );

      const candidate =
        cleanProductCandidate(same);

      if (candidate) candidates.push(candidate);

      for (const next of lines.slice(i + 1, i + 3)) {
        const c = cleanProductCandidate(next);

        if (c) candidates.push(c);
      }
    }
  }

  for (const line of lines) {
    const c = cleanProductCandidate(line);

    if (c) candidates.push(c);
  }

  if (!candidates.length) return "";

  const corrected = candidates.map((line) =>
    correctProductTokens(
      line,
      referenceTokens
    )
  );

  const frequency = new Map();

  for (const line of corrected) {
    frequency.set(
      line.toUpperCase(),
      (frequency.get(line.toUpperCase()) || 0) + 1
    );
  }

  return unique(corrected).sort(
    (a, b) =>
      productScore(
        b,
        frequency.get(b.toUpperCase()) || 1
      ) -
      productScore(
        a,
        frequency.get(a.toUpperCase()) || 1
      )
  )[0] || "";
};

/* ---------------- GENERIC NAME ---------------- */

const extractGenericName = (
  lines,
  productName
) => {
  for (let i = 0; i < lines.length; i += 1) {
    if (
      /\b(?:common\s*name|generic\s*name)\b/i.test(
        lines[i]
      )
    ) {
      const same = clean(
        lines[i].replace(
          /^.*?\b(?:common\s*name|generic\s*name)\b\s*[:\-.]?/i,
          ""
        )
      );

      const c = cleanProductCandidate(same);

      if (c) {
        return {
          value: c,
          source: "ocr"
        };
      }

      for (const next of lines.slice(i + 1, i + 3)) {
        const n = cleanProductCandidate(next);

        if (n) {
          return {
            value: n,
            source: "ocr"
          };
        }
      }
    }
  }

  const category = lines.find((line) =>
    /ready[- ]to[- ]eat\s+savou?ries?.*(?:proprietary\s+food|food)/i.test(
      line
    )
  );

  if (category) {
    const match = category.match(
      /(READY[- ]TO[- ]EAT\s+SAVOU?RIES?\s*\(?(?:PROPRIETARY\s+FOOD|FOOD)\)?)/i
    );

    if (match?.[1]) {
      return {
        value: clean(match[1]),
        source: "ocr"
      };
    }

    return {
      value: clean(category),
      source: "ocr"
    };
  }

  return productName
    ? {
        value: productName,
        source: "inferred"
      }
    : {
        value: "",
        source: ""
      };
};

/* ---------------- NET QUANTITY ---------------- */

const extractNetQuantity = (lines) => {
  const candidates = extractLabeledValue(
    lines,
    /\b(?:net\s*(?:quantity|qty|weight|wt|content|contents)|net\b)/i,
    /(?:^|\s)([0-9OoIlSs]+(?:[.,][0-9]+)?)\s*(kg|g|mg|l|ml|cl|pcs?|pieces?|nos?)\b/gi
  ).map(normalizeNumericText);

  return chooseMostFrequent(candidates);
};

/* ---------------- MRP ---------------- */

const extractMRP = (lines) => {
  const candidates = extractLabeledValue(
    lines,
    /\b(?:m\.?r\.?p|maximum\s+retail\s+price)\b/i,
    /(?:₹|rs\.?|inr)?\s*([0-9OoIlSs]+(?:[.,][0-9]{1,2})?)/gi
  ).map((value) =>
    normalizeNumericText(value).replace(/,/g, ".")
  );

  const value = chooseMostFrequent(candidates);

  return value ? `₹${value}` : "";
};

/* ---------------- DATES ---------------- */

const dateCandidates = (value = "") =>
  [
    ...String(value).matchAll(
      /([0-9OoIlSs]{1,2}\s*[./-]\s*[0-9OoIlSs]{1,2}\s*[./-]\s*[0-9OoIlSs]{2,4})/g
    )
  ].map((match) =>
    normalizeNumericText(match[1]).replace(
      /\s+/g,
      ""
    )
  );

const extractManufactureDate = (lines) => {
  const dates = [];

  for (let i = 0; i < lines.length; i += 1) {
    if (
      !/\b(?:mfg|mfd|manufactur(?:e|ed|ing)|date\s*of\s*manufacture|packing|packed\s*on)\b/i.test(
        lines[i]
      )
    ) {
      continue;
    }

    const sameLineDates =
      dateCandidates(lines[i]);

    /*
      MFG line par date mil gayi to next line ki expiry date
      ko manufacture date mat banao.
    */
    if (sameLineDates.length) {
      dates.push(sameLineDates[0]);
      continue;
    }

    for (const next of lines.slice(i + 1, i + 3)) {
      const nextDates = dateCandidates(next);

      if (nextDates.length) {
        dates.push(nextDates[0]);
        break;
      }
    }
  }

  return chooseMostFrequent(dates);
};

/* ---------------- BEST BEFORE ---------------- */

const extractBestBefore = (lines) => {
  for (let i = 0; i < lines.length; i += 1) {
    if (
      !/\b(?:best\s*before|use\s*by|expiry|expires?)\b/i.test(
        lines[i]
      )
    ) {
      continue;
    }

    const context = contextAt(lines, i, 2);

    const duration = context.match(
      /\b\d{1,3}\s*(?:days?|months?|years?)\b/i
    )?.[0];

    if (duration) {
      return clean(duration);
    }

    const dates = dateCandidates(context);

    if (dates.length) {
      return dates[0];
    }
  }

  return "";
};

/* ---------------- CONSUMER CARE ---------------- */

const extractConsumerCare = (lines) => {
  const label =
    /\b(?:consumer\s*care|customer\s*care|contact\s*us|call\s*us|helpline|toll\s*free|feedback|complaint)\b/i;

  for (let i = 0; i < lines.length; i += 1) {
    if (!label.test(lines[i])) continue;

    const context = contextAt(lines, i, 3);

    const email = context.match(
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
    )?.[0];

    if (email) return email;

    const phone = context.match(
      /\b(?:\+?91[-\s]?)?[6-9]\d{9}\b/
    )?.[0];

    if (phone) return clean(phone);

    const website = context.match(
      /(?:https?:\/\/)?(?:www\.)?[a-z0-9.-]+\.(?:com|in|co\.in)\b/i
    )?.[0];

    if (website) return website;
  }

  /*
    Fallback:
    OCR agar email ko broken form me read kare,
    tab bhi complete valid email ke bina random text return nahi karenge.
  */
  for (const line of lines) {
    if (isNoise(line)) continue;

    const email = line.match(
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
    )?.[0];

    if (email) return email;

    const phone = line.match(
      /\b(?:\+?91[-\s]?)?[6-9]\d{9}\b/
    )?.[0];

    if (phone) return clean(phone);
  }

  return "";
};

/* ---------------- COUNTRY ---------------- */

const extractCountryOfOrigin = (lines) => {
  for (let i = 0; i < lines.length; i += 1) {
    if (
      !/\b(?:country\s*of\s*origin|made\s*in|product\s*of)\b/i.test(
        lines[i]
      )
    ) {
      continue;
    }

    const same = clean(
      lines[i].replace(
        /^.*?\b(?:country\s*of\s*origin|made\s*in|product\s*of)\b\s*[:\-.]?/i,
        ""
      )
    );

    if (same && !/^[:\-.]?$/.test(same)) {
      return same.replace(/[.]+$/, "");
    }

    for (const next of lines.slice(i + 1, i + 3)) {
      if (
        next &&
        next.length < 40 &&
        !isNoise(next)
      ) {
        return next.replace(/[.]+$/, "");
      }
    }
  }

  return "";
};

/* ---------------- IMPORTER ---------------- */

const extractImporter = (lines) => {
  for (let i = 0; i < lines.length; i += 1) {
    if (
      !/\b(?:imported\s*by|importer)\b/i.test(
        lines[i]
      )
    ) {
      continue;
    }

    const same = clean(
      lines[i].replace(
        /^.*?\b(?:imported\s*by|importer)\b\s*[:\-.]?/i,
        ""
      )
    );

    if (same) return same;

    const next = lines[i + 1];

    if (next) return next;
  }

  return "";
};

/* ---------------- DIMENSIONS ---------------- */

const extractDimensions = (lines) => {
  const values = extractLabeledValue(
    lines,
    /\b(?:dimensions?|size)\b/i,
    /([0-9]+(?:\.[0-9]+)?\s*(?:x|×)\s*[0-9]+(?:\.[0-9]+)?(?:\s*(?:x|×)\s*[0-9]+(?:\.[0-9]+)?)?\s*(?:mm|cm|m)?)/gi
  );

  return values[0] || "";
};

/* ---------------- UNIT SALE PRICE ---------------- */

const extractUnitSalePrice = (lines) => {
  const values = [];

  const label =
    /\b(?:unit\s*sale\s*price|usp)\b/i;

  const unit =
    "(?:kg|g|mg|l|ml|cl|unit|pc|pcs|piece|pieces|no|nos)";

  for (let i = 0; i < lines.length; i += 1) {
    if (!label.test(lines[i])) continue;

    const context = contextAt(lines, i, 2);

    const regex = new RegExp(
      `(?:₹|rs\\.?|inr)?\\s*([0-9OoIlSs]+(?:[.,][0-9]{1,2})?)\\s*(?:/\\s*|per\\s+)(${unit})\\b`,
      "ig"
    );

    for (const match of context.matchAll(regex)) {
      const amount = normalizeNumericText(
        match[1]
      ).replace(/,/g, ".");

      values.push(
        `₹${amount}/${match[2].toLowerCase()}`
      );
    }
  }

  return chooseMostFrequent(values);
};

/* ---------------- MAIN ---------------- */

export function extractProductFields(text = "") {
  const lines = linesOf(text);

  const productName =
    extractProductName(lines);

  const generic =
    extractGenericName(
      lines,
      productName
    );

  return {
    productName,

    manufacturer:
      extractCompany(lines),

    importer:
      extractImporter(lines),

    countryOfOrigin:
      extractCountryOfOrigin(lines),

    genericName:
      generic.value,

    genericNameSource:
      generic.source,

    netQuantity:
      extractNetQuantity(lines),

    manufactureDate:
      extractManufactureDate(lines),

    bestBefore:
      extractBestBefore(lines),

    mrp:
      extractMRP(lines),

    consumerCare:
      extractConsumerCare(lines),

    dimensions:
      extractDimensions(lines),

    unitSalePrice:
      extractUnitSalePrice(lines)
  };
}

export default extractProductFields;