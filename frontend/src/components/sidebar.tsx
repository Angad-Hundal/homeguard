"use client";

import Image from "next/image";
import { LogOut, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Nav } from "@/components/nav";
import { useState, useEffect } from "react";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";

interface SidebarProps {
  pathname: string;
  session: Session;
}

export function Sidebar({ pathname, session }: SidebarProps) {
  // read initial value from localStorage on first render (client only)
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      if (typeof window === "undefined") return false;
      const stored = localStorage.getItem("sidebar-collapsed");
      return stored === "true";
    } catch {
      return false;
    }
  });

  // keep storage in sync whenever the value changes
  useEffect(() => {
    try {
      localStorage.setItem("sidebar-collapsed", collapsed.toString());
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  return (
    <aside
      className={cn(
        "flex-shrink-0 border-r border-white/[0.06] flex flex-col bg-[hsl(222,47%,5%)] transition-all duration-200",
        collapsed ? "w-20" : "w-60"
      )}
    >
      {/* Logo + collapse toggle */}
      <div className="flex items-center justify-between gap-2.5 px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          {!collapsed && <span className="font-bold text-white tracking-tight">HomeGuard</span>}
        </div>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="p-1 rounded hover:bg-white/[0.04] text-slate-400"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Nav list */}
      <Nav pathname={pathname} collapsed={collapsed} />

      {/* User section */}
      <div className="border-t border-white/[0.06] p-4">
        <div className="flex items-center gap-3 mb-3">
          {session.user?.image ? (
            <Image
              src={session.user.image}
              alt="avatar"
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-medium">
              {session.user?.name?.[0]}
            </div>
          )}
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">
                {session.user?.name}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {session.user?.email}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200",
            collapsed
              ? "justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
              : "text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
          )}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </aside>
  );
}
