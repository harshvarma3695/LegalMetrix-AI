import { ShieldAlert, AlertTriangle, Activity, TrendingUp, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../services/api";

export default function Enforcement() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/dashboard")
      .then((response) => setData(response.data.data))
      .catch((err) => setError(err.response?.data?.message || "Unable to load enforcement data."));
  }, []);

  const openViolations = data?.nonCompliant || 0;
  const highRisk = (data?.recent || []).filter((item) => item.complianceReport?.status === "non_compliant").length;
  const activeCases = data?.needsReview || 0;

  return (
    <div className="space-y-7">
      <div><p className="text-sm text-slate-400">Monitoring</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Enforcement Dashboard</h1><p className="mt-2 text-sm text-slate-500">Monitor high-risk products, recurring violations and inspection trends.</p></div>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {!data && !error && <div className="flex justify-center py-16 text-sm text-slate-400"><Loader2 className="mr-2 animate-spin" size={20} />Loading...</div>}
      {data && <>
        <div className="grid gap-5 md:grid-cols-3"><div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm"><ShieldAlert className="text-red-600" size={24} /><p className="mt-5 text-sm text-slate-500">Recent High-Risk Inspections</p><p className="mt-1 text-3xl font-bold text-slate-900">{highRisk}</p></div><div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm"><AlertTriangle className="text-amber-600" size={24} /><p className="mt-5 text-sm text-slate-500">Open Violations</p><p className="mt-1 text-3xl font-bold text-slate-900">{openViolations}</p></div><div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm"><Activity className="text-blue-600" size={24} /><p className="mt-5 text-sm text-slate-500">Inspections Needing Review</p><p className="mt-1 text-3xl font-bold text-slate-900">{activeCases}</p></div></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><div className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><TrendingUp size={21} /></div><div><h3 className="font-bold text-slate-900">Violation Monitoring</h3><p className="text-xs text-slate-400">Based on stored inspection declaration results</p></div></div><div className="mt-8 space-y-4">{(data.topViolations || []).map((item) => <div key={item.field} className="flex items-center justify-between rounded-xl bg-slate-50 p-4"><span className="text-sm font-semibold capitalize text-slate-700">{item.field.replace(/([A-Z])/g, " $1")}</span><span className="rounded-full bg-red-50 px-3 py-1 text-sm font-bold text-red-700">{item.count}</span></div>)}{!data.topViolations?.length && <p className="text-sm text-slate-400">No recorded violations yet.</p>}</div></div>
      </>}
    </div>
  );
}
