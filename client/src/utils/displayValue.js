export function displayValue(value, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((item) => displayValue(item, "")).filter(Boolean).join(", ") || fallback;
  if (typeof value === "object") {
    if (value.value !== undefined && value.value !== null && value.value !== "") return displayValue(value.value, fallback);
    if (value.labelDetected !== undefined && value.value !== undefined) return displayValue(value.value, fallback);
    try { return JSON.stringify(value); } catch { return fallback; }
  }
  return fallback;
}

export function productDisplayName(productFields = {}) {
  return displayValue(productFields.productName, "") || displayValue(productFields.genericName, "Product label");
}
