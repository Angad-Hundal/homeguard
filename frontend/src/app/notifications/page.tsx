"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getNotifications, markNotificationRead, markAllRead } from "@/lib/api";
import { Notification } from "@/types";
import { Bell, BellOff, CheckCheck, AlertTriangle, Clock, Info } from "lucide-react";
import { formatRelative } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  reminder: { icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  overdue: { icon: AlertTriangle, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
  warranty: { icon: Info, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
};

export default function NotificationsPage() {
  const qc = useQueryClient();

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: () => getNotifications(),
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
  });

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-slate-500 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white border border-white/[0.08] hover:border-white/[0.15] px-4 py-2 rounded-xl transition-all"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 shimmer rounded-2xl" />)}
        </div>
      ) : notifications?.length === 0 ? (
        <div className="text-center py-24 text-slate-600">
          <BellOff className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-slate-500">No notifications yet</p>
          <p className="text-sm mt-1">You'll be notified when maintenance is due</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications?.map((notif, i) => {
            const config = typeConfig[notif.notification_type] || typeConfig.reminder;
            const Icon = config.icon;

            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => !notif.is_read && markReadMutation.mutate(notif.id)}
                className={cn(
                  "glass-card p-4 flex items-start gap-4 cursor-pointer transition-all hover:bg-white/[0.06]",
                  !notif.is_read && cn("border", config.bg)
                )}
              >
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5", config.bg)}>
                  <Icon className={cn("w-4 h-4", config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <p className={cn("text-sm font-medium", notif.is_read ? "text-slate-400" : "text-white")}>
                      {notif.title}
                    </p>
                    <span className="text-xs text-slate-600 flex-shrink-0">{formatRelative(notif.sent_at)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{notif.message}</p>
                </div>
                {!notif.is_read && (
                  <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 mt-2" />
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
