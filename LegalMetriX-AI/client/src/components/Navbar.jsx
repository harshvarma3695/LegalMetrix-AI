import { Bell, Search } from "lucide-react";

const Navbar = () => {
  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8">

      {/* Search */}
      <div className="flex w-80 items-center gap-3 rounded-xl bg-slate-100 px-4 py-2.5">

        <Search
          size={19}
          className="text-slate-400"
        />

        <input
          type="text"
          placeholder="Search inspections..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
        />

      </div>

      {/* Right Side */}
      <div className="flex items-center gap-5">

        <button className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100">
          <Bell size={21} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
            A
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">
              Admin
            </p>

            <p className="text-xs text-slate-500">
              Inspector
            </p>
          </div>

        </div>

      </div>

    </header>
  );
};

export default Navbar;