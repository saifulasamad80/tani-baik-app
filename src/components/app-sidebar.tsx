import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Milk,
  Trees,
  Beef,
  Boxes,
  Database,
  ShoppingCart,
  Wallet,
  Sprout,
  Users,
  Settings,
  Store,
} from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";
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
import { bolehAkses, type Peran } from "@/lib/roles";

const items: {
  title: string;
  url:
    | "/"
    | "/livestock"
    | "/kebun"
    | "/peternakan"
    | "/resources"
    | "/market"
    | "/workbook"
    | "/pos"
    | "/laporan"
    | "/warga"
    | "/pengaturan";
  icon: typeof LayoutDashboard;
  peran?: readonly Peran[];
}[] = [
  { title: "Dashboard Utama", url: "/", icon: LayoutDashboard },
  { title: "Livestock", url: "/livestock", icon: Milk },
  { title: "Manajemen Kebun", url: "/kebun", icon: Trees },
  { title: "Manajemen Peternakan", url: "/peternakan", icon: Beef },
  { title: "Sumber Daya", url: "/resources", icon: Boxes },
  { title: "Market", url: "/market", icon: Store },
  { title: "Workbook", url: "/workbook", icon: Database },
  { title: "POS / Kasir UMKM", url: "/pos", icon: ShoppingCart },
  { title: "Laporan Keuangan", url: "/laporan", icon: Wallet },
  { title: "Warga & Investor", url: "/warga", icon: Users, peran: ["admin", "pengelola"] },
  { title: "Pengaturan", url: "/pengaturan", icon: Settings, peran: ["admin", "pengelola"] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { profil, session } = useAuth();
  const peran = profil?.peran ?? null;

  const visible = items.filter((item) => {
    if (!item.peran) return true;
    if (!session) return true;
    return bolehAkses(peran, item.peran);
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-1 py-2">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Sprout className="size-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-sidebar-foreground">{BRAND_NAME}</p>
              <p className="truncate text-[11px] text-sidebar-foreground/60">{BRAND_TAGLINE}</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Modul Operasional</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visible.map((item) => (
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
            {BRAND_NAME} · Sprint 0 (PWA + Auth)
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
