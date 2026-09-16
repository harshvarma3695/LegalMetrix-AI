import { FileText, Download, FilePenLine, Loader2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import StatusBadge from "../components/StatusBadge";
import { displayValue, productDisplayName } from "../utils/displayValue";

const BASE_URL = "http://localhost:5000";

export default function Reports() {
  const [params] = useSearchParams();
  const [id, setId] = useState(params.get("inspection") || "");
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    api.get("/history", { params: { limit: 20 } })
      .then((response) => setRecent(response.data.inspections || []))
      .catch(() => {});
  }, []);

  const loadReport = async (inspectionId = id) => {
    if (!inspectionId.trim()) return;
    setLoading(true); setError(""); setInspection(null);
    try {
      const response = await api.get(`/reports/${encodeURIComponent(inspectionId.trim())}`);
      setInspection(response.data.inspection);
      setId(inspectionId.trim());
    } catch (err) {
      setError(err.response?.data?.message || "Report not found.");
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const initial = params.get("inspection");
    if (initial) loadReport(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-7">
      <div><p className="text-sm text-slate-400">Documentation</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Compliance Reports</h1><p className="mt-2 text-sm text-slate-500">Generate inspection reports with violations and supporting evidence.</p></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-3 md:flex-row"><div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"><Search size={17} className="text-slate-400" /><input value={id} onChange={(e) => setId(e.target.value)} onKeyDown={(e) => e.key === "Enter" && loadReport()} placeholder="Enter Inspection ID (e.g. INS-...)" className="w-full bg-transparent text-sm outline-none" /></div><button onClick={() => loadReport()} disabled={loading || !id.trim()} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white disabled:bg-slate-200">{loading ? "Loading..." : "Open Report"}</button></div>{error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}</div>

      {inspection && <div className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><p className="text-xs text-slate-400">Inspection ID</p><h2 className="mt-1 text-xl font-bold text-slate-900">{inspection.inspectionId}</h2><p className="mt-1 text-sm text-slate-500">{productDisplayName(inspection.productFields)}</p></div><StatusBadge status={inspection.complianceReport?.status} /></div><div className="mt-5 grid gap-4 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Score</p><p className="mt-1 text-2xl font-bold">{inspection.complianceReport?.score ?? "-"}%</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Violations</p><p className="mt-1 text-2xl font-bold">{inspection.complianceReport?.summary?.violations ?? 0}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-400">OCR Confidence</p><p className="mt-1 text-2xl font-bold">{Math.round(inspection.ocrConfidence || 0)}%</p></div></div></div>
        <div className="grid gap-5 md:grid-cols-2"><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><FileText size={22} className="text-red-600" /><h3 className="mt-4 font-bold">PDF Compliance Report</h3><p className="mt-2 text-sm text-slate-500">Download a structured inspection report.</p><a href={`${BASE_URL}/api/reports/${encodeURIComponent(inspection.inspectionId)}/pdf`} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white"><Download size={17} /> Generate PDF</a></div><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><FilePenLine size={22} className="text-blue-600" /><h3 className="mt-4 font-bold">Editable Report</h3><p className="mt-2 text-sm text-slate-500">Download the editable DOCX report.</p><a href={`${BASE_URL}/api/reports/${encodeURIComponent(inspection.inspectionId)}/docx`} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700"><FilePenLine size={17} /> Create Editable Report</a></div></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="font-bold">Declaration Checks</h3><div className="mt-4 space-y-3">{(inspection.declarations || []).map((item) => <div key={item.key || item.id || item.label} className="flex flex-col gap-2 rounded-xl border border-slate-100 p-4 md:flex-row md:items-center md:justify-between"><div><p className="text-sm font-semibold text-slate-800">{displayValue(item.label, item.key || "Declaration")}</p><p className="mt-1 text-xs text-slate-400">{displayValue(item.value, displayValue(item.reason, "Not detected"))}</p></div><StatusBadge status={item.status} /></div>)}</div></div>
      </div>}

      {!inspection && recent.length > 0 && <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="font-bold">Recent inspections</h3><div className="mt-4 space-y-2">{recent.map((item) => <button key={item.inspectionId} onClick={() => loadReport(item.inspectionId)} className="flex w-full items-center justify-between rounded-xl border border-slate-100 p-4 text-left hover:bg-slate-50"><span><span className="block text-sm font-semibold">{item.inspectionId}</span><span className="text-xs text-slate-400">{productDisplayName(item.productFields)}</span></span><StatusBadge status={item.complianceReport?.status} /></button>)}</div></div>}
    </div>
  );
}
