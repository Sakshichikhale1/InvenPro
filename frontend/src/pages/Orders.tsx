import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ShoppingCart, ArrowRight, Receipt } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { OrderItem } from '@/types/inventory';
import { formatINR } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function Orders() {
  const { products, orders, createOrder, updateOrderStatus, suppliers, customers, calcGST } = useInventory();
  const [orderType, setOrderType] = useState<'sales' | 'purchase'>('sales');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');
  const [isInterState, setIsInterState] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');

  const addItem = () => {
    const p = products.find(x => x.id === selectedProduct);
    if (!p) return;
    if (items.find(i => i.productId === p.id)) { toast.error('Product already added'); return; }
    setItems([...items, {
      productId: p.id, productName: p.name, quantity: qty,
      unitPrice: orderType === 'purchase' ? p.costPrice : p.price,
      costPrice: p.costPrice, gstRate: p.gstRate, hsnCode: p.hsnCode,
    }]);
    setSelectedProduct(''); setQty(1);
  };

  const removeItem = (pid: string) => setItems(items.filter(i => i.productId !== pid));
  const gst = calcGST(items, isInterState);

  const submitOrder = () => {
    if (items.length === 0) { toast.error('Add at least one product'); return; }
    const customer = customers.find(c => c.id === selectedCustomer);
    const supplier = suppliers.find(s => s.id === selectedSupplier);
    createOrder({
      type: orderType, status: 'pending', items, notes, isInterState, gstBreakdown: gst,
      customerId: customer?.id, customerName: customer?.name,
      supplierId: supplier?.id, supplierName: supplier?.name,
    });
    setItems([]); setNotes(''); setSelectedCustomer(''); setSelectedSupplier('');
    toast.success('Order created successfully! 🎉');
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');

  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="page-title">Create Order</h1>
        <p className="page-subtitle">Create sales or purchase orders with GST calculation</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div className="lg:col-span-2 stat-card space-y-5" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.5 }}>
          <div className="flex gap-2 p-1 bg-muted/60 rounded-xl">
            <button onClick={() => setOrderType('sales')} className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${orderType === 'sales' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              📤 Sales Order
            </button>
            <button onClick={() => setOrderType('purchase')} className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${orderType === 'purchase' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              📥 Purchase Order
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {orderType === 'sales' ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Customer</Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>
                    {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name} {c.gstin && <span className="text-muted-foreground">({c.gstin})</span>}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Supplier</Label>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select supplier" /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-end gap-3">
              <div className="flex items-center gap-2">
                <Switch checked={isInterState} onCheckedChange={setIsInterState} />
                <Label className="text-xs font-medium">{isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST+SGST)'}</Label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Label className="text-xs font-medium">Product</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="font-medium">{p.name}</span>
                      <span className="text-muted-foreground ml-1">({p.quantity} in stock) • {p.gstRate}% GST</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-24">
              <Label className="text-xs font-medium">Qty</Label>
              <Input type="number" min={1} value={qty} onChange={e => setQty(+e.target.value)} className="h-10" />
            </div>
            <Button onClick={addItem} size="icon" className="h-10 w-10 shrink-0 shadow-sm"><Plus className="h-4 w-4" /></Button>
          </div>

          <AnimatePresence>
            {items.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <Table>
                  <TableHeader className="sticky-header">
                    <TableRow className="bg-muted/30">
                      <TableHead className="table-header">Product</TableHead>
                      <TableHead className="table-header text-center">HSN</TableHead>
                      <TableHead className="table-header text-right">Qty</TableHead>
                      <TableHead className="table-header text-right">Unit Price</TableHead>
                      <TableHead className="table-header text-center">GST</TableHead>
                      <TableHead className="table-header text-right">Subtotal</TableHead>
                      <TableHead className="table-header w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((i, idx) => (
                      <motion.tr key={i.productId} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: idx * 0.05 }} className="border-b">
                        <TableCell className="font-medium">{i.productName}</TableCell>
                        <TableCell className="text-center text-xs text-muted-foreground">{i.hsnCode || '-'}</TableCell>
                        <TableCell className="text-right tabular-nums">{i.quantity}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatINR(i.unitPrice)}</TableCell>
                        <TableCell className="text-center"><Badge variant="outline" className="text-[10px]">{i.gstRate}%</Badge></TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">{formatINR(i.quantity * i.unitPrice)}</TableCell>
                        <TableCell><Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive rounded-xl transition-colors" onClick={() => removeItem(i.productId)}><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Notes (optional)</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Add any relevant notes..." className="resize-none" />
          </div>

          {items.length > 0 && (
            <motion.div className="bg-muted/30 rounded-xl p-4 space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center gap-2 mb-3">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">GST Breakdown</span>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                <span className="text-muted-foreground">Taxable Amount</span>
                <span className="text-right font-medium tabular-nums">{formatINR(gst.taxableAmount)}</span>
                {!isInterState ? (
                  <>
                    <span className="text-muted-foreground">CGST</span>
                    <span className="text-right tabular-nums">{formatINR(gst.cgst)}</span>
                    <span className="text-muted-foreground">SGST</span>
                    <span className="text-right tabular-nums">{formatINR(gst.sgst)}</span>
                  </>
                ) : (
                  <>
                    <span className="text-muted-foreground">IGST</span>
                    <span className="text-right tabular-nums">{formatINR(gst.igst)}</span>
                  </>
                )}
                <span className="text-muted-foreground font-medium pt-2 border-t">Total Tax</span>
                <span className="text-right font-medium tabular-nums pt-2 border-t">{formatINR(gst.totalTax)}</span>
              </div>
            </motion.div>
          )}

          <motion.div className="flex items-center justify-between pt-4 border-t" layout>
            <div>
              <span className="text-xs text-muted-foreground">Order Total (incl. GST)</span>
              <motion.div className="text-xl font-bold" key={gst.totalWithTax} initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                {formatINR(gst.totalWithTax)}
              </motion.div>
            </div>
            <Button onClick={submitOrder} disabled={items.length === 0} className="gap-2 h-10 px-6 shadow-sm hover:shadow-md transition-shadow">
              Create Order <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </motion.div>

        <motion.div className="stat-card space-y-4" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.5 }}>
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Pending Orders</h3>
            <Badge variant="secondary" className="text-[10px] ml-auto">{pendingOrders.length}</Badge>
          </div>
          {pendingOrders.length === 0 && (
            <div className="text-center py-8">
              <ShoppingCart className="h-10 w-10 mx-auto text-muted-foreground/20 mb-2" />
              <p className="text-sm text-muted-foreground font-medium">No pending orders</p>
              <p className="text-xs text-muted-foreground mt-1">Create your first order</p>
            </div>
          )}
          <AnimatePresence>
            {pendingOrders.map((o, i) => (
              <motion.div key={o.id} className="p-3.5 rounded-xl border space-y-2.5 hover:border-primary/20 transition-colors" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{o.id}</span>
                  <Badge variant="secondary" className={`text-[10px] capitalize font-medium ${o.type === 'sales' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>{o.type}</Badge>
                </div>
                {(o.customerName || o.supplierName) && (
                  <div className="text-xs text-muted-foreground">{o.customerName || o.supplierName}</div>
                )}
                <div className="text-xs text-muted-foreground">{o.items.length} items · <span className="font-medium text-foreground">{formatINR(o.totalAmount)}</span></div>
                <div className="flex gap-2">
                  <Button size="sm" variant="default" className="flex-1 h-8 text-xs shadow-sm" onClick={() => { updateOrderStatus(o.id, 'completed'); toast.success('Order completed! ✅'); }}>Complete</Button>
                  <Button size="sm" variant="secondary" className="flex-1 h-8 text-xs" onClick={() => { updateOrderStatus(o.id, 'cancelled'); toast('Order cancelled'); }}>Cancel</Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
