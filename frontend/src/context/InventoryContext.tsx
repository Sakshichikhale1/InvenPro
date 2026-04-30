import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Product, Order, OrderItem, ActivityLog, Alert, Supplier, Customer, GSTBreakdown } from '@/types/inventory';
import { useNotification } from './NotificationContext';

const SAMPLE_SUPPLIERS: Supplier[] = [
  { id: 's1', name: 'TechParts Inc', gstin: '27AABCT1234F1Z5', contactPerson: 'Rahul Sharma', email: 'rahul@techparts.in', phone: '+91 98765 43210', address: '42 Electronics Hub', city: 'Mumbai', state: 'Maharashtra', createdAt: '2025-01-01' },
  { id: 's2', name: 'CableCo', gstin: '29AABCC5678G2Z3', contactPerson: 'Priya Reddy', email: 'priya@cableco.in', phone: '+91 87654 32109', address: '15 Industrial Area', city: 'Bangalore', state: 'Karnataka', createdAt: '2025-01-10' },
  { id: 's3', name: 'KeyTech', gstin: '27AABCK9012H3Z1', contactPerson: 'Amit Patel', email: 'amit@keytech.in', phone: '+91 76543 21098', address: '8 Tech Park', city: 'Pune', state: 'Maharashtra', createdAt: '2025-02-01' },
  { id: 's4', name: 'DeskPro', gstin: '07AABCD3456I4Z9', contactPerson: 'Neha Gupta', email: 'neha@deskpro.in', phone: '+91 65432 10987', address: '22 Furniture Market', city: 'Delhi', state: 'Delhi', createdAt: '2025-02-15' },
  { id: 's5', name: 'LightWorks', gstin: '27AABCL7890J5Z7', contactPerson: 'Vikram Singh', email: 'vikram@lightworks.in', phone: '+91 54321 09876', address: '5 Lamp Street', city: 'Mumbai', state: 'Maharashtra', createdAt: '2025-03-01' },
  { id: 's6', name: 'PaperHouse', gstin: '33AABCP2345K6Z5', contactPerson: 'Lakshmi Nair', email: 'lakshmi@paperhouse.in', phone: '+91 43210 98765', address: '30 Stationery Lane', city: 'Chennai', state: 'Tamil Nadu', createdAt: '2025-03-10' },
];

const SAMPLE_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Infosys Ltd', gstin: '29AABCI1234A1Z1', contactPerson: 'Suresh Kumar', email: 'suresh@infosys.com', phone: '+91 98761 11111', address: 'Electronics City', city: 'Bangalore', state: 'Karnataka', createdAt: '2025-01-15' },
  { id: 'c2', name: 'TCS Mumbai', gstin: '27AABCT5678B2Z3', contactPerson: 'Meera Joshi', email: 'meera@tcs.com', phone: '+91 98762 22222', address: 'Andheri East', city: 'Mumbai', state: 'Maharashtra', createdAt: '2025-02-01' },
  { id: 'c3', name: 'Wipro Delhi', gstin: '07AABCW9012C3Z5', contactPerson: 'Arjun Verma', email: 'arjun@wipro.com', phone: '+91 98763 33333', address: 'Connaught Place', city: 'Delhi', state: 'Delhi', createdAt: '2025-02-20' },
];

