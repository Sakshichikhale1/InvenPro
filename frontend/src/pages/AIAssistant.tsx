import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, User, Sparkles } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { formatINR } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const quickActions = [
  '📦 Which products need restocking?',
  '🚨 What\'s out of stock?',
  '📊 Show top selling products',
  '💰 Total inventory value',
  '📋 Inventory summary',
  '💹 Profit analysis',
  '🐌 Show dead stock',
];

export default function AIAssistant() {
  const { products, orders, alerts, suppliers, customers } = useInventory();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "👋 Hi! I'm your AI inventory assistant. I can help you with stock levels, reorder suggestions, **profit analysis**, **GST queries**, supplier insights, and more.\n\nTry asking me a question or use the quick actions below!" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const getResponse = (q: string): string => {
    const ql = q.toLowerCase();

    if (ql.includes('low stock') || ql.includes('restock') || ql.includes('reorder')) {
      const low = products.filter(p => p.quantity <= p.reorderLevel);
      if (low.length === 0) return "✅ All products are above their reorder levels!";
      return `⚠️ **${low.length} products need restocking:**\n\n${low.map(p => `- **${p.name}** (${p.sku}): ${p.quantity} units left (reorder at ${p.reorderLevel}). Suggest ordering **${Math.max(p.reorderLevel * 2 - p.quantity, 10)} units** from ${p.supplier}.`).join('\n')}`;
    }

    if (ql.includes('out of stock') || ql.includes('no stock')) {
      const oos = products.filter(p => p.quantity === 0);
      if (oos.length === 0) return "✅ No products are out of stock!";
      return `🚨 **${oos.length} products are out of stock:**\n\n${oos.map(p => `- **${p.name}** (${p.sku}) — Supplier: ${p.supplier}`).join('\n')}\n\nI recommend creating purchase orders for these immediately.`;
    }

    if (ql.includes('profit') || ql.includes('margin')) {
      const salesOrders = orders.filter(o => o.type === 'sales');
      const totalRevenue = salesOrders.reduce((s, o) => s + o.gstBreakdown.taxableAmount, 0);
      const totalCost = salesOrders.flatMap(o => o.items).reduce((s, i) => s + i.costPrice * i.quantity, 0);
      const profit = totalRevenue - totalCost;
      const margin = totalRevenue > 0 ? (profit / totalRevenue * 100) : 0;
      
      const perOrder = salesOrders.map(o => {
        const rev = o.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
        const cost = o.items.reduce((s, i) => s + i.costPrice * i.quantity, 0);
        return `- **${o.id}**: Revenue ${formatINR(rev)} | Cost ${formatINR(cost)} | Profit **${formatINR(rev - cost)}** (${((rev - cost) / rev * 100).toFixed(1)}%)`;
      });

      return `💹 **Profit Analysis:**\n\n- Total Revenue: **${formatINR(totalRevenue)}**\n- Total Cost: **${formatINR(totalCost)}**\n- Gross Profit: **${formatINR(profit)}**\n- Overall Margin: **${margin.toFixed(1)}%**\n\n**Per Order Breakdown:**\n${perOrder.join('\n')}`;
    }

    if (ql.includes('gst') || ql.includes('tax')) {
      const totalGST = orders.reduce((s, o) => s + o.gstBreakdown.totalTax, 0);
      const totalCGST = orders.reduce((s, o) => s + o.gstBreakdown.cgst, 0);
      const totalSGST = orders.reduce((s, o) => s + o.gstBreakdown.sgst, 0);
      const totalIGST = orders.reduce((s, o) => s + o.gstBreakdown.igst, 0);
      return `🧾 **GST Summary:**\n\n- Total GST: **${formatINR(totalGST)}**\n- CGST: ${formatINR(totalCGST)}\n- SGST: ${formatINR(totalSGST)}\n- IGST: ${formatINR(totalIGST)}\n\n**GST by Rate:**\n${[5, 12, 18, 28].map(r => {
        const prods = products.filter(p => p.gstRate === r);
        return prods.length > 0 ? `- ${r}%: ${prods.length} products` : null;
      }).filter(Boolean).join('\n')}`;
    }

    if (ql.includes('top') || ql.includes('best') || ql.includes('selling')) {
      const salesItems = orders.filter(o => o.type === 'sales').flatMap(o => o.items);
      const agg = salesItems.reduce((acc, i) => { acc[i.productName] = (acc[i.productName] || 0) + i.quantity; return acc; }, {} as Record<string, number>);
      const sorted = Object.entries(agg).sort(([, a], [, b]) => b - a).slice(0, 5);
      if (sorted.length === 0) return "No sales data available yet.";
      return `📊 **Top selling products:**\n\n${sorted.map(([name, qty], i) => `${i + 1}. **${name}** — ${qty} units sold`).join('\n')}`;
    }

    if (ql.includes('value') || ql.includes('worth') || ql.includes('total')) {
      const total = products.reduce((s, p) => s + p.price * p.quantity, 0);
      const byCategory = products.reduce((acc, p) => { acc[p.category] = (acc[p.category] || 0) + p.price * p.quantity; return acc; }, {} as Record<string, number>);
      return `💰 **Total inventory value: ${formatINR(total)}**\n\n${Object.entries(byCategory).map(([cat, val]) => `- ${cat}: ${formatINR(val)}`).join('\n')}`;
    }

    if (ql.includes('slow') || ql.includes('dead stock') || ql.includes('not selling')) {
      const salesIds = new Set(orders.filter(o => o.type === 'sales').flatMap(o => o.items.map(i => i.productId)));
      const slow = products.filter(p => !salesIds.has(p.id) && p.quantity > 0);
      if (slow.length === 0) return "All stocked products have sales activity!";
      return `🐌 **Slow-moving products (no sales recorded):**\n\n${slow.map(p => `- **${p.name}**: ${p.quantity} units (value: ${formatINR(p.price * p.quantity)})`).join('\n')}\n\nConsider running promotions or reducing stock for these items.`;
    }

    if (ql.includes('supplier')) {
      return `🏭 **Supplier Overview (${suppliers.length} suppliers):**\n\n${suppliers.map(s => {
        const supplierOrders = orders.filter(o => o.type === 'purchase' && o.supplierName === s.name);
        return `- **${s.name}** (${s.city}, ${s.state}) — ${supplierOrders.length} purchase orders`;
      }).join('\n')}`;
    }

    if (ql.includes('customer')) {
      return `👥 **Customer Overview (${customers.length} customers):**\n\n${customers.map(c => {
        const customerOrders = orders.filter(o => o.type === 'sales' && o.customerName === c.name);
        const spent = customerOrders.reduce((s, o) => s + o.totalAmount, 0);
        return `- **${c.name}** (${c.city}) — ${customerOrders.length} orders, spent ${formatINR(spent)}`;
      }).join('\n')}`;
    }

    if (ql.includes('summary') || ql.includes('overview') || ql.includes('status')) {
      const activeAlerts = alerts.filter(a => !a.dismissed).length;
      const pending = orders.filter(o => o.status === 'pending').length;
      const totalGST = orders.reduce((s, o) => s + o.gstBreakdown.totalTax, 0);
      return `📋 **Inventory Summary:**\n\n- **${products.length}** products · **${suppliers.length}** suppliers · **${customers.length}** customers\n- **${products.reduce((s, p) => s + p.quantity, 0).toLocaleString('en-IN')}** total units\n- **${pending}** pending orders · **${activeAlerts}** active alerts\n- Inventory value: **${formatINR(products.reduce((s, p) => s + p.price * p.quantity, 0))}**\n- Total GST collected: **${formatINR(totalGST)}**`;
    }

    return `I can help with:\n\n- 📦 **"Which products need restocking?"**\n- 🚨 **"What's out of stock?"**\n- 💹 **"Show profit analysis"**\n- 🧾 **"GST summary"**\n- 📊 **"Show top selling products"**\n- 💰 **"Total inventory value"**\n- 🐌 **"Show dead stock"**\n- 🏭 **"Supplier overview"**\n- 👥 **"Customer overview"**\n- 📋 **"Inventory summary"**`;
  };

  const send = (text?: string) => {
    const msg = text || input;
    if (!msg.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setInput('');
    setLoading(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: getResponse(msg) }]);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        <div className="flex items-center gap-2.5">
          <div className="icon-box bg-primary/10">
            <Sparkles className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h1 className="page-title">AI Assistant</h1>
            <p className="page-subtitle">Ask about inventory, profits, GST, suppliers & customers</p>
          </div>
        </div>
      </motion.div>

      <motion.div className="flex-1 overflow-y-auto bg-card rounded-xl border p-5 space-y-4 mb-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ boxShadow: 'var(--shadow-card)' }}>
        <AnimatePresence>
          {messages.map((m, i) => (
            <motion.div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`} initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}>
              {m.role === 'assistant' && (
                <motion.div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5" whileHover={{ scale: 1.1, rotate: 10 }}>
                  <Bot className="h-4 w-4 text-primary" />
                </motion.div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted/70 rounded-bl-md'}`}>
                {m.content}
              </div>
              {m.role === 'user' && (
                <div className="h-8 w-8 rounded-xl bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-4 w-4 text-secondary-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <motion.div className="flex gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary animate-pulse" />
            </div>
            <div className="bg-muted/70 rounded-2xl rounded-bl-md px-4 py-3 text-sm text-muted-foreground flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />

        {messages.length <= 1 && (
          <motion.div className="flex flex-wrap gap-2 pt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            {quickActions.map((action, i) => (
              <motion.button key={action} onClick={() => send(action)}
                className="text-xs px-3.5 py-2 rounded-xl border bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all duration-200 hover:shadow-sm"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.06 }}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                {action}
              </motion.button>
            ))}
          </motion.div>
        )}
      </motion.div>

      <motion.div className="flex gap-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Input placeholder="Ask about inventory, profits, GST..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} className="flex-1 h-11 bg-card rounded-xl" />
        <Button onClick={() => send()} disabled={loading || !input.trim()} size="icon" className="h-11 w-11 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <Send className="h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
}
