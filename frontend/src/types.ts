export interface EmployeeSchedule {
  id: string;
  employeeId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string | null;
  endTime: string | null;
  isOff: boolean;
}

export interface Employee {
  id: string;
  name: string;
  username?: string | null;
  role: 'OWNER' | 'ADMIN' | 'STAFF';
  phoneNumber: string;
  specialty?: string | null;
  isActive: boolean;
  branchId: string;
  schedules?: EmployeeSchedule[];
}

export interface Branch {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  employees?: Employee[];
  services?: any[];
}

export interface WaitlistItem {
  id: string;
  firstName: string;
  phone: string;
  service: string;
  stylist: string;
  checkInTime: string;
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface DashboardStats {
  appointmentsToday: number;
  waitingQueueCount: number;
  activeStylists: number;
  totalServices: number;
}
