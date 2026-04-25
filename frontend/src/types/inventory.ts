export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  costPrice: number;
  quantity: number;
  reorderLevel: number;
  supplier: string;
  hsnCode?: string;
  gstRate: number; // 0, 5, 12, 18, 28
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  gstin?: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  gstin?: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  gstRate: number;
  hsnCode?: string;
}

export interface GSTBreakdown {
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  totalWithTax: number;
  isInterState: boolean;
}

export interface Order {
  id: string;
  type: 'sales' | 'purchase';
  status: 'pending' | 'completed' | 'cancelled';
  items: OrderItem[];
  totalAmount: number;
  gstBreakdown: GSTBreakdown;
  customerId?: string;
  customerName?: string;
  supplierId?: string;
  supplierName?: string;
  isInterState: boolean;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  type: 'product' | 'order' | 'stock' | 'alert';
}

export interface Alert {
  id: string;
  productId: string;
  productName: string;
  type: 'low-stock' | 'out-of-stock' | 'dead-stock';
  message: string;
  currentStock: number;
  reorderLevel: number;
  timestamp: string;
  dismissed: boolean;
}
