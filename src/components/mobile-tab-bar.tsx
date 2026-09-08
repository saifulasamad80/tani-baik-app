import { Link, useRouterState } from "@tanstack/react-router";
import { Boxes, LayoutDashboard, Milk, Store, Trees } from "lucide-react";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const tabs = [
  { title: "Beranda", url: "/", icon: LayoutDashboard },
  { title: "Livestock", url: "/livestock", icon: Milk },
  { title: "Kebun", url: "/kebun", icon: Trees },
  { title: "Aset", url: "/resources", icon: Boxes },
  { title: "Pasar", url: "/market", icon: Store },
] as const;

export function MobileTabBar() {
  const mobile = useIsMobile();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  if (!mobile) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {tabs.map((tab) => {
          const aktif = pathname === tab.url;
          return (
            <li key={tab.url}>
              <Link
                to={tab.url}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium",
                  aktif ? "text-primary" : "text-muted-foreground",
                )}
              >
                <tab.icon className="size-4" />
                {tab.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
