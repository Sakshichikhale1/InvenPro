import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Search, X, Users, User } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { Customer } from '@/types/inventory';
import { formatINR } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const emptyForm = { name: '', gstin: '', contactPerson: '', email: '', phone: '', address: '', city: '', state: '' };

export default function Customers() {
  const { customers, addCustomer, updateCustomer, deleteCustomer, orders } = useInventory();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.city.toLowerCase().includes(search.toLowerCase()) || (c.gstin || '').toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (c: Customer) => {
    setEditId(c.id);
    setForm({ name: c.name, gstin: c.gstin || '', contactPerson: c.contactPerson, email: c.email, phone: c.phone, address: c.address, city: c.city, state: c.state });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name) return;
    if (editId) updateCustomer(editId, form);
    else addCustomer(form);
    setDialogOpen(false);
  };

  const getCustomerStats = (name: string) => {
    const customerOrders = orders.filter(o => o.type === 'sales' && o.customerName === name);
    const totalSpent = customerOrders.reduce((s, o) => s + o.totalAmount, 0);
    return { count: customerOrders.length, total: totalSpent };
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="page-title">Customers</h1>
        <p className="page-subtitle">Manage customer details and sales history</p>
      </motion.div>

      <motion.div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 bg-card" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-muted rounded-full p-0.5"><X className="h-3.5 w-3.5 text-muted-foreground" /></button>}
        </div>
        <Button onClick={openAdd} className="gap-2 h-10 px-5 shadow-sm hover:shadow-md transition-shadow">
          <Plus className="h-4 w-4" /> Add Customer
        </Button>
      </motion.div>

      <motion.div className="bg-card rounded-xl border overflow-hidden" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky-header">
              <TableRow className="bg-muted/30">
                <TableHead className="table-header">Name</TableHead>
                <TableHead className="table-header">GSTIN</TableHead>
                <TableHead className="table-header">Contact</TableHead>
                <TableHead className="table-header">Location</TableHead>
                <TableHead className="table-header text-center">Orders</TableHead>
                <TableHead className="table-header text-right">Total Spent</TableHead>
                <TableHead className="table-header text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {filtered.map((c, i) => {
                  const stats = getCustomerStats(c.name);
                  return (
                    <motion.tr key={c.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }} className="border-b hover:bg-muted/30 transition-colors group">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                            <User className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="font-medium">{c.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-mono text-[12px] text-muted-foreground">{c.gstin || '-'}</TableCell>
                      <TableCell>
                        <div className="text-sm">{c.contactPerson}</div>
                        <div className="text-xs text-muted-foreground">{c.phone}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.city}, {c.state}</TableCell>
                      <TableCell className="text-center"><Badge variant="secondary" className="text-[10px]">{stats.count}</Badge></TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{formatINR(stats.total)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-primary/10 hover:text-primary" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteCustomer(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/20" />
                  <p className="font-medium mb-1">No customers found</p>
                  <p className="text-sm">Add your first customer to get started</p>
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Edit Customer' : 'Add Customer'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="text-xs font-medium">Company Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">GSTIN</Label><Input value={form.gstin} onChange={e => setForm({ ...form, gstin: e.target.value })} placeholder="e.g. 27AABCT1234F1Z5" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="text-xs font-medium">Contact Person</Label><Input value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">Address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="text-xs font-medium">City</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">State</Label><Input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} /></div>
            </div>
            <Button onClick={handleSave} className="w-full mt-2 h-10">{editId ? 'Update Customer' : 'Add Customer'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
