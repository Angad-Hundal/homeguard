export interface User {
  id: number;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
}

export interface Property {
  id: number;
  user_id: number;
  name: string;
  address?: string;
  property_type: string;
  year_built?: number;
  square_footage?: number;
  created_at: string;
}

export interface Appliance {
  id: number;
  property_id: number;
  name: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  category: string;
  purchase_date?: string;
  warranty_expiry?: string;
  purchase_cost?: number;
  photo_url?: string;
  notes?: string;
  created_at: string;
}

export interface MaintenanceTask {
  id: number;
  appliance_id: number;
  title: string;
  description?: string;
  frequency_days: number;
  last_completed?: string;
  next_due: string;
  estimated_cost?: number;
  reminder_days_before: number;
  is_active: boolean;
  created_at: string;
}

export interface MaintenanceLog {
  id: number;
  task_id: number;
  completed_at: string;
  actual_cost?: number;
  notes?: string;
  completed_by?: string;
}

export interface Notification {
  id: number;
  task_id?: number;
  title: string;
  message: string;
  is_read: boolean;
  notification_type: string;
  sent_at: string;
}

export interface DashboardStats {
  total_properties: number;
  total_appliances: number;
  upcoming_tasks_count: number;
  overdue_tasks_count: number;
  total_cost_this_year: number;
  health_score: number;
  unread_notifications: number;
}

export interface UpcomingTask {
  id: number;
  title: string;
  appliance_name: string;
  property_name: string;
  next_due: string;
  is_overdue: boolean;
  estimated_cost?: number;
  category: string;
}

// Extend next-auth types
declare module "next-auth" {
  interface Session {
    backendToken: string;
  }
}
