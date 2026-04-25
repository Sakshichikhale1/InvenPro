import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, XCircle, ShieldCheck, Zap, ShoppingCart } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Product } from '@/types/inventory';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, x: -16, scale: 0.98 }, show: { opacity: 1, x: 0, scale: 1, transition: { type: "spring" as const, stiffness: 250, damping: 22 } } };

export default function Alerts() {
  const { alerts, dismissAlert, products, createOrder } = useInventory();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [reorderQty, setReorderQty] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const active = alerts.filter(a => !a.dismissed);
  const dismissed = alerts.filter(a => a.dismissed);

  const openReorderDialog = (productId: string) => {
    const p = products.find(x => x.id === productId);
    if (!p) return;
    setSelectedProduct(p);
    // Suggest a default quantity: enough to reach 2x reorder level, minimum 10
    const suggested = Math.max(p.reorderLevel * 2 - p.quantity, 10);
    setReorderQty(suggested);
    setIsDialogOpen(true);
  };

  const handleConfirmReorder = () => {
    if (!selectedProduct || reorderQty <= 0) return;
    
    const p = selectedProduct;
    createOrder({
      type: 'purchase', status: 'pending', isInterState: false,
      gstBreakdown: { 
        taxableAmount: reorderQty * p.costPrice, 
        cgst: reorderQty * p.costPrice * p.gstRate / 200, 
        sgst: reorderQty * p.costPrice * p.gstRate / 200, 
        igst: 0, 
        totalTax: reorderQty * p.costPrice * p.gstRate / 100, 
        totalWithTax: reorderQty * p.costPrice * (1 + p.gstRate / 100), 
        isInterState: false 
      },
      items: [{ 
        productId: p.id, 
        productName: p.name, 
        quantity: reorderQty, 
        unitPrice: p.costPrice, 
        costPrice: p.costPrice, 
        gstRate: p.gstRate, 
        hsnCode: p.hsnCode 
      }],
      notes: `Manual reorder for ${p.name} from alert`,
    });
    
    setIsDialogOpen(false);
    toast.success(`Purchase order created for ${reorderQty} units of ${p.name}! 📦`);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="page-title">Smart Alerts</h1>
        <p className="page-subtitle">Proactive stock alerts and auto-reorder suggestions</p>
      </motion.div>

      {active.length === 0 && (
        <motion.div className="stat-card text-center py-16" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring" }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}>
            <ShieldCheck className="h-14 w-14 mx-auto text-success/40 mb-4" />
          </motion.div>
          <p className="text-foreground font-medium mb-1">All stock levels are healthy!</p>
          <p className="text-sm text-muted-foreground">No alerts to show at the moment.</p>
        </motion.div>
      )}

      <motion.div className="space-y-3" variants={container} initial="hidden" animate="show">
        <AnimatePresence>
          {active.map((a) => (
            <motion.div key={a.id} className="stat-card flex items-start gap-4 group" variants={item} exit={{ opacity: 0, x: -20, scale: 0.95 }}>
              <motion.div className={`icon-box shrink-0 ${a.type === 'out-of-stock' ? 'bg-destructive/10' : 'bg-warning/10'}`} whileHover={{ scale: 1.1, rotate: 5 }}>
                {a.type === 'out-of-stock' ? <XCircle className="h-5 w-5 text-destructive" /> : <AlertTriangle className="h-5 w-5 text-warning" />}
              </motion.div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-semibold text-sm">{a.productName}</span>
                  <Badge className={`text-[10px] ${a.type === 'out-of-stock' ? 'bg-destructive/15 text-destructive border-destructive/20' : 'bg-warning/15 text-warning border-warning/20'}`}>
                    {a.type === 'out-of-stock' ? 'Out of Stock' : 'Low Stock'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{a.message}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-muted-foreground">Current: <span className="font-semibold text-foreground">{a.currentStock}</span></span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">Reorder at: <span className="font-semibold text-foreground">{a.reorderLevel}</span></span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="default" className="h-8 text-xs gap-1.5 shadow-sm hover:shadow-md transition-shadow" onClick={() => openReorderDialog(a.productId)}>
                  <Zap className="h-3 w-3" /> Auto Reorder
                </Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => dismissAlert(a.id)}>Dismiss</Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {dismissed.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Dismissed ({dismissed.length})</h3>
          <div className="space-y-2">
            {dismissed.map(a => (
              <div key={a.id} className="stat-card opacity-40 flex items-center gap-3 py-3">
                <span className="text-sm">{a.productName}</span>
                <span className="text-xs text-muted-foreground">{a.message}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
      {/* Reorder Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Reorder {selectedProduct?.name}
            </DialogTitle>
            <DialogDescription>
              Specify the quantity you want to order from your supplier.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sm font-medium">Quantity to Order</Label>
              <Input
                id="quantity"
                type="number"
                value={reorderQty}
                onChange={(e) => setReorderQty(parseInt(e.target.value) || 0)}
                className="col-span-3"
                autoFocus
              />
              <p className="text-[10px] text-muted-foreground italic">
                Current Stock: {selectedProduct?.quantity} | Reorder Level: {selectedProduct?.reorderLevel}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmReorder}>Create Purchase Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
