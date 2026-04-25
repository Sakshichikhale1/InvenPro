import { LayoutDashboard, Package, ShoppingCart, History, BarChart3, Bell, Clock, Sparkles, Truck, Users } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useInventory } from '@/context/InventoryContext';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from '@/components/ui/sidebar';

const mainNav = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Products', url: '/products', icon: Package },
  { title: 'Orders', url: '/orders', icon: ShoppingCart },
  { title: 'Order History', url: '/history', icon: History },
];

const managementNav = [
  { title: 'Suppliers', url: '/suppliers', icon: Truck },
  { title: 'Customers', url: '/customers', icon: Users },
];

const insightsNav = [
  { title: 'Analytics', url: '/analytics', icon: BarChart3 },
  { title: 'Alerts', url: '/alerts', icon: Bell },
  { title: 'Activity Log', url: '/activity', icon: Clock },
  { title: 'AI Assistant', url: '/assistant', icon: Sparkles },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { alerts } = useInventory();
  const activeAlerts = alerts.filter(a => !a.dismissed).length;

  const renderNav = (items: typeof mainNav) => (
    <SidebarMenu>
      {items.map(item => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild>
            <NavLink to={item.url} end={item.url === '/'} className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 rounded-xl" activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold">
              <item.icon className="h-4 w-4 mr-2.5 shrink-0" />
              {!collapsed && <span className="text-[13px]">{item.title}</span>}
              {item.title === 'Alerts' && activeAlerts > 0 && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 h-5 min-w-[20px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold shadow-sm shadow-destructive/30">
                  {activeAlerts}
                </span>
              )}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="bg-sidebar pt-5">
        <div className="px-4 mb-7">
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-[hsl(250,75%,60%)] flex items-center justify-center shadow-lg shadow-primary/20">
                <Package className="h-4.5 w-4.5 text-primary-foreground" />
              </div>
              <div>
                <span className="text-base font-bold text-sidebar-accent-foreground tracking-tight">InvenPro</span>
                <span className="text-[9px] text-sidebar-foreground/40 block -mt-0.5 uppercase tracking-widest">Inventory</span>
              </div>
            </div>
          ) : (
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-[hsl(250,75%,60%)] flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
              <Package className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[9px] uppercase tracking-[0.15em] font-semibold">{!collapsed && 'Main'}</SidebarGroupLabel>
          <SidebarGroupContent>{renderNav(mainNav)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[9px] uppercase tracking-[0.15em] font-semibold">{!collapsed && 'Management'}</SidebarGroupLabel>
          <SidebarGroupContent>{renderNav(managementNav)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[9px] uppercase tracking-[0.15em] font-semibold">{!collapsed && 'Insights'}</SidebarGroupLabel>
          <SidebarGroupContent>{renderNav(insightsNav)}</SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
