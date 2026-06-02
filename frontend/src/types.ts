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

export interface Service {
  id: string;
  name: string;
  price: string;
  category?: string | null;
  durationMinutes: number;
  bufferTime: number;
  isActive: boolean;
  description?: string | null;
  imageUrl?: string | null;
}

export interface ServicePayload {
  name: string;
  price: number;
  category: string;
  durationMinutes: number;
  bufferTime: number;
  description?: string;
  isActive?: boolean;
  branchId?: string;
  imageUrl?: string;
}

export interface Branch {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  employees?: Employee[];
  services?: Service[];
  inventoryItems?: InventoryItem[];
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

export interface InventoryItem {
  id: string;
  name: string;
  stockQuantity: number;
  reorderLevel: number;
  cost: string | number;
  branchId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryItemPayload {
  name: string;
  quantity: number;
  reorderLevel: number;
  costPrice: number;
  branchId?: string;
}
