import axios from "axios";
import { getSession } from "next-auth/react";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
});

api.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.backendToken) {
    config.headers.Authorization = `Bearer ${session.backendToken}`;
  }
  return config;
});

// ─── Auth ──────────────────────────────────────────────
export const getMe = () => api.get("/auth/me").then((r) => r.data);

// ─── Dashboard ─────────────────────────────────────────
export const getDashboardStats = () => api.get("/dashboard/stats").then((r) => r.data);
export const getUpcomingTasks = (days = 30) =>
  api.get(`/dashboard/upcoming-tasks?days=${days}`).then((r) => r.data);

// ─── Properties ────────────────────────────────────────
export const getProperties = () => api.get("/properties/").then((r) => r.data);
export const createProperty = (data: any) => api.post("/properties/", data).then((r) => r.data);
export const updateProperty = (id: number, data: any) =>
  api.patch(`/properties/${id}`, data).then((r) => r.data);
export const deleteProperty = (id: number) =>
  api.delete(`/properties/${id}`).then((r) => r.data);

// ─── Appliances ────────────────────────────────────────
export const getAppliances = (propertyId?: number) =>
  api.get(`/appliances/${propertyId ? `?property_id=${propertyId}` : ""}`).then((r) => r.data);
export const createAppliance = (data: any) => api.post("/appliances/", data).then((r) => r.data);
export const updateAppliance = (id: number, data: any) =>
  api.patch(`/appliances/${id}`, data).then((r) => r.data);
export const deleteAppliance = (id: number) =>
  api.delete(`/appliances/${id}`).then((r) => r.data);

// ─── Tasks ─────────────────────────────────────────────
export const getTasks = (applianceId?: number, overdueOnly = false, isActive = true) =>
  api
    .get(`/tasks/?${applianceId ? `appliance_id=${applianceId}&` : ""}${overdueOnly ? "overdue_only=true&" : ""}is_active=${isActive}`)
    .then((r) => r.data);
export const createTask = (data: any) => api.post("/tasks/", data).then((r) => r.data);
export const updateTask = (id: number, data: any) =>
  api.patch(`/tasks/${id}`, data).then((r) => r.data);
export const completeTask = (id: number, data: any) =>
  api.post(`/tasks/${id}/complete`, data).then((r) => r.data);
export const deleteTask = (id: number) => api.delete(`/tasks/${id}`).then((r) => r.data);
export const getTaskLogs = (id: number) =>
  api.get(`/tasks/${id}/logs`).then((r) => r.data);

// ─── Notifications ─────────────────────────────────────
export const getNotifications = (unreadOnly = false) =>
  api.get(`/notifications/?${unreadOnly ? "unread_only=true" : ""}`).then((r) => r.data);
export const markNotificationRead = (id: number) =>
  api.patch(`/notifications/${id}/read`).then((r) => r.data);
export const markAllRead = () => api.post("/notifications/read-all").then((r) => r.data);

export default api;
