import { NavLink, Outlet } from "react-router-dom";
import { Activity, LayoutGrid, MessageCircle } from "lucide-react";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/heartratemonitor", label: "Heart Rate Monitor", icon: Activity },
  { to: "/chat", label: "AI Assistant", icon: MessageCircle },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-slate-200 bg-white md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center gap-3 px-6 py-5 md:border-b md:border-slate-200">
          <img src="/logo.svg" alt="HrVita" className="h-10 w-10 rounded" />
          <span className="font-bold md:hidden">HrVita</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:px-4 md:py-6">
          <p className="mb-2 hidden px-3 text-xs font-semibold text-slate-500 md:block">Navigation</p>
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isActive ? "bg-blue-50 font-medium text-blue-600" : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
