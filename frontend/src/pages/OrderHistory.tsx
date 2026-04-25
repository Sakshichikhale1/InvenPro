import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, FileText, FileDown } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { formatINR } from '@/lib/currency';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function OrderHistory() {
  const { orders } = useInventory();
  const [typeFilter, setTypeFilter] = useState<'all' | 'sales' | 'purchase'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  const [search, setSearch] = useState('');

  const filtered = orders.filter(o => {
    if (typeFilter !== 'all' && o.type !== typeFilter) return false;
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (search && !o.id.toLowerCase().includes(search.toLowerCase()) && !o.items.some(i => i.productName.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const statusColor = (s: string) => {
    if (s === 'completed') return 'bg-success/15 text-success border-success/20';
    if (s === 'cancelled') return 'bg-destructive/15 text-destructive border-destructive/20';
    return 'bg-warning/15 text-warning border-warning/20';
  };

  const exportCSV = () => {
    const headers = ['Order ID', 'Type', 'Status', 'Items', 'Taxable', 'GST', 'Total', 'Customer/Supplier', 'Date'];
    const rows = filtered.map(o => [
      o.id, o.type, o.status,
      o.items.map(i => `${i.productName}(x${i.quantity})`).join('; '),
      o.gstBreakdown.taxableAmount, o.gstBreakdown.totalTax, o.totalAmount,
      o.customerName || o.supplierName || '-', o.createdAt,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'order-history.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="page-title">Order History</h1>
        <p className="page-subtitle">View and filter past orders with GST details</p>
      </motion.div>

      <motion.div className="flex flex-col sm:flex-row gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 bg-card" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-muted rounded-full p-0.5"><X className="h-3.5 w-3.5 text-muted-foreground" /></button>}
        </div>
        <Select value={typeFilter} onValueChange={v => setTypeFilter(v as any)}>
          <SelectTrigger className="w-40 h-10 bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="sales">Sales</SelectItem>
            <SelectItem value="purchase">Purchase</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
          <SelectTrigger className="w-40 h-10 bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportCSV} className="gap-2 h-10">
          <FileDown className="h-4 w-4" /> Export
        </Button>
      </motion.div>

      <motion.div className="bg-card rounded-xl border overflow-hidden" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ boxShadow: 'var(--shadow-card)' }}>
        <Table>
          <TableHeader className="sticky-header">
            <TableRow className="bg-muted/30">
              <TableHead className="table-header">Order ID</TableHead>
              <TableHead className="table-header">Type</TableHead>
              <TableHead className="table-header">Customer/Supplier</TableHead>
              <TableHead className="table-header">Items</TableHead>
              <TableHead className="table-header text-right">Taxable</TableHead>
              <TableHead className="table-header text-right">GST</TableHead>
              <TableHead className="table-header text-right">Total</TableHead>
              <TableHead className="table-header">Status</TableHead>
              <TableHead className="table-header">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {filtered.map((o, i) => (
                <motion.tr key={o.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.04 }} className="border-b hover:bg-muted/30 transition-colors">
                  <TableCell className="font-semibold text-sm">{o.id}</TableCell>
                  <TableCell><Badge variant="secondary" className={`text-[10px] capitalize font-medium ${o.type === 'sales' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>{o.type}</Badge></TableCell>
                  <TableCell className="text-sm">{o.customerName || o.supplierName || '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{o.items.map(i => `${i.productName} (×${i.quantity})`).join(', ')}</TableCell>
                  <TableCell className="text-right tabular-nums text-sm">{formatINR(o.gstBreakdown.taxableAmount)}</TableCell>
                  <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                    {formatINR(o.gstBreakdown.totalTax)}
                    <div className="text-[10px]">{o.isInterState ? 'IGST' : 'CGST+SGST'}</div>
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{formatINR(o.totalAmount)}</TableCell>
                  <TableCell><Badge className={`text-[10px] capitalize ${statusColor(o.status)}`}>{o.status}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{o.createdAt}</TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={9} className="text-center py-16 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/20" />
                <p className="font-medium mb-1">No orders found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
}
