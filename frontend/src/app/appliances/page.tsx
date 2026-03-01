"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { getAppliances, getProperties, createAppliance, deleteAppliance } from "@/lib/api";
import { Appliance, Property } from "@/types";
import { Plus, Wrench, Trash2, ShieldCheck, DollarSign } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { formatDate, formatCurrency, CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/utils";
import { cn } from "@/lib/utils";

const schema = z.object({
  property_id: z.coerce.number().min(1, "Select a property"),
  name: z.string().min(1, "Name is required"),
  brand: z.string().optional(),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  category: z.string().default("other"),
  purchase_date: z.string().optional(),
  warranty_expiry: z.string().optional(),
  purchase_cost: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const CATEGORIES = ["hvac", "kitchen", "plumbing", "electrical", "exterior", "laundry", "safety", "other"];

export default function AppliancesPage() {
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: appliances, isLoading } = useQuery<Appliance[]>({
    queryKey: ["appliances"],
    queryFn: () => getAppliances(),
  });

  const { data: properties } = useQuery<Property[]>({
    queryKey: ["properties"],
    queryFn: getProperties,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: "other" },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      const payload = { ...data };
      if (payload.purchase_date) payload.purchase_date = new Date(payload.purchase_date).toISOString();
      if (payload.warranty_expiry) payload.warranty_expiry = new Date(payload.warranty_expiry).toISOString();
      return createAppliance(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appliances"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Appliance added!");
      reset();
      setShowForm(false);
    },
    onError: () => toast.error("Failed to add appliance"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAppliance,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appliances"] });
      toast.success("Appliance removed");
    },
  });

  const filtered = filterCategory
    ? appliances?.filter((a) => a.category === filterCategory)
    : appliances;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Appliances</h1>
          <p className="text-slate-500 text-sm mt-1">Track all your home systems and appliances</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          Add Appliance
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterCategory(null)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
            !filterCategory
              ? "bg-white/10 text-white border-white/20"
              : "text-slate-500 border-white/[0.06] hover:border-white/[0.12] hover:text-slate-300"
          )}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat === filterCategory ? null : cat)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
              filterCategory === cat
                ? CATEGORY_COLORS[cat]
                : "text-slate-500 border-white/[0.06] hover:border-white/[0.12] hover:text-slate-300"
            )}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleSubmit((d) => createMutation.mutate(d))}
              className="glass-card p-6 space-y-4"
            >
              <h2 className="font-semibold text-white mb-2">New Appliance</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium uppercase tracking-wider">Property *</label>
                  <select {...register("property_id")} className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50">
                    <option value="" className="bg-slate-900">Select property...</option>
                    {properties?.map((p) => (
                      <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>
                    ))}
                  </select>
                  {errors.property_id && <p className="text-rose-400 text-xs mt-1">{errors.property_id.message}</p>}
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium uppercase tracking-wider">Name *</label>
                  <input {...register("name")} placeholder="HVAC System" className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50" />
                  {errors.name && <p className="text-rose-400 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium uppercase tracking-wider">Category</label>
                  <select {...register("category")} className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50">
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="bg-slate-900">{CATEGORY_LABELS[c]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium uppercase tracking-wider">Brand</label>
                  <input {...register("brand")} placeholder="Carrier" className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium uppercase tracking-wider">Model</label>
                  <input {...register("model")} placeholder="XR15" className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium uppercase tracking-wider">Purchase Cost</label>
                  <input {...register("purchase_cost")} type="number" step="0.01" placeholder="3500" className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium uppercase tracking-wider">Purchase Date</label>
                  <input {...register("purchase_date")} type="date" className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium uppercase tracking-wider">Warranty Expiry</label>
                  <input {...register("warranty_expiry")} type="date" className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium uppercase tracking-wider">Serial Number</label>
                  <input {...register("serial_number")} placeholder="SN12345" className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isSubmitting} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50">
                  Add Appliance
                </button>
                <button type="button" onClick={() => { setShowForm(false); reset(); }} className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white border border-white/[0.08] hover:border-white/[0.15] transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Appliances List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-48 shimmer rounded-2xl" />)}
        </div>
      ) : filtered?.length === 0 ? (
        <div className="text-center py-20 text-slate-600">
          <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-slate-500">No appliances yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filtered?.map((appliance, i) => (
            <motion.div
              key={appliance.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card p-5 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full border", CATEGORY_COLORS[appliance.category])}>
                    {CATEGORY_LABELS[appliance.category]}
                  </span>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(appliance.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-500/15 text-slate-600 hover:text-rose-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <h3 className="font-semibold text-white mb-1">{appliance.name}</h3>
              {appliance.brand && (
                <p className="text-sm text-slate-500">{appliance.brand}{appliance.model ? ` · ${appliance.model}` : ""}</p>
              )}

              <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2">
                {appliance.purchase_cost && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <DollarSign className="w-3 h-3" />
                    <span>{formatCurrency(appliance.purchase_cost)}</span>
                  </div>
                )}
                {appliance.warranty_expiry && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Warranty until {formatDate(appliance.warranty_expiry)}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
