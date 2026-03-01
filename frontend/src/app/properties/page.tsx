"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { getProperties, createProperty, deleteProperty } from "@/lib/api";
import { Property } from "@/types";
import { Plus, Home, Trash2, MapPin, Calendar, Maximize } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { formatDate, PROPERTY_TYPE_LABELS } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  property_type: z.string().default("house"),
  year_built: z.coerce.number().optional(),
  square_footage: z.coerce.number().optional(),
});

type FormData = z.infer<typeof schema>;

export default function PropertiesPage() {
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ["properties"],
    queryFn: getProperties,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { property_type: "house" },
  });

  const createMutation = useMutation({
    mutationFn: createProperty,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["properties"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Property added!");
      reset();
      setShowForm(false);
    },
    onError: () => toast.error("Failed to add property"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProperty,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["properties"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Property removed");
    },
    onError: () => toast.error("Failed to delete property"),
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Properties</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your homes and properties</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          Add Property
        </button>
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
              <h2 className="font-semibold text-white mb-4">New Property</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium uppercase tracking-wider">
                    Property Name *
                  </label>
                  <input
                    {...register("name")}
                    placeholder="My Home"
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
                  />
                  {errors.name && <p className="text-rose-400 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium uppercase tracking-wider">
                    Type
                  </label>
                  <select
                    {...register("property_type")}
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    {Object.entries(PROPERTY_TYPE_LABELS).map(([v, l]) => (
                      <option key={v} value={v} className="bg-slate-900">
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium uppercase tracking-wider">
                    Address
                  </label>
                  <input
                    {...register("address")}
                    placeholder="123 Main St, City, State"
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium uppercase tracking-wider">
                    Year Built
                  </label>
                  <input
                    {...register("year_built")}
                    type="number"
                    placeholder="2005"
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium uppercase tracking-wider">
                    Square Footage
                  </label>
                  <input
                    {...register("square_footage")}
                    type="number"
                    placeholder="1800"
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50"
                >
                  Add Property
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); reset(); }}
                  className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white border border-white/[0.08] hover:border-white/[0.15] transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Properties List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => <div key={i} className="h-40 shimmer rounded-2xl" />)}
        </div>
      ) : properties?.length === 0 ? (
        <div className="text-center py-20 text-slate-600">
          <Home className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-slate-500">No properties yet</p>
          <p className="text-sm mt-1">Add your first property to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {properties?.map((prop, i) => (
            <motion.div
              key={prop.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-6 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                    <Home className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{prop.name}</h3>
                    <p className="text-xs text-slate-500">{PROPERTY_TYPE_LABELS[prop.property_type]}</p>
                  </div>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(prop.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-500/15 text-slate-600 hover:text-rose-400 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-sm">
                {prop.address && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{prop.address}</span>
                  </div>
                )}
                {prop.year_built && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Built {prop.year_built}</span>
                  </div>
                )}
                {prop.square_footage && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Maximize className="w-3.5 h-3.5" />
                    <span>{prop.square_footage.toLocaleString()} sq ft</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-xs text-slate-600">Added {formatDate(prop.created_at)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