const SAMPLE_PRODUCTS: Product[] = [
  { id: '1', name: 'Logitech Wireless Mouse', sku: 'WM-001', category: 'Electronics', price: 699, costPrice: 450, quantity: 45, reorderLevel: 20, supplier: 'TechParts Inc', hsnCode: '8471', gstRate: 18, createdAt: '2025-01-15', updatedAt: '2025-04-10' },
  { id: '2', name: 'USB-C Charging Cable', sku: 'UC-002', category: 'Accessories', price: 399, costPrice: 180, quantity: 8, reorderLevel: 30, supplier: 'CableCo', hsnCode: '8544', gstRate: 18, createdAt: '2025-02-01', updatedAt: '2025-04-12' },
  { id: '3', name: 'Redgear Mechanical Keyboard', sku: 'MK-003', category: 'Electronics', price: 2499, costPrice: 1650, quantity: 120, reorderLevel: 15, supplier: 'KeyTech', hsnCode: '8471', gstRate: 18, createdAt: '2025-01-20', updatedAt: '2025-04-08' },
  { id: '4', name: 'Adjustable Monitor Stand', sku: 'MS-004', category: 'Furniture', price: 1499, costPrice: 850, quantity: 3, reorderLevel: 10, supplier: 'DeskPro', hsnCode: '9403', gstRate: 18, createdAt: '2025-03-01', updatedAt: '2025-04-11' },
  { id: '5', name: 'Logitech HD Webcam', sku: 'WC-005', category: 'Electronics', price: 2799, costPrice: 1900, quantity: 62, reorderLevel: 20, supplier: 'TechParts Inc', hsnCode: '8525', gstRate: 18, createdAt: '2025-02-15', updatedAt: '2025-04-09' },
  { id: '6', name: 'LED Touch Desk Lamp', sku: 'DL-006', category: 'Furniture', price: 899, costPrice: 450, quantity: 0, reorderLevel: 10, supplier: 'LightWorks', hsnCode: '9405', gstRate: 12, createdAt: '2025-03-10', updatedAt: '2025-04-13' },
  { id: '7', name: 'Classmate A5 Notebook', sku: 'NB-007', category: 'Stationery', price: 249, costPrice: 125, quantity: 200, reorderLevel: 50, supplier: 'PaperHouse', hsnCode: '4820', gstRate: 12, createdAt: '2025-01-05', updatedAt: '2025-03-20' },
  { id: '8', name: 'Green Soul Ergonomic Chair', sku: 'EC-008', category: 'Furniture', price: 9499, costPrice: 6500, quantity: 12, reorderLevel: 5, supplier: 'DeskPro', hsnCode: '9401', gstRate: 18, createdAt: '2025-02-20', updatedAt: '2025-04-06' },
];

const calcGST = (items: OrderItem[], isInterState: boolean): GSTBreakdown => {
  const taxableAmount = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const totalTax = items.reduce((s, i) => s + (i.quantity * i.unitPrice * i.gstRate / 100), 0);
  return {
    taxableAmount,
    cgst: isInterState ? 0 : totalTax / 2,
    sgst: isInterState ? 0 : totalTax / 2,
    igst: isInterState ? totalTax : 0,
    totalTax,
    totalWithTax: taxableAmount + totalTax,
    isInterState,
  };
};

const defaultGST: GSTBreakdown = { taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0, totalWithTax: 0, isInterState: false };

const SAMPLE_ORDERS: Order[] = [
  { id: 'ORD-001', type: 'sales', status: 'completed', items: [{ productId: '1', productName: 'Wireless Mouse', quantity: 5, unitPrice: 2499, costPrice: 1250, gstRate: 18, hsnCode: '8471' }, { productId: '3', productName: 'Mechanical Keyboard', quantity: 2, unitPrice: 7499, costPrice: 3750, gstRate: 18, hsnCode: '8471' }], totalAmount: 32522, gstBreakdown: { taxableAmount: 27493, cgst: 2475, sgst: 2475, igst: 0, totalTax: 4949, totalWithTax: 32442, isInterState: false }, customerId: 'c2', customerName: 'TCS Mumbai', isInterState: false, createdAt: '2025-04-10', updatedAt: '2025-04-10' },
  { id: 'ORD-002', type: 'purchase', status: 'pending', items: [{ productId: '2', productName: 'USB-C Cable', quantity: 50, unitPrice: 375, costPrice: 375, gstRate: 18, hsnCode: '8544' }], totalAmount: 22125, gstBreakdown: { taxableAmount: 18750, cgst: 0, sgst: 0, igst: 3375, totalTax: 3375, totalWithTax: 22125, isInterState: true }, supplierId: 's2', supplierName: 'CableCo', isInterState: true, createdAt: '2025-04-12', updatedAt: '2025-04-12' },
  { id: 'ORD-003', type: 'sales', status: 'pending', items: [{ productId: '5', productName: 'Webcam HD', quantity: 10, unitPrice: 5849, costPrice: 2500, gstRate: 18, hsnCode: '8525' }], totalAmount: 69018, gstBreakdown: { taxableAmount: 58490, cgst: 0, sgst: 0, igst: 10528, totalTax: 10528, totalWithTax: 69018, isInterState: true }, customerId: 'c1', customerName: 'Infosys Ltd', isInterState: true, createdAt: '2025-04-13', updatedAt: '2025-04-13' },
];

