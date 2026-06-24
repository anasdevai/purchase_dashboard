import { NavLink, Outlet, Navigate, useLocation } from "react-router-dom";
import {
  Package,
  Truck,
  ClipboardList,
  Download,
  History
} from "lucide-react";
import clsx from "clsx";
import { useLanguage } from "../../i18n/LanguageProvider";

export function InventoryLayout() {
  const { t } = useLanguage();
  const location = useLocation();
  const layout = t.inventory.layout;

  const navItems = [
    { to: "/inventory/parts", label: layout.spareParts, icon: Package },
    { to: "/inventory/suppliers", label: layout.suppliers, icon: Truck },
    { to: "/inventory/orders", label: layout.orders, icon: ClipboardList },
    { to: "/inventory/receipts", label: layout.receipts, icon: Download },
    { to: "/inventory/adjustments", label: layout.adjustments, icon: History },
  ];

  const getLinkClass = (isActive: boolean) =>
    clsx(
      "flex items-center gap-2 py-3.5 px-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap",
      isActive
        ? "border-primary text-primary font-bold bg-slate-50/50"
        : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
    );

  if (location.pathname === "/inventory") {
    return <Navigate to="/inventory/parts" replace />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{layout.title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">{layout.subtitle}</p>
      </div>

      <div className="border-b border-slate-200 overflow-x-auto">
        <nav className="flex min-w-max gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => getLinkClass(isActive)}>
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <Outlet />
    </div>
  );
}
