import { motion } from 'framer-motion';
import { Package, ShoppingCart, AlertTriangle, TrendingDown, IndianRupee, Boxes, TrendingUp, Receipt, History, ArrowRight, PlusCircle } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { formatINR } from '@/lib/currency';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20, scale: 0.95 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } } };

export default function Dashboard() {
  const { products, orders, activityLogs, alerts } = useInventory();

  const totalValue = products.reduce((s, p) => s + p.price * p.quantity, 0);
  const activeAlerts = alerts.filter(a => !a.dismissed).length;
  const recentOrders = orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  
  const salesOrders = orders.filter(o => o.type === 'sales');
  const totalRevenue = salesOrders.reduce((s, o) => s + o.gstBreakdown.taxableAmount, 0);
  const totalCost = salesOrders.flatMap(o => o.items).reduce((s, i) => s + i.costPrice * i.quantity, 0);
  const totalProfit = totalRevenue - totalCost;

  const topProducts = [...products].sort((a, b) => b.quantity * b.price - a.quantity * a.price).slice(0, 5).map(p => ({
    name: p.name.length > 12 ? p.name.slice(0, 12) + '…' : p.name,
    value: Math.round(p.quantity * p.price),
  }));

  const stats = [
    { label: 'Inventory Value', value: formatINR(totalValue), icon: IndianRupee, gradient: 'from-primary to-primary/80', bg: 'bg-primary/10' },
    { label: 'Total Revenue', value: formatINR(totalRevenue), icon: TrendingUp, gradient: 'from-success to-success/80', bg: 'bg-success/10' },
    { label: 'Estimated Profit', value: formatINR(totalProfit), icon: Receipt, gradient: 'from-accent to-accent/80', bg: 'bg-accent/10' },
    { label: 'Active Alerts', value: String(activeAlerts), icon: AlertTriangle, gradient: 'from-destructive to-destructive/80', bg: 'bg-destructive/10' },
  ];

  const lowStockProducts = products.filter(p => p.quantity <= p.reorderLevel).slice(0, 5);
  const tooltipStyle = { borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', backgroundColor: 'hsl(var(--card))' };

  return (
    <div className="space-y-8 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="page-title">Operational Hub</h1>
          <p className="page-subtitle">Real-time status of your inventory and sales</p>
        </motion.div>
        <div className="flex gap-2">
          <Link to="/products">
            <Button variant="outline" size="sm" className="gap-2 bg-card">
              <PlusCircle className="h-4 w-4" /> Add Stock
            </Button>
          </Link>
          <Link to="/orders">
            <Button size="sm" className="gap-2 shadow-sm">
              <ShoppingCart className="h-4 w-4" /> Create Sale
            </Button>
          </Link>
        </div>
      </div>

      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" variants={container} initial="hidden" animate="show">
        {stats.map((s) => (
          <motion.div key={s.label} className="stat-card group relative overflow-hidden" variants={item}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${s.bg} text-foreground/80 transition-transform group-hover:scale-110 duration-300`}>
                <s.icon className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{s.label}</span>
                <div className="text-2xl font-bold tracking-tight">{s.value}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div className="stat-card lg:col-span-2" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Boxes className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Inventory Distribution (Top Items)</h3>
            </div>
            <Link to="/analytics" className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1">
              View Analytics <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topProducts} layout="vertical" margin={{ left: 10, right: 30 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={80} />
              <Tooltip formatter={(v: number) => [formatINR(v), 'Value']} contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted)/0.3)' }} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} animationDuration={1500} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div className="stat-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-semibold">Stock Alerts</h3>
          </div>
          <div className="space-y-3">
            {lowStockProducts.length > 0 ? lowStockProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex flex-col">
                  <span className="text-xs font-bold truncate max-w-[120px]">{p.name}</span>
                  <span className="text-[10px] text-muted-foreground">{p.sku}</span>
                </div>
                <Badge variant={p.quantity === 0 ? "destructive" : "outline"} className="text-[10px] px-1.5 h-5">
                  {p.quantity} left
                </Badge>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground text-xs italic">All stock levels healthy</div>
            )}
          </div>
          {lowStockProducts.length > 0 && (
            <Link to="/alerts">
              <Button variant="ghost" className="w-full mt-4 text-[11px] h-8 text-muted-foreground hover:text-primary">
                View all alerts
              </Button>
            </Link>
          )}
        </motion.div>

        <motion.div className="stat-card lg:col-span-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Recent Transactions</h3>
            </div>
          </div>
          <div className="space-y-1">
            {recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-muted/40 transition-colors border-b last:border-0 border-border/40">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${o.type === 'sales' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
                    <ShoppingCart className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase">{o.id}</p>
                    <p className="text-[10px] text-muted-foreground">{o.customerName || o.supplierName || 'System'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-bold ${o.type === 'sales' ? 'text-success' : 'text-primary'}`}>
                    {o.type === 'sales' ? '+' : '-'}{formatINR(o.totalAmount)}
                  </p>
                  <Badge variant="outline" className="text-[9px] font-medium opacity-70 h-4 px-1">{o.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h3 className="text-sm font-semibold mb-4">Inventory Logs</h3>
          <div className="space-y-4">
            {activityLogs.slice(0, 4).map((log) => (
              <div key={log.id} className="flex gap-3 relative pb-4 last:pb-0">
                <div className="absolute left-[7px] top-4 bottom-0 w-[1px] bg-border last:hidden" />
                <div className="h-3.5 w-3.5 rounded-full bg-primary/20 border-2 border-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-bold leading-none">{log.action}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{log.details}</p>
                  <p className="text-[9px] text-muted-foreground/60 mt-1">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
