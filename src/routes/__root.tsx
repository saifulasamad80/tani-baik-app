import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  redirect,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Bell, CircleHelp, Search } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { BRAND_DESCRIPTION, BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider } from "@/components/auth-provider";
import { ConnectionStatus } from "@/components/connection-status";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { ModuleMenu } from "@/components/module-menu";
import { OfflineBanner } from "@/components/offline-banner";
import { QuickAdd } from "@/components/quick-add";
import { UserMenu } from "@/components/user-menu";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useKoneksi } from "@/hooks/use-koneksi";
import { ensureSessionSnapshot, getSessionSnapshot } from "@/lib/auth-session";
import { startSyncEngine } from "@/lib/sync-engine";
import { daftarServiceWorker } from "@/lib/pwa/register-sw";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Halaman tidak ditemukan</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Halaman yang Anda cari tidak tersedia atau sudah dipindahkan.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Halaman gagal dimuat
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Coba muat ulang halaman ini.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Coba lagi
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Ke Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: async ({ location }) => {
    const pathname = location.pathname;
    const publicRoutes = pathname === "/masuk";
    if (publicRoutes) return;

    const snapshot = getSessionSnapshot();
    if (snapshot === undefined) {
      const session = await ensureSessionSnapshot();
      if (session) return;
    } else if (snapshot) {
      return;
    }

    throw redirect({
      to: "/masuk",
      replace: true,
    });
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: `${BRAND_NAME} — ${BRAND_TAGLINE}` },
      { name: "description", content: BRAND_DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#2f9d7a" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
      },
      { rel: "icon", href: "/icons/icon-192.png", type: "image/png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icons/icon-192.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { daring, antrean } = useKoneksi();
  const halamanMasuk = pathname === "/masuk";

  useEffect(() => {
    daftarServiceWorker();
    startSyncEngine();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {halamanMasuk ? (
          <>
            <Outlet />
            <Toaster />
          </>
        ) : (
          <SidebarProvider>
            <div className="flex min-h-screen w-full bg-background">
              <AppSidebar />
              <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-20 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b bg-card/80 px-3 py-2.5 backdrop-blur sm:px-5">
                  <SidebarTrigger />
                  <div className="relative min-w-0 max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Cari menu, produk, blok..." className="h-9 pl-9" />
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <ModuleMenu />
                    <QuickAdd daring={daring} />
                    <ConnectionStatus daring={daring} antrean={antrean} />
                    <Button variant="ghost" size="icon" aria-label="Notifikasi">
                      <Bell className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Bantuan">
                      <CircleHelp className="size-4" />
                    </Button>
                    <UserMenu />
                  </div>
                </header>
                <OfflineBanner tampil={!daring} antrean={antrean} />
                <main className="min-w-0 flex-1 p-4 pb-20 sm:p-6 md:pb-6">
                  <Outlet />
                </main>
              </div>
            </div>
            <MobileTabBar />
            <Toaster />
          </SidebarProvider>
        )}
      </AuthProvider>
    </QueryClientProvider>
  );
}
