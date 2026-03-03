"use client";

import Link from "next/link";
import { ChevronRight, LayoutDashboard, Home, Wrench, ClipboardList, Bell, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = {
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
};

export const navItems: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/properties", icon: Home, label: "Properties" },
  { href: "/appliances", icon: Wrench, label: "Appliances" },
  { href: "/tasks", icon: ClipboardList, label: "Tasks" },
  { href: "/warranties", icon: Shield, label: "Warranties" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
];

interface NavProps {
  pathname: string;
  collapsed?: boolean;
}

export function Nav({ pathname, collapsed = false }: NavProps) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {navItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link key={item.href} href={item.href}>
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                collapsed && "justify-center",
                active
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && item.label}
              {!collapsed && active && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
