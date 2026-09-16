import {
  Bell,
  Search,
  ShieldCheck
} from "lucide-react";

export default function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-8 backdrop-blur">

      <div>

        <p className="text-xs font-medium text-slate-400">
          Legal Metrology Compliance System
        </p>

        <h2 className="text-xl font-bold text-slate-900">
          Compliance Command Center
        </h2>

      </div>

      <div className="flex items-center gap-4">

        {/* Search */}
        <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:flex">

          <Search size={17} className="text-slate-400" />

          <input
            type="text"
            placeholder="Search inspection..."
            className="w-48 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />

        </div>

        {/* Security */}
        <div className="hidden items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 lg:flex">

          <ShieldCheck size={16} />

          System Secure

        </div>

        {/* Notification */}
        <button className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50">

          <Bell size={19} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />

        </button>

        {/* Profile */}
        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
            LM
          </div>

          <div className="hidden sm:block">

            <p className="text-sm font-semibold text-slate-800">
              Inspector
            </p>

            <p className="text-xs text-slate-400">
              Compliance Officer
            </p>

          </div>

        </div>

      </div>

    </header>
  );
}