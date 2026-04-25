import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { InventoryProvider } from "@/context/InventoryContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import OrderHistory from "./pages/OrderHistory";
import Analytics from "./pages/Analytics";
import Alerts from "./pages/Alerts";
import ActivityLog from "./pages/ActivityLog";
import AIAssistant from "./pages/AIAssistant";
import Suppliers from "./pages/Suppliers";
import Customers from "./pages/Customers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <InventoryProvider>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/history" element={<OrderHistory />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/activity" element={<ActivityLog />} />
                <Route path="/assistant" element={<AIAssistant />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          </InventoryProvider>
        </BrowserRouter>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
