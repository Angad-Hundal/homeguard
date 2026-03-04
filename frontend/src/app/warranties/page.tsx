"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getAppliances } from "@/lib/api";
import { Appliance } from "@/types";
import { Shield, AlertTriangle, CheckCircle2, Clock, Calendar, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { differenceInDays } from "date-fns";

const getWarrantyStatus = (expiryDate?: string) => {
  if (!expiryDate) return { status: "unknown", label: "No warranty info", icon: Clock, color: "text-slate-400" };
  
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysLeft = differenceInDays(expiry, now);

  if (daysLeft < 0) {
    return { status: "expired", label: "Expired", icon: AlertTriangle, color: "text-rose-400" };
  } else if (daysLeft <= 30) {
    return { status: "expiring", label: `Expires in ${daysLeft} days`, icon: AlertCircle, color: "text-amber-400" };
  } else if (daysLeft <= 90) {
    return { status: "warning", label: `Expires in ${daysLeft} days`, icon: Clock, color: "text-orange-400" };
  } else {
    return { status: "active", label: `${daysLeft} days left`, icon: CheckCircle2, color: "text-emerald-400" };
  }
};

export default function WarrantiesPage() {
  const { data: appliances, isLoading } = useQuery<Appliance[]>({
    queryKey: ["appliances"],
    queryFn: () => getAppliances(),
  });

  // Filter appliances with warranty data
  const appliancesWithWarranties = (appliances || []).filter((a) => a.warranty_expiry || a.purchase_date);
  const expiredWarranties = appliancesWithWarranties.filter((a) => getWarrantyStatus(a.warranty_expiry).status === "expired");
  const expiringWarranties = appliancesWithWarranties.filter((a) => getWarrantyStatus(a.warranty_expiry).status === "expiring");
  const activeWarranties = appliancesWithWarranties.filter((a) => ["active", "warning"].includes(getWarrantyStatus(a.warranty_expiry).status));
  const noWarrantyInfo = (appliances || []).filter((a) => !a.warranty_expiry && !a.purchase_date);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Warranty Tracker</h1>
        <p className="text-slate-500 text-sm mt-1">Monitor warranty coverage and expiration dates</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 shimmer rounded-2xl" />
          ))}
        </div>
      ) : appliancesWithWarranties.length === 0 && noWarrantyInfo.length === 0 ? (
        <div className="text-center py-20 text-slate-600">
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-slate-500">No appliances yet</p>
          <p className="text-sm mt-1">Add appliances to track their warranties</p>
        </div>
      ) : (
        <>
          {/* Expired Warranties */}
          {expiredWarranties.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Expired ({expiredWarranties.length})
              </h2>
              <div className="space-y-3">
                {expiredWarranties.map((appliance, i) => (
                  <WarrantyCard key={appliance.id} appliance={appliance} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Expiring Soon */}
          {expiringWarranties.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Expiring Soon ({expiringWarranties.length})
              </h2>
              <div className="space-y-3">
                {expiringWarranties.map((appliance, i) => (
                  <WarrantyCard key={appliance.id} appliance={appliance} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Active Warranties */}
          {activeWarranties.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Active Warranties ({activeWarranties.length})
              </h2>
              <div className="space-y-3">
                {activeWarranties.map((appliance, i) => (
                  <WarrantyCard key={appliance.id} appliance={appliance} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* No Warranty Info */}
          {noWarrantyInfo.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> No Warranty Data ({noWarrantyInfo.length})
              </h2>
              <div className="space-y-3">
                {noWarrantyInfo.map((appliance, i) => (
                  <WarrantyCard key={appliance.id} appliance={appliance} index={i} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface WarrantyCardProps {
  appliance: Appliance;
  index: number;
}

function WarrantyCard({ appliance, index }: WarrantyCardProps) {
  const warrantyStatus = getWarrantyStatus(appliance.warranty_expiry);
  const StatusIcon = warrantyStatus.icon;

  const borderColors = {
    expired: "border-rose-500/30",
    expiring: "border-amber-500/30",
    warning: "border-orange-500/30",
    active: "border-emerald-500/30",
    unknown: "border-white/[0.08]",
  };

  const bgColors = {
    expired: "bg-rose-500/5",
    expiring: "bg-amber-500/5",
    warning: "bg-orange-500/5",
    active: "bg-emerald-500/5",
    unknown: "",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn(
        "glass-card p-4 border",
        borderColors[warrantyStatus.status as keyof typeof borderColors],
        bgColors[warrantyStatus.status as keyof typeof bgColors]
      )}
    >
      <div className="flex items-start gap-4">
        <StatusIcon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", warrantyStatus.color)} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white">{appliance.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {appliance.brand} {appliance.model && `· ${appliance.model}`}
          </p>
          <div className="flex flex-wrap gap-3 mt-2 text-xs">
            {appliance.purchase_date && (
              <div className="flex items-center gap-1 text-slate-400">
                <Calendar className="w-3 h-3" />
                Purchased: {formatDate(appliance.purchase_date)}
              </div>
            )}
            {appliance.warranty_expiry && (
              <div className={cn("flex items-center gap-1", warrantyStatus.color)}>
                <Shield className="w-3 h-3" />
                Expires: {formatDate(appliance.warranty_expiry)}
              </div>
            )}
            {appliance.purchase_cost && (
              <div className="flex items-center gap-1 text-slate-400">
                $ {appliance.purchase_cost.toFixed(2)}
              </div>
            )}
          </div>
          <p className={cn("text-sm font-medium mt-2", warrantyStatus.color)}>
            {warrantyStatus.label}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
