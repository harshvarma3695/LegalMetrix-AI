import {
  LayoutDashboard,
  ScanLine,
  History,
  FileText,
  ShieldCheck,
  Settings,
  HelpCircle,
  Scale
} from "lucide-react";

import { NavLink } from "react-router-dom";

const menuItems = [
  {
    name: "Dashboard",
    path: "/",
    icon: LayoutDashboard
  },
  {
    name: "Scan Product",
    path: "/scan",
    icon: ScanLine
  },
  {
    name: "Inspection History",
    path: "/history",
    icon: History
  },
  {
    name: "Reports",
    path: "/reports",
    icon: FileText
  },
  {
    name: "Enforcement",
    path: "/enforcement",
    icon: ShieldCheck
  }
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-200 bg-white">

      {/* Logo */}
      <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
          <Scale size={22} />
        </div>

        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">
            LegalMetriX
          </h1>

          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            AI Compliance
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 py-6">

        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Main Menu
        </p>

        <nav className="space-y-1">

          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                <Icon size={19} />
                {item.name}
              </NavLink>
            );
          })}

        </nav>

        <p className="mb-3 mt-8 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Support
        </p>

        <div className="space-y-1">

          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100">
            <HelpCircle size={19} />
            Help & Guide
          </button>

          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100">
            <Settings size={19} />
            Settings
          </button>

        </div>

      </div>

      {/* Bottom */}
      <div className="border-t border-slate-100 p-4">

        <div className="rounded-xl bg-slate-50 p-4">

          <p className="text-xs font-semibold text-slate-700">
            Legal Metrology
          </p>

          <p className="mt-1 text-[11px] leading-5 text-slate-500">
            Packaged Commodities Compliance
          </p>

        </div>

      </div>

    </aside>
  );
}