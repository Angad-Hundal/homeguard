import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format, isPast, isWithinInterval, addDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return format(new Date(date), "MMM d, yyyy");
}

export function formatRelative(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function isOverdue(date: string | Date) {
  return isPast(new Date(date));
}

export function isDueSoon(date: string | Date, days = 7) {
  const d = new Date(date);
  return isWithinInterval(d, { start: new Date(), end: addDays(new Date(), days) });
}

export function getTaskUrgency(nextDue: string): "overdue" | "soon" | "upcoming" | "ok" {
  if (isOverdue(nextDue)) return "overdue";
  if (isDueSoon(nextDue, 7)) return "soon";
  if (isDueSoon(nextDue, 30)) return "upcoming";
  return "ok";
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export const CATEGORY_LABELS: Record<string, string> = {
  hvac: "HVAC",
  kitchen: "Kitchen",
  plumbing: "Plumbing",
  electrical: "Electrical",
  exterior: "Exterior",
  laundry: "Laundry",
  safety: "Safety",
  other: "Other",
};

export const CATEGORY_COLORS: Record<string, string> = {
  hvac: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  kitchen: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  plumbing: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  electrical: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  exterior: "bg-green-500/20 text-green-400 border-green-500/30",
  laundry: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  safety: "bg-red-500/20 text-red-400 border-red-500/30",
  other: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  house: "House",
  apartment: "Apartment",
  condo: "Condo",
  townhouse: "Townhouse",
  other: "Other",
};

export const FREQUENCY_PRESETS = [
  { label: "Weekly", days: 7 },
  { label: "Monthly", days: 30 },
  { label: "Every 3 months", days: 90 },
  { label: "Every 6 months", days: 180 },
  { label: "Yearly", days: 365 },
  { label: "Every 2 years", days: 730 },
];
