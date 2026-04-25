import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Search, X, Package, FileDown } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { Product } from '@/types/inventory';
import { formatINR } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BarcodeScanner from '@/components/BarcodeScanner';
import { Camera } from 'lucide-react';

const emptyForm = { name: '', sku: '', category: '', price: 0, costPrice: 0, quantity: 0, reorderLevel: 10, supplier: '', gstRate: 18, hsnCode: '' };

const GST_RATES = [0, 5, 12, 18, 28];

export default function Products() {
  const { products, addProduct, updateProduct, deleteProduct } = useInventory();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<keyof Product>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = products
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const toggleSort = (key: keyof Product) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const openAdd = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (p: Product) => {
    setEditId(p.id);
    setForm({ name: p.name, sku: p.sku, category: p.category, price: p.price, costPrice: p.costPrice, quantity: p.quantity, reorderLevel: p.reorderLevel, supplier: p.supplier, gstRate: p.gstRate, hsnCode: p.hsnCode || '' });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.sku) return;
    if (editId) updateProduct(editId, form);
    else addProduct(form);
    setDialogOpen(false);
  };

  const handleScan = (data: any) => {
    setScanDialogOpen(false);
    if (data.success && data.product) {
      // Product exists, open edit dialog
      const p = data.product;
      // Note: Backend might return product without ID if it's mock, 
      // but in frontend we need to match it to existing products or use the data.
      // For now, let's just pre-fill the form.
      setForm({
        name: p.name,
        sku: data.barcode || p.sku,
        category: p.category,
        price: p.price,
        costPrice: p.costPrice || 0,
        quantity: p.quantity || 1,
        reorderLevel: p.reorderLevel || 10,
        supplier: p.supplier || '',
        gstRate: p.gstRate || 18,
        hsnCode: p.hsnCode || ''
      });
      setEditId(null); // Treat as "add" or "update" depending on if SKU exists
      // Check if product with this SKU already exists in our context
      const existing = products.find(prod => prod.sku === (data.barcode || p.sku));
      if (existing) {
        setEditId(existing.id);
      }
      setDialogOpen(true);
    } else {
      // Product doesn't exist, open add dialog with SKU pre-filled
      setForm({ ...emptyForm, sku: data.barcode });
      setEditId(null);
      setDialogOpen(true);
    }
  };

  const exportCSV = () => {
    const headers = ['Name', 'SKU', 'Category', 'Price', 'Cost Price', 'Quantity', 'Reorder Level', 'GST Rate', 'HSN Code', 'Supplier'];
    const rows = filtered.map(p => [p.name, p.sku, p.category, p.price, p.costPrice, p.quantity, p.reorderLevel, `${p.gstRate}%`, p.hsnCode || '', p.supplier]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'products.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const stockBadge = (p: Product) => {
    if (p.quantity === 0) return <Badge variant="destructive" className="text-[10px] px-2.5 py-0.5">Out of Stock</Badge>;
    if (p.quantity <= p.reorderLevel) return <Badge className="bg-warning/15 text-warning border-warning/20 text-[10px] px-2.5 py-0.5">Low Stock</Badge>;
    return <Badge className="bg-success/15 text-success border-success/20 text-[10px] px-2.5 py-0.5">In Stock</Badge>;
  };

  const profitMargin = (p: Product) => {
    if (p.costPrice === 0) return 0;
    return ((p.price - p.costPrice) / p.price * 100);
  };

  const SortIcon = ({ k }: { k: keyof Product }) => sortKey === k ? <span className="ml-1 text-[10px] text-primary">{sortDir === 'asc' ? '▲' : '▼'}</span> : null;

  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="page-title">Products</h1>
        <p className="page-subtitle">Manage your inventory catalog</p>
      </motion.div>

      <motion.div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, SKU, or category..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 bg-card" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-muted rounded-full p-0.5 transition-colors"><X className="h-3.5 w-3.5 text-muted-foreground" /></button>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setScanDialogOpen(true)} className="gap-2 h-10 border-primary/20 hover:bg-primary/5">
            <Camera className="h-4 w-4 text-primary" /> Scan Barcode
          </Button>
          <Button variant="outline" onClick={exportCSV} className="gap-2 h-10">
            <FileDown className="h-4 w-4" /> Export
          </Button>
          <Button onClick={openAdd} className="gap-2 h-10 px-5 shadow-sm hover:shadow-md transition-shadow">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </div>
      </motion.div>

      <motion.div className="bg-card rounded-xl border overflow-hidden" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky-header">
              <TableRow className="bg-muted/30">
                <TableHead className="table-header cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('name')}>Name<SortIcon k="name" /></TableHead>
                <TableHead className="table-header cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('sku')}>SKU<SortIcon k="sku" /></TableHead>
                <TableHead className="table-header cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('category')}>Category<SortIcon k="category" /></TableHead>
                <TableHead className="table-header cursor-pointer select-none hover:text-foreground transition-colors text-right" onClick={() => toggleSort('price')}>Price<SortIcon k="price" /></TableHead>
                <TableHead className="table-header text-right">Margin</TableHead>
                <TableHead className="table-header text-center">GST</TableHead>
                <TableHead className="table-header cursor-pointer select-none hover:text-foreground transition-colors text-right" onClick={() => toggleSort('quantity')}>Stock<SortIcon k="quantity" /></TableHead>
                <TableHead className="table-header">Status</TableHead>
                <TableHead className="table-header text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {filtered.map((p, i) => (
                  <motion.tr key={p.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.03, duration: 0.3 }} className="border-b hover:bg-muted/30 transition-colors group">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-primary/8 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                          <Package className="h-3.5 w-3.5 text-primary/70" />
                        </div>
                        <div>
                          <div>{p.name}</div>
                          {p.hsnCode && <div className="text-[10px] text-muted-foreground">HSN: {p.hsnCode}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm font-mono text-[12px]">{p.sku}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[11px] font-medium">{p.category}</Badge></TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatINR(p.price)}</TableCell>
                    <TableCell className="text-right">
                      <span className={`text-xs font-semibold ${profitMargin(p) > 40 ? 'text-success' : profitMargin(p) > 20 ? 'text-warning' : 'text-destructive'}`}>
                        {profitMargin(p).toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center"><Badge variant="outline" className="text-[10px]">{p.gstRate}%</Badge></TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{p.quantity}</TableCell>
                    <TableCell>{stockBadge(p)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => deleteProduct(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center py-16 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/20" />
                  <p className="font-medium mb-1">No products found</p>
                  <p className="text-sm">Try adjusting your search or add a new product</p>
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg">{editId ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="text-xs font-medium">Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Product name" /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">SKU</Label><Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="e.g. WM-001" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="text-xs font-medium">Category</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Electronics" /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">Supplier</Label><Input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} placeholder="Supplier name" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="text-xs font-medium">Price (₹)</Label><Input type="number" value={form.price} onChange={e => setForm({ ...form, price: +e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">Cost Price (₹)</Label><Input type="number" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: +e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5"><Label className="text-xs font-medium">Quantity</Label><Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: +e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">Reorder Level</Label><Input type="number" value={form.reorderLevel} onChange={e => setForm({ ...form, reorderLevel: +e.target.value })} /></div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">GST Rate</Label>
                <Select value={String(form.gstRate)} onValueChange={v => setForm({ ...form, gstRate: +v })}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GST_RATES.map(r => <SelectItem key={r} value={String(r)}>{r}%</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">HSN/SAC Code</Label><Input value={form.hsnCode} onChange={e => setForm({ ...form, hsnCode: e.target.value })} placeholder="e.g. 8471" /></div>
            <Button onClick={handleSave} className="w-full mt-2 h-10 shadow-sm">{editId ? 'Update Product' : 'Add Product'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={scanDialogOpen} onOpenChange={setScanDialogOpen}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-none bg-transparent shadow-none">
          <BarcodeScanner onScan={handleScan} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
