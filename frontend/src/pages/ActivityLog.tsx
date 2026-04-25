import { motion } from 'framer-motion';
import { Package, ShoppingCart, BarChart3, AlertTriangle } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';

const iconMap = { product: Package, order: ShoppingCart, stock: BarChart3, alert: AlertTriangle };
const colorMap = { 
  product: 'bg-primary/10 text-primary', 
  order: 'bg-accent/10 text-accent', 
  stock: 'bg-success/10 text-success', 
  alert: 'bg-warning/10 text-warning' 
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 250, damping: 22 } } };

export default function ActivityLogPage() {
  const { activityLogs } = useInventory();

  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="page-title">Activity Log</h1>
        <p className="page-subtitle">Real-time system activity timeline</p>
      </motion.div>

      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-primary/30 via-border to-transparent" />
        <motion.div className="space-y-4" variants={container} initial="hidden" animate="show">
          {activityLogs.map((log) => {
            const Icon = iconMap[log.type];
            const color = colorMap[log.type];
            return (
              <motion.div key={log.id} className="relative flex items-start gap-4 pl-12" variants={item}>
                <motion.div className={`absolute left-1 top-1 icon-box rounded-full ${color}`} whileHover={{ scale: 1.15 }}>
                  <Icon className="h-3.5 w-3.5" />
                </motion.div>
                <div className="stat-card flex-1 py-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold">{log.action}</span>
                    <span className="text-[11px] text-muted-foreground tabular-nums">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{log.details}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
