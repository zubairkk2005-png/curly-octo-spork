import { BarChart3, LayoutDashboard, Package, ReceiptText, Settings, Upload, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ReceiptText },
  { href: "/products", label: "Products", icon: Package },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/import", label: "Import Data", icon: Upload },
];

export const SETTINGS_NAV: NavItem = { href: "/settings", label: "Settings", icon: Settings };

export function pageTitle(pathname: string): string {
  const all = [...PRIMARY_NAV, SETTINGS_NAV];
  return all.find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`))?.label ?? "ProfitPilot";
}
