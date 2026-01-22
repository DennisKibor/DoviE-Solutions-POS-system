
export type UserRole = 'Admin' | 'Manager' | 'Cashier';

export interface AuditEntry {
  id: string;
  timestamp: number;
  user: string;
  role: UserRole;
  action: string;
  details: string;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  phone: string;
  code: string;
  isActive: boolean;
}

export interface StockAdjustment {
  id: string;
  type: 'sale' | 'restock' | 'correction' | 'waste';
  quantity: number;
  previousStock: number;
  newStock: number;
  timestamp: number;
  user: string;
  note?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  description: string;
  barcode?: string;
  batchNumber?: string;
  expiryDate?: string;
  history?: StockAdjustment[];
}

export interface CartItem extends Product {
  quantity: number;
}

export type PaymentMethod = 'Cash' | 'M-Pesa' | 'Card';

export interface Sale {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  timestamp: number;
  status: 'completed' | 'voided' | 'refunded';
  cashierName?: string;
  branch?: string;
  branchId?: string; // Track specifically by ID
}

export interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  timestamp: number;
  branchId?: string; // Track specifically by ID
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: 'active' | 'on-break' | 'clocked-out';
  avatar: string;
  joinedDate: number;
  lastStatusChange?: number;
  pin?: string; // 4-digit security PIN
  homeBranchId?: string; // Associated branch ID
}

export interface InventoryStats {
  totalProducts: number;
  lowStockCount: number;
  totalValue: number;
}
