export default function StatusBadge({ status }) {
  const safeStatus = typeof status === "string" ? status : status?.value || "needs_review";

  const styles = {
    compliant:
      "bg-emerald-50 text-emerald-700 border-emerald-200",

    non_compliant:
      "bg-red-50 text-red-700 border-red-200",

    needs_review:
      "bg-amber-50 text-amber-700 border-amber-200"
  };

  const labels = {
    compliant: "COMPLIANT",
    non_compliant: "NON-COMPLIANT",
    needs_review: "NEEDS REVIEW"
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide ${
        styles[safeStatus] ||
        "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      {labels[safeStatus] || safeStatus}
    </span>
  );
}