interface InventoryContextType {
  products: Product[];
  orders: Order[];
  activityLogs: ActivityLog[];
  alerts: Alert[];
  suppliers: Supplier[];
  customers: Customer[];
  addProduct: (p: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  createOrder: (o: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'totalAmount'>) => void;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  dismissAlert: (id: string) => void;
  generateAlerts: () => void;
  addSupplier: (s: Omit<Supplier, 'id' | 'createdAt'>) => void;
  updateSupplier: (id: string, s: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  addCustomer: (c: Omit<Customer, 'id' | 'createdAt'>) => void;
  updateCustomer: (id: string, c: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  calcGST: (items: OrderItem[], isInterState: boolean) => GSTBreakdown;
}

const InventoryContext = createContext<InventoryContextType | null>(null);

export const useInventory = () => {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used within InventoryProvider');
  return ctx;
};

const genId = () => Math.random().toString(36).substr(2, 9);
const now = () => new Date().toISOString().split('T')[0];

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const { sendSystemNotification } = useNotification();
  const [products, setProducts] = useState<Product[]>(SAMPLE_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(SAMPLE_ORDERS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(SAMPLE_SUPPLIERS);
  const [customers, setCustomers] = useState<Customer[]>(SAMPLE_CUSTOMERS);
  const [activityLogs, setLogs] = useState<ActivityLog[]>([
    { id: '1', action: 'Product Added', details: 'Wireless Mouse added to inventory', timestamp: '2025-04-10T09:00:00', type: 'product' },
    { id: '2', action: 'Order Created', details: 'Sales order ORD-001 created', timestamp: '2025-04-10T10:30:00', type: 'order' },
    { id: '3', action: 'Stock Updated', details: 'USB-C Cable stock reduced to 8 units', timestamp: '2025-04-12T14:00:00', type: 'stock' },
    { id: '4', action: 'Low Stock Alert', details: 'Monitor Stand below reorder level', timestamp: '2025-04-13T08:00:00', type: 'alert' },
  ]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [notifiedProductIds, setNotifiedProductIds] = useState<Set<string>>(new Set());

  const addLog = useCallback((action: string, details: string, type: ActivityLog['type']) => {
    setLogs(prev => [{ id: genId(), action, details, timestamp: new Date().toISOString(), type }, ...prev]);
  }, []);

  const generateAlerts = useCallback(() => {
    const newAlerts: Alert[] = products
      .filter(p => p.quantity <= p.reorderLevel)
      .map(p => ({
        id: genId(), productId: p.id, productName: p.name,
        type: p.quantity === 0 ? 'out-of-stock' as const : 'low-stock' as const,
        message: p.quantity === 0 ? `${p.name} is out of stock!` : `${p.name} is below reorder level (${p.quantity}/${p.reorderLevel})`,
        currentStock: p.quantity, reorderLevel: p.reorderLevel, timestamp: new Date().toISOString(), dismissed: false,
      }));
    setAlerts(newAlerts);
  }, [products]);

  useEffect(() => { generateAlerts(); }, [products, generateAlerts]);

  // Show system notifications for new alerts
  useEffect(() => {
    alerts.forEach(alert => {
      if (!notifiedProductIds.has(alert.productId) && !alert.dismissed) {
        if (alert.type === 'out-of-stock') {
          sendSystemNotification(`🚨 OUT OF STOCK: ${alert.productName}`, {
            body: `Current stock: ${alert.currentStock} units\nPlease reorder immediately!`,
            tag: `stock-alert-${alert.productId}`,
            requireInteraction: true,
          });
        } else {
          sendSystemNotification(`⚠️ LOW STOCK: ${alert.productName}`, {
            body: `Current: ${alert.currentStock} units | Reorder level: ${alert.reorderLevel}`,
            tag: `stock-alert-${alert.productId}`,
          });
        }
      }
    });
    
    // Update notified product IDs
    setNotifiedProductIds(new Set(alerts.map(a => a.productId)));
  }, [alerts, notifiedProductIds, sendSystemNotification]);

  const addProduct = useCallback((p: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const product = { ...p, id: genId(), createdAt: now(), updatedAt: now() };
    setProducts(prev => [...prev, product]);
    addLog('Product Added', `${p.name} (${p.sku}) added`, 'product');
  }, [addLog]);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates, updatedAt: now() } : p));
    addLog('Product Updated', `Product ${id} updated`, 'product');
  }, [addLog]);

