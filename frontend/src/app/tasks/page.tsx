"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { getTasks, getAppliances, createTask, updateTask, completeTask, deleteTask, getTaskLogs } from "@/lib/api";
import { MaintenanceTask, Appliance } from "@/types";
import { Plus, CheckCircle2, Trash2, Calendar, RefreshCw, DollarSign, AlertTriangle, Clock, Edit2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { formatDate, formatCurrency, getTaskUrgency, FREQUENCY_PRESETS, CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { addDays, format } from "date-fns";

const schema = z.object({
  appliance_id: z.coerce.number().min(1, "Select an appliance"),
  title: z.string().min(1, "Title required"),
  description: z.string().optional(),
  frequency_days: z.coerce.number().min(1),
  next_due: z.string().min(1, "Due date required"),
  estimated_cost: z.coerce.number().optional(),
  reminder_days_before: z.coerce.number().default(7),
});

type FormData = z.infer<typeof schema>;

const urgencyStyles = {
  overdue: { border: "border-rose-500/30", bg: "bg-rose-500/5", icon: AlertTriangle, iconColor: "text-rose-400" },
  soon: { border: "border-amber-500/30", bg: "bg-amber-500/5", icon: Clock, iconColor: "text-amber-400" },
  upcoming: { border: "border-blue-500/30", bg: "bg-blue-500/5", icon: Calendar, iconColor: "text-blue-400" },
  ok: { border: "border-white/[0.08]", bg: "", icon: CheckCircle2, iconColor: "text-emerald-400" },
};

export default function TasksPage() {
  const [showForm, setShowForm] = useState(false);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedFrequency, setSelectedFrequency] = useState<number | null>(null);
  const qc = useQueryClient();

  const { data: activeTasks, isLoading } = useQuery<MaintenanceTask[]>({
    queryKey: ["tasks", "active"],
    queryFn: () => getTasks(undefined, false, true),
  });

  const { data: completedTasks } = useQuery<MaintenanceTask[]>({
    queryKey: ["tasks", "completed"],
    queryFn: () => getTasks(undefined, false, false),
  });

  const { data: appliances } = useQuery<Appliance[]>({
    queryKey: ["appliances"],
    queryFn: () => getAppliances(),
  });

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      frequency_days: 90,
      reminder_days_before: 7,
      next_due: format(addDays(new Date(), 90), "yyyy-MM-dd"),
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      const payload = { ...data, next_due: new Date(data.next_due).toISOString() };
      return createTask(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks", "active"] });
      qc.invalidateQueries({ queryKey: ["tasks", "completed"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["upcoming-tasks"] });
      toast.success("Task scheduled!");
      reset();
      setShowForm(false);
    },
    onError: () => toast.error("Failed to create task"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => {
      const payload = { ...data, next_due: new Date(data.next_due).toISOString() };
      return updateTask(id, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["upcoming-tasks"] });
      toast.success("Task updated!");
      reset();
      setEditingId(null);
      setShowForm(false);
    },
    onError: () => toast.error("Failed to update task"),
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => completeTask(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks", "active"] });
      qc.invalidateQueries({ queryKey: ["tasks", "completed"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["upcoming-tasks"] });
      toast.success("Task marked complete! Next due date updated.");
      setCompletingId(null);
    },
    onError: () => toast.error("Failed to complete task"),
  });
  const handleEdit = (task: MaintenanceTask) => {
    setValue("appliance_id", task.appliance_id);
    setValue("title", task.title);
    setValue("description", task.description || "");
    setValue("frequency_days", task.frequency_days);
    setValue("next_due", task.next_due.split("T")[0]);
    setValue("estimated_cost", task.estimated_cost || undefined);
    setValue("reminder_days_before", task.reminder_days_before);
    setEditingId(task.id);
    setShowForm(true);
  };

  const onSubmit = (data: FormData) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks", "active"] });
      qc.invalidateQueries({ queryKey: ["tasks", "completed"] });
      toast.success("Task deleted");
    },
  });

  const overdueTasks = activeTasks?.filter((t) => getTaskUrgency(t.next_due) === "overdue") || [];
  const upcomingActiveTasks = activeTasks?.filter((t) => getTaskUrgency(t.next_due) !== "overdue") || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Maintenance Tasks</h1>
          <p className="text-slate-500 text-sm mt-1">Schedule and track recurring maintenance</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          Add Task
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
            <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-6 space-y-4">
              <h2 className="font-semibold text-white mb-2">{editingId ? "Edit Task" : "New Maintenance Task"}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium uppercase tracking-wider">Appliance *</label>
                  <select {...register("appliance_id")} className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50">
                    <option value="" className="bg-slate-900">Select appliance...</option>
                    {appliances?.map((a) => (
                      <option key={a.id} value={a.id} className="bg-slate-900">{a.name}</option>
                    ))}
                  </select>
                  {errors.appliance_id && <p className="text-rose-400 text-xs mt-1">{errors.appliance_id.message}</p>}
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium uppercase tracking-wider">Task Title *</label>
                  <input {...register("title")} placeholder="Replace air filter" className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50" />
                  {errors.title && <p className="text-rose-400 text-xs mt-1">{errors.title.message}</p>}
                </div>

                {/* Frequency presets */}
                <div className="md:col-span-2">
                  <label className="text-xs text-slate-400 mb-2 block font-medium uppercase tracking-wider">Frequency</label>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {FREQUENCY_PRESETS.map((p) => (
                      <button
                        key={p.days}
                        type="button"
                        onClick={() => {
                          setSelectedFrequency(p.days);
                          setValue("frequency_days", p.days);
                          setValue("next_due", format(addDays(new Date(), p.days), "yyyy-MM-dd"));
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs border transition-all",
                          selectedFrequency === p.days
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : "text-slate-500 border-white/[0.08] hover:border-white/[0.15] hover:text-slate-300"
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <input {...register("frequency_days")} type="number" placeholder="Custom days" className="w-40 bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50" />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium uppercase tracking-wider">Next Due Date *</label>
                  <input {...register("next_due")} type="date" className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium uppercase tracking-wider">Estimated Cost ($)</label>
                  <input {...register("estimated_cost")} type="number" step="0.01" placeholder="25.00" className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium uppercase tracking-wider">Remind Me (days before)</label>
                  <input {...register("reminder_days_before")} type="number" className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium uppercase tracking-wider">Notes</label>
                  <input {...register("description")} placeholder="Any notes..." className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isSubmitting} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50">
                  {editingId ? "Save Changes" : "Schedule Task"}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); reset(); }} className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white border border-white/[0.08] hover:border-white/[0.15] transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Overdue ({overdueTasks.length})
          </h2>
          <TaskList
            tasks={overdueTasks}
            appliances={appliances}
            completingId={completingId}
            setCompletingId={setCompletingId}
            completeMutation={completeMutation}
            deleteMutation={deleteMutation}
            handleEdit={handleEdit}
          />
        </div>
      )}

      {/* Active/Upcoming Tasks */}
      <div>
        {overdueTasks.length > 0 && (
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Upcoming</h2>
        )}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-20 shimmer rounded-2xl" />)}
          </div>
        ) : upcomingActiveTasks.length === 0 && overdueTasks.length === 0 ? (
          <div className="text-center py-20 text-slate-600">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-slate-500">No active tasks</p>
            <p className="text-sm mt-1">Add your first maintenance task</p>
          </div>
        ) : (
          <TaskList
            tasks={upcomingActiveTasks}
            appliances={appliances}
            completingId={completingId}
            setCompletingId={setCompletingId}
            completeMutation={completeMutation}
            deleteMutation={deleteMutation}
            handleEdit={handleEdit}
          />
        )}
      </div>

      {/* Completed Tasks */}
      {completedTasks && completedTasks.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Completed ({completedTasks.length})
          </h2>
          <TaskList
            tasks={completedTasks}
            appliances={appliances}
            completingId={completingId}
            setCompletingId={setCompletingId}
            completeMutation={completeMutation}
            deleteMutation={deleteMutation}
            isCompleted
          />
        </div>
      )}
    </div>
  );
}

