import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Trees, Beef, ShoppingCart, Wallet, Sprout } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard Utama", url: "/", icon: LayoutDashboard },
  { title: "Manajemen Kebun", url: "/kebun", icon: Trees },
  { title: "Manajemen Peternakan", url: "/peternakan", icon: Beef },
  { title: "POS / Kasir UMKM", url: "/pos", icon: ShoppingCart },
  { title: "Laporan Keuangan", url: "/laporan", icon: Wallet },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-1 py-2">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Sprout className="size-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-sidebar-foreground">Tani Baik</p>
              <p className="truncate text-[11px] text-sidebar-foreground/60">
                Integrated Farming &amp; POS
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Modul Operasional</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="size-4 shrink-0" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed && (
          <p className="px-2 py-1 text-[11px] leading-relaxed text-sidebar-foreground/55">
            UMKM Benih Tani Baik · Mode Prototipe (data dummy)
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
