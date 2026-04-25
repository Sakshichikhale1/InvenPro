import { motion } from 'framer-motion';
import { useInventory } from '@/context/InventoryContext';
import { formatINR } from '@/lib/currency';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, AreaChart, Area } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { IndianRupee, TrendingUp, Percent, Target, Clock, ArrowUpDown, Receipt, Calendar } from 'lucide-react';

const COLORS = ['hsl(221,83%,53%)', 'hsl(162,63%,41%)', 'hsl(38,92%,50%)', 'hsl(0,72%,51%)', 'hsl(250,75%,60%)', 'hsl(190,80%,42%)'];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 250, damping: 22 } } };

export default function Analytics() {
  const { products, orders } = useInventory();

  const salesOrders = orders.filter(o => o.type === 'sales');
  
  const totalRevenue = salesOrders.reduce((s, o) => s + o.gstBreakdown.taxableAmount, 0);
  const totalCost = salesOrders.flatMap(o => o.items).reduce((s, i) => s + i.costPrice * i.quantity, 0);
  const totalProfit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? (totalProfit / totalRevenue * 100) : 0;

  // Profit per order
  const orderProfits = salesOrders.map(o => {
    const revenue = o.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const cost = o.items.reduce((s, i) => s + i.costPrice * i.quantity, 0);
    return { id: o.id, revenue, profit: revenue - cost, margin: revenue > 0 ? ((revenue - cost) / revenue * 100) : 0 };
  });

  // Pareto analysis - top 20% products
  const productRevenue = salesOrders.flatMap(o => o.items).reduce((acc, i) => {
    acc[i.productName] = (acc[i.productName] || 0) + i.unitPrice * i.quantity;
    return acc;
  }, {} as Record<string, number>);
  const sortedProducts = Object.entries(productRevenue).sort(([, a], [, b]) => b - a);
  const totalProductRevenue = sortedProducts.reduce((s, [, v]) => s + v, 0);
  let cumulative = 0;
  const paretoData = sortedProducts.map(([name, revenue]) => {
    cumulative += revenue;
    return { name: name.length > 10 ? name.slice(0, 10) + '…' : name, revenue, cumPct: Math.round(cumulative / totalProductRevenue * 100) };
  });

  // Aging inventory
  const today = new Date();
  const agingData = products.map(p => {
    const daysSinceUpdate = Math.floor((today.getTime() - new Date(p.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
    return { ...p, daysSinceUpdate };
  }).sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate).slice(0, 8);

  // Revenue by product for bar chart
  const salesByProduct = salesOrders.flatMap(o => o.items).reduce((acc, i) => {
    const ex = acc.find(x => x.name === i.productName);
    if (ex) ex.revenue += i.quantity * i.unitPrice; else acc.push({ name: i.productName.length > 12 ? i.productName.slice(0, 12) + '…' : i.productName, revenue: i.quantity * i.unitPrice });
    return acc;
  }, [] as { name: string; revenue: number }[]).sort((a, b) => b.revenue - a.revenue).slice(0, 6);

  // Inventory value by category
  const inventoryByCategory = products.reduce((acc, p) => {
    const ex = acc.find(x => x.name === p.category);
    const val = p.price * p.quantity;
    if (ex) ex.value += val; else acc.push({ name: p.category, value: val });
    return acc;
  }, [] as { name: string; value: number }[]);

  const stats = [
    { label: 'Total Revenue', value: formatINR(totalRevenue), icon: TrendingUp, gradient: 'from-success/20 to-success/5', text: 'text-success' },
    { label: 'Gross Profit', value: formatINR(totalProfit), icon: IndianRupee, gradient: 'from-primary/20 to-primary/5', text: 'text-primary' },
    { label: 'Avg Margin', value: `${margin.toFixed(1)}%`, icon: Percent, gradient: 'from-accent/20 to-accent/5', text: 'text-accent' },
    { label: 'Turnover Rate', value: '4.2x', icon: ArrowUpDown, gradient: 'from-warning/20 to-warning/5', text: 'text-warning' },
  ];

  const tooltipStyle = { borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: '11px', backgroundColor: 'hsl(var(--card))' };

  return (
    <div className="space-y-8 max-w-7xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="page-title">Intelligence & Analytics</h1>
        <p className="page-subtitle">Deep insights into your business performance and profit margins</p>
      </motion.div>

      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" variants={container} initial="hidden" animate="show">
        {stats.map((s) => (
          <motion.div key={s.label} className={`stat-card border-none bg-gradient-to-br ${s.gradient}`} variants={item}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-background/50 ${s.text}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="bg-background/30 border-none text-[10px] font-bold">ANNUAL</Badge>
            </div>
            <div className="text-2xl font-black tracking-tight mb-1">{s.value}</div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{s.label}</div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pareto Analysis */}
        <motion.div className="stat-card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-base font-bold">Pareto (80/20 Rule)</h3>
              <p className="text-xs text-muted-foreground">Revenue contribution by product</p>
            </div>
            <Target className="h-5 w-5 text-primary" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={paretoData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted)/0.3)" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="revenue" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="pct" orientation="right" domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar yAxisId="revenue" dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={24} />
              <Line yAxisId="pct" dataKey="cumPct" stroke="hsl(var(--destructive))" strokeWidth={3} dot={{ r: 4, fill: 'hsl(var(--destructive))' }} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Inventory Value */}
        <motion.div className="stat-card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-base font-bold">Asset Value by Category</h3>
              <p className="text-xs text-muted-foreground">Total monetary value of current stock</p>
            </div>
            <Calendar className="h-5 w-5 text-accent" />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={inventoryByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={8} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} stroke="none">
                {inventoryByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => formatINR(v)} contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-4 justify-center mt-4">
            {inventoryByCategory.map((c, i) => (
              <div key={c.name} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {c.name}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Aging Inventory */}
        <motion.div className="stat-card lg:col-span-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-xl bg-destructive/10 text-destructive">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Aging Stock Analysis</h3>
              <p className="text-xs text-muted-foreground">Products that haven't moved in significant time</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {agingData.map((p, i) => (
              <motion.div key={p.id} className="p-4 rounded-2xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.05 }}>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-bold truncate max-w-[100px]">{p.name}</span>
                  <Badge variant={p.daysSinceUpdate > 30 ? 'destructive' : 'secondary'} className="text-[9px] font-black h-5">
                    {p.daysSinceUpdate} DAYS
                  </Badge>
                </div>
                <div className="text-[10px] font-medium text-muted-foreground mb-1">SKU: {p.sku}</div>
                <div className="text-xs font-black text-primary">{formatINR(p.price * p.quantity)} <span className="text-muted-foreground font-normal">at stake</span></div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