function TaskList({ tasks, appliances, completingId, setCompletingId, completeMutation, deleteMutation, isCompleted = false, handleEdit }: any) {
  const [completeCost, setCompleteCost] = useState<Record<number, string>>({});

  const getAppliance = (id: number) => appliances?.find((a: Appliance) => a.id === id);

  return (
    <div className="space-y-3">
      {tasks.map((task: MaintenanceTask, i: number) => (
        <TaskItem
          key={task.id}
          task={task}
          index={i}
          appliance={getAppliance(task.appliance_id)}
          completingId={completingId}
          setCompletingId={setCompletingId}
          completeMutation={completeMutation}
          deleteMutation={deleteMutation}
          isCompleted={isCompleted}
          completeCost={completeCost}
          setCompleteCost={setCompleteCost}
          handleEdit={handleEdit}
        />
      ))}
    </div>
  );
}

interface TaskItemProps {
  task: MaintenanceTask;
  index: number;
  appliance?: Appliance;
  completingId: number | null;
  setCompletingId: (id: number | null) => void;
  completeMutation: any;
  deleteMutation: any;
  isCompleted: boolean;
  completeCost: Record<number, string>;
  setCompleteCost: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  handleEdit?: (t: MaintenanceTask) => void;
}

function TaskItem({
  task,
  index,
  appliance,
  completingId,
  setCompletingId,
  completeMutation,
  deleteMutation,
  isCompleted,
  completeCost,
  setCompleteCost,
  handleEdit,
}: TaskItemProps) {
  const urgency = getTaskUrgency(task.next_due);
  const style = urgencyStyles[urgency];
  const StatusIcon = style.icon;

  const { data: logs } = useQuery({
    queryKey: ["taskLogs", task.id],
    queryFn: () => getTaskLogs(task.id),
    enabled: isCompleted,
  });
  const latestCost = logs?.[0]?.actual_cost;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn("glass-card p-4 border group", style.border, style.bg)}
    >
      <div className="flex items-center gap-4">
        <StatusIcon className={cn("w-5 h-5 flex-shrink-0", style.iconColor)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-white text-sm">{task.title}</p>
            {appliance && (
              <span className={cn("text-xs px-2 py-0.5 rounded-full border", CATEGORY_COLORS[appliance.category])}>
                {CATEGORY_LABELS[appliance.category]}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {appliance?.name} · Every {task.frequency_days} days
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Calendar className="w-3 h-3" />
              {formatDate(task.next_due)}
            </div>
            {/* show estimate for active, actual cost for completed */}
            {!isCompleted && task.estimated_cost && (
              <div className="flex items-center gap-1 text-xs text-slate-600 mt-0.5">
                <DollarSign className="w-3 h-3" />
                {formatCurrency(task.estimated_cost)}
              </div>
            )}
            {isCompleted && latestCost !== undefined && (
              <div className="flex items-center gap-1 text-xs text-slate-600 mt-0.5">
                <DollarSign className="w-3 h-3" />
                {formatCurrency(latestCost)}
              </div>
            )}
          </div>

          {completingId === task.id ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Actual cost"
                step="0.01"
                value={completeCost[task.id] || ""}
                onChange={(e) =>
                  setCompleteCost({ ...completeCost, [task.id]: e.target.value })
                }
                className="w-28 bg-white/[0.05] border border-white/[0.1] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
              />
              <button
                onClick={() =>
                  completeMutation.mutate({
                    id: task.id,
                    actual_cost: completeCost[task.id] ? parseFloat(completeCost[task.id]) : undefined,
                  })
                }
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-3 py-1.5 rounded-lg text-xs transition-all"
              >
                Done
              </button>
              <button onClick={() => setCompletingId(null)} className="text-slate-500 hover:text-white text-xs px-2 py-1.5">
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!isCompleted && handleEdit && (
                <button
                  onClick={() => handleEdit(task)}
                  className="flex items-center gap-1.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
              )}

              {!isCompleted && (
                <button
                  onClick={() => setCompletingId(task.id)}
                  className="flex items-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Complete
                </button>
              )}

              <button
                onClick={() => deleteMutation.mutate(task.id)}
                className="p-1.5 rounded-lg hover:bg-rose-500/15 text-slate-600 hover:text-rose-400 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
