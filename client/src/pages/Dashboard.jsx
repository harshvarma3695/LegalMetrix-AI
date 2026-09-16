import { useEffect, useState } from "react";
import {
  ScanLine,
  ShieldCheck,
  AlertTriangle,
  Clock3,
  ArrowRight,
  TrendingUp,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../services/api";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { productDisplayName } from "../utils/displayValue";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/dashboard")
      .then((response) => {
        if (active) setData(response.data.data);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || "Unable to load dashboard.");
      });
    return () => { active = false; };
  }, []);

  const total = data?.totalInspections || 0;
  const compliant = data?.compliant || 0;
  const nonCompliant = data?.nonCompliant || 0;
  const needsReview = data?.needsReview || 0;

  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-5 rounded-2xl bg-slate-900 p-7 text-white md:flex-row md:items-center">
        <div>
          <p className="text-sm font-medium text-slate-300">Welcome to LegalMetriX AI</p>
          <h1 className="mt-1 text-2xl font-bold">Packaged Commodity Compliance</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Scan product labels, extract mandatory declarations and identify potential compliance issues using AI-assisted inspection.
          </p>
        </div>
        <Link to="/scan" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100">
          <ScanLine size={18} /> Scan New Product
        </Link>
      </section>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Inspections" value={total} subtitle="Saved inspections" icon={ScanLine} iconClass="bg-blue-50 text-blue-700" />
        <StatCard title="Compliant" value={compliant} subtitle="No detected required violations" icon={ShieldCheck} iconClass="bg-emerald-50 text-emerald-700" />
        <StatCard title="Non-Compliant" value={nonCompliant} subtitle="Potential violations detected" icon={AlertTriangle} iconClass="bg-red-50 text-red-700" />
        <StatCard title="Needs Review" value={needsReview} subtitle="Requires inspector verification" icon={Clock3} iconClass="bg-amber-50 text-amber-700" />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">Compliance Overview</h3>
              <p className="mt-1 text-xs text-slate-400">Current inspection distribution</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600"><TrendingUp size={15} /> Live data</div>
          </div>

          {data ? (
            <div className="mt-8 space-y-5">
              {[
                ["Compliant", compliant, "bg-emerald-500"],
                ["Non-Compliant", nonCompliant, "bg-red-500"],
                ["Needs Review", needsReview, "bg-amber-500"]
              ].map(([label, value, color]) => {
                const width = total ? Math.max(2, Math.round((value / total) * 100)) : 2;
                return (
                  <div key={label}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-medium text-slate-600">{label}</span>
                      <span className="font-bold text-slate-900">{value}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <div className="flex h-48 items-center justify-center text-sm text-slate-400"><Loader2 className="mr-2 animate-spin" size={18} /> Loading dashboard...</div>}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-slate-900">Quick Actions</h3>
          <p className="mt-1 text-xs text-slate-400">Start a new compliance workflow</p>
          <div className="mt-6 space-y-3">
            <Link to="/scan" className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-slate-900 hover:bg-slate-50">
              <div className="flex items-center gap-3"><div className="rounded-lg bg-slate-900 p-2 text-white"><ScanLine size={18} /></div><div><p className="text-sm font-semibold">Scan Product</p><p className="text-xs text-slate-400">Upload label image</p></div></div><ArrowRight size={17} />
            </Link>
            <Link to="/history" className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-slate-900 hover:bg-slate-50">
              <div className="flex items-center gap-3"><div className="rounded-lg bg-blue-50 p-2 text-blue-700"><Clock3 size={18} /></div><div><p className="text-sm font-semibold">View History</p><p className="text-xs text-slate-400">Previous inspections</p></div></div><ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div><h3 className="font-bold text-slate-900">Recent Inspections</h3><p className="mt-1 text-xs text-slate-400">Latest product compliance checks</p></div>
          <Link to="/history" className="text-xs font-bold text-slate-700 hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="border-b border-slate-100 text-xs text-slate-400"><th className="px-6 py-4">Inspection ID</th><th className="px-6 py-4">Product</th><th className="px-6 py-4">Date</th><th className="px-6 py-4">Status</th></tr></thead>
            <tbody>
              {(data?.recent || []).map((item) => (
                <tr key={item.inspectionId} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-700">{item.inspectionId}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{productDisplayName(item.productFields)}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN") : "-"}</td>
                  <td className="px-6 py-4"><StatusBadge status={item.complianceReport?.status} /></td>
                </tr>
              ))}
              {data && !data.recent?.length && <tr><td colSpan="4" className="px-6 py-10 text-center text-sm text-slate-400">No inspections yet. Scan your first product.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