  const deleteProduct = useCallback((id: string) => {
    setProducts(prev => {
      const p = prev.find(x => x.id === id);
      if (p) addLog('Product Deleted', `${p.name} removed`, 'product');
      return prev.filter(x => x.id !== id);
    });
  }, [addLog]);

  const createOrder = useCallback((o: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'totalAmount'>) => {
    const gst = o.gstBreakdown || calcGST(o.items, o.isInterState);
    const total = gst.totalWithTax;
    const order: Order = { ...o, id: `ORD-${String(orders.length + 1).padStart(3, '0')}`, totalAmount: total, gstBreakdown: gst, createdAt: now(), updatedAt: now() };
    setOrders(prev => [...prev, order]);

    if (o.type === 'sales') {
      setProducts(prev => prev.map(p => {
        const item = o.items.find(i => i.productId === p.id);
        return item ? { ...p, quantity: Math.max(0, p.quantity - item.quantity), updatedAt: now() } : p;
      }));
    } else {
      setProducts(prev => prev.map(p => {
        const item = o.items.find(i => i.productId === p.id);
        return item ? { ...p, quantity: p.quantity + item.quantity, updatedAt: now() } : p;
      }));
    }
    addLog('Order Created', `${o.type} order created with ${o.items.length} items (₹${total.toLocaleString('en-IN')})`, 'order');
  }, [orders.length, addLog]);

  const updateOrderStatus = useCallback((id: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status, updatedAt: now() } : o));
    addLog('Order Updated', `Order ${id} marked as ${status}`, 'order');
  }, [addLog]);

  const dismissAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a));
  }, []);

  const addSupplier = useCallback((s: Omit<Supplier, 'id' | 'createdAt'>) => {
    setSuppliers(prev => [...prev, { ...s, id: genId(), createdAt: now() }]);
    addLog('Supplier Added', `${s.name} added`, 'product');
  }, [addLog]);

  const updateSupplier = useCallback((id: string, updates: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const deleteSupplier = useCallback((id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
  }, []);

  const addCustomer = useCallback((c: Omit<Customer, 'id' | 'createdAt'>) => {
    setCustomers(prev => [...prev, { ...c, id: genId(), createdAt: now() }]);
    addLog('Customer Added', `${c.name} added`, 'order');
  }, [addLog]);

  const updateCustomer = useCallback((id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const deleteCustomer = useCallback((id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
  }, []);

  return (
    <InventoryContext.Provider value={{ products, orders, activityLogs, alerts, suppliers, customers, addProduct, updateProduct, deleteProduct, createOrder, updateOrderStatus, dismissAlert, generateAlerts, addSupplier, updateSupplier, deleteSupplier, addCustomer, updateCustomer, deleteCustomer, calcGST }}>
      {children}
    </InventoryContext.Provider>
  );
};
