import { Search, Filter, Eye, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import api from "../services/api";
import { productDisplayName } from "../utils/displayValue";

export default function History() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      api.get("/history", { params: { search, status, limit: 50 } })
        .then((response) => setInspections(response.data.inspections || []))
        .catch((err) => setError(err.response?.data?.message || "Unable to load history."))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [search, status]);

  return (
    <div className="space-y-7">
      <div><p className="text-sm text-slate-400">Records</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Inspection History</h1><p className="mt-2 text-sm text-slate-500">Search and retrieve previous product compliance inspections.</p></div>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 md:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"><Search size={17} className="text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search inspection or product..." className="w-full bg-transparent text-sm outline-none" /></div>
          <div className="flex items-center gap-2"><Filter size={17} className="text-slate-400" /><select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 outline-none"><option value="">All statuses</option><option value="compliant">Compliant</option><option value="non_compliant">Non-Compliant</option><option value="needs_review">Needs Review</option></select></div>
        </div>
        {error && <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="border-b border-slate-100 text-xs text-slate-400"><th className="px-6 py-4">Inspection ID</th><th className="px-6 py-4">Product</th><th className="px-6 py-4">Date</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Action</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan="5" className="px-6 py-12 text-center text-sm text-slate-400"><Loader2 className="mx-auto mb-2 animate-spin" size={20} />Loading...</td></tr>}
              {!loading && inspections.map((item) => <tr key={item.inspectionId || item._id} className="border-b border-slate-50 hover:bg-slate-50"><td className="px-6 py-4 text-sm font-semibold text-slate-700">{item.inspectionId}</td><td className="px-6 py-4 text-sm text-slate-600">{productDisplayName(item.productFields)}</td><td className="px-6 py-4 text-sm text-slate-500">{item.createdAt ? new Date(item.createdAt).toLocaleString("en-IN") : "-"}</td><td className="px-6 py-4"><StatusBadge status={item.complianceReport?.status} /></td><td className="px-6 py-4"><Link to={`/reports?inspection=${encodeURIComponent(item.inspectionId)}`} className="inline-flex rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><Eye size={18} /></Link></td></tr>)}
              {!loading && !inspections.length && <tr><td colSpan="5" className="px-6 py-12 text-center text-sm text-slate-400">No inspections found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
