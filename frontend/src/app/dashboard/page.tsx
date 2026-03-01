"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getDashboardStats, getUpcomingTasks } from "@/lib/api";
import { DashboardStats, UpcomingTask } from "@/types";
import {
  Home,
  Wrench,
  CalendarClock,
  AlertTriangle,
  DollarSign,
  HeartPulse,
  CheckCircle,
  Clock,
} from "lucide-react";
import { cn, formatDate, formatCurrency, getTaskUrgency, CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/utils";
import Link from "next/link";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  delay,
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="stat-card"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", accent || "bg-emerald-500/15")}>
          <Icon className={cn("w-4.5 h-4.5", accent ? "text-white" : "text-emerald-400")} size={18} />
        </div>
      </div>
      <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</div>
      {sub && <div className="text-xs text-slate-600 mt-1">{sub}</div>}
    </motion.div>
  );
}

function HealthRing({ score }: { score: number }) {
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const dash = (score / 100) * circumference;

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke={score > 70 ? "#10b981" : score > 40 ? "#f59e0b" : "#f43f5e"}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - dash}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-white">{score}%</span>
      </div>
    </div>
  );
}

const urgencyConfig = {
  overdue: { label: "Overdue", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20", icon: AlertTriangle },
  soon: { label: "Due soon", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: Clock },
  upcoming: { label: "Upcoming", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: CalendarClock },
  ok: { label: "Scheduled", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle },
};

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  });

  const { data: upcoming, isLoading: upcomingLoading } = useQuery<UpcomingTask[]>({
    queryKey: ["upcoming-tasks"],
    queryFn: () => getUpcomingTasks(30),
  });

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 shimmer rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 shimmer rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-slate-500 text-sm mt-1">Your home maintenance at a glance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Home} label="Properties" value={stats?.total_properties ?? 0} delay={0} />
        <StatCard icon={Wrench} label="Appliances" value={stats?.total_appliances ?? 0} delay={0.05} />
        <StatCard
          icon={CalendarClock}
          label="Due This Month"
          value={stats?.upcoming_tasks_count ?? 0}
          delay={0.1}
        />
        <StatCard
          icon={AlertTriangle}
          label="Overdue"
          value={stats?.overdue_tasks_count ?? 0}
          accent={stats?.overdue_tasks_count ? "bg-rose-500/20" : undefined}
          delay={0.15}
        />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Health Score */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 flex flex-col items-center justify-center gap-3"
        >
          <HealthRing score={stats?.health_score ?? 100} />
          <div className="text-center">
            <p className="text-white font-semibold">Home Health Score</p>
            <p className="text-slate-500 text-xs mt-0.5">Based on task completion rate</p>
          </div>
        </motion.div>

        {/* Annual Cost */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-slate-400">This Year's Spend</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {formatCurrency(stats?.total_cost_this_year ?? 0)}
          </div>
          <p className="text-slate-600 text-xs mt-2">Logged maintenance costs</p>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 space-y-2"
        >
          <p className="text-sm font-medium text-slate-400 mb-4">Quick Actions</p>
          {[
            { label: "Add a property", href: "/properties" },
            { label: "Add an appliance", href: "/appliances" },
            { label: "Schedule a task", href: "/tasks" },
            { label: "View notifications", href: "/notifications" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.04] text-sm text-slate-400 hover:text-white transition-all group"
            >
              {link.label}
              <span className="text-slate-600 group-hover:text-emerald-400 transition-colors">→</span>
            </Link>
          ))}
        </motion.div>
      </div>

      {/* Upcoming Tasks */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-white">Upcoming Tasks</h2>
          <Link href="/tasks" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
            View all →
          </Link>
        </div>

        {upcomingLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 shimmer rounded-xl" />
            ))}
          </div>
        ) : upcoming?.length === 0 ? (
          <div className="text-center py-10 text-slate-600">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500/40" />
            <p className="text-sm">No tasks due in the next 30 days</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming?.map((task, i) => {
              const urgency = getTaskUrgency(task.next_due);
              const config = urgencyConfig[urgency];
              const StatusIcon = config.icon;
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-xl border transition-all hover:bg-white/[0.03]",
                    config.bg
                  )}
                >
                  <StatusIcon className={cn("w-4 h-4 flex-shrink-0", config.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{task.title}</p>
                    <p className="text-xs text-slate-500">
                      {task.appliance_name} · {task.property_name}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={cn("text-xs font-medium", config.color)}>
                      {task.is_overdue ? "Overdue" : formatDate(task.next_due)}
                    </p>
                    {task.estimated_cost && (
                      <p className="text-xs text-slate-600">{formatCurrency(task.estimated_cost)}</p>
                    )}
                  </div>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full border", CATEGORY_COLORS[task.category])}>
                    {CATEGORY_LABELS[task.category]}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
