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
  const { t, language } = useLanguage();
  const isDe = language === "de";
  const location = useLocation();

  // Define tab navigation items
  const navItems = [
    {
      to: "/inventory/parts",
      label: isDe ? "Ersatzteile" : "Spare Parts",
      icon: Package,
    },
    {
      to: "/inventory/suppliers",
      label: isDe ? "Lieferanten" : "Suppliers",
      icon: Truck,
    },
    {
      to: "/inventory/orders",
      label: isDe ? "Bestellungen" : "Purchase Orders",
      icon: ClipboardList,
    },
    {
      to: "/inventory/receipts",
      label: isDe ? "Wareneingänge" : "Goods Receipts",
      icon: Download,
    },
    {
      to: "/inventory/adjustments",
      label: isDe ? "Bestandshistorie" : "Stock Adjustments",
      icon: History,
    },
  ];

  // Helper for active link styles
  const getLinkClass = (isActive: boolean) =>
    clsx(
      "flex items-center gap-2 py-3.5 px-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap",
      isActive
        ? "border-primary text-primary font-bold bg-slate-50/50"
        : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
    );

  // If path is exactly /inventory, redirect to parts
  if (location.pathname === "/inventory") {
    return <Navigate to="/inventory/parts" replace />;
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900">
          {isDe ? "Lagerverwaltung" : "Inventory Management"}
        </h1>
        <p className="text-sm text-slate-500 max-w-3xl">
          {isDe
            ? "Pflegen Sie Ersatzteilbestände, Lieferantendaten, automatisierte Bestellungen und prüfen Sie Wareneingänge auf Abweichungen."
            : "Centralized maintenance of spare parts, stock adjustments, suppliers, automatic and manual replenishment orders, and goods receipt tracking."}
        </p>
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-slate-200 bg-white rounded-lg shadow-sm overflow-x-auto">
        <nav className="flex px-4 scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => getLinkClass(isActive)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Sub-page viewport */}
      <div className="min-h-[500px]">
        <Outlet />
      </div>
    </div>
  );
}
