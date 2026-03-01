"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Home,
  Wrench,
  ClipboardList,
  Bell,
  LogOut,
  Shield,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/properties", icon: Home, label: "Properties" },
  { href: "/appliances", icon: Wrench, label: "Appliances" },
  { href: "/tasks", icon: ClipboardList, label: "Tasks" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 border-r border-white/[0.06] flex flex-col bg-[hsl(222,47%,5%)]">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white tracking-tight">HomeGuard</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"
                  )}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                  {active && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User */}
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
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{session.user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{session.user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-8 max-w-6xl mx-auto"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
