export interface EmployeeSchedule {
  id: string;
  employeeId: string;
  branchId: string;
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
  branchId?: string;
  branches?: Branch[];
  schedules?: EmployeeSchedule[];
}

export interface Service {
  id: string;
  name: string;
  /** Prisma Decimal serialized as a number in JSON responses. */
  price: number;
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
  lastName: string;
  phone: string;
  service: string;
  stylist: string;
  checkInTime: string;
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  queueNumber?: string | null;
}

export interface LoyaltyTransaction {
  id: string;
  clientId: string;
  amount: number;
  type: 'EARNED' | 'REDEEMED' | 'ADJUSTED';
  description: string;
  createdAt: string;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  birthday?: string | null;
  loyaltyPoints: number;
  notes?: string | null;
  appointments?: Appointment[];
  loyaltyTransactions?: LoyaltyTransaction[];
}

export interface ClientPayload {
  firstName: string;
  lastName?: string;
  phoneNumber?: string;
  birthday?: string;
  notes?: string;
}

export interface DashboardStats {
  appointmentsToday: number;
  waitingQueueCount: number;
  activeStylists: number;
  totalServices: number;
  birthdayCelebrants?: string[];
}

export interface InventoryItem {
  id: string;
  name: string;
  stockQuantity: number;
  reorderLevel: number;
  /** Prisma Decimal serialized as a number in JSON responses. */
  cost: number;
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

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'WAITING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface AppointmentClient {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  loyaltyPoints: number;
}

export interface AppointmentServiceRelation {
  appointmentId: string;
  serviceId: string;
  service: Service;
}

export interface Appointment {
  id: string;
  branchId: string;
  clientId: string;
  employeeId?: string | null;
  appointmentDate: string;
  startTime?: string | null;
  endTime?: string | null;
  status: AppointmentStatus;
  notes?: string | null;
  client?: AppointmentClient | null;
  employee?: Employee | null;
  services?: AppointmentServiceRelation[];
  queueNumber?: string | null;
}

export interface RevenueTrendItem {
  month: string;
  revenue: number;
  profit: number;
}

export interface DailyTrendItem {
  day: string;
  revenue: number;
}

export interface CategoryDistributionItem {
  category: string;
  value: number;
}

export interface StylistSalesPerformance {
  employeeId: string;
  employeeName: string;
  servicesCount: number;
  salesAmount: number;
}

export interface FinancialTransaction {
  id: string;
  clientName: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  services: string[];
}

export interface FinancialKPIs {
  totalRevenue: number;
  netProfit: number;
}

export interface FinancialData {
  kpis: FinancialKPIs;
  monthlyTrends: RevenueTrendItem[];
  dailyTrends: DailyTrendItem[];
  categoryDistribution: CategoryDistributionItem[];
  stylistPerformance: StylistSalesPerformance[];
  recentLedger: FinancialTransaction[];
}
