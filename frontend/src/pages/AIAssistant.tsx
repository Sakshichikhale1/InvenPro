import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, User, Sparkles } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { formatINR } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';

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

  const send = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setInput('');
    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const inventoryContext = {
        products: products.map(p => ({ name: p.name, sku: p.sku, quantity: p.quantity, reorderLevel: p.reorderLevel, price: p.price, category: p.category, supplier: p.supplier })),
        ordersCount: orders.length,
        alertsCount: alerts.length,
      };

      const res = await fetch(`${apiUrl}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          inventory_context: inventoryContext
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || 'Failed to get response');
      }

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${error.message || 'Could not connect to the AI service.'}` }]);
    } finally {
      setLoading(false);
    }
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
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md whitespace-pre-wrap' : 'bg-muted/70 rounded-bl-md'}`}>
                {m.role === 'user' ? (
                  m.content
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none space-y-2 [&>p]:m-0 [&>ul]:m-0 [&>ul]:pl-4 [&>ol]:m-0 [&>ol]:pl-4 [&>h1]:m-0 [&>h2]:m-0 [&>h3]:m-0 [&>h4]:m-0 [&>pre]:m-0 [&>blockquote]:m-0">
                    <ReactMarkdown>
                      {m.content}
                    </ReactMarkdown>
                  </div>
                )}
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
