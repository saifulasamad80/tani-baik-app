import { Link, useNavigate } from "@tanstack/react-router";
import { LogIn, LogOut } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { inisialNama, LABEL_PERAN } from "@/lib/roles";
import { COPY } from "@/lib/ui-copy";

export function UserMenu() {
  const { siap, session, profil, keluar } = useAuth();
  const navigate = useNavigate();

  if (!siap) {
    return <div className="ml-1 hidden h-9 w-36 animate-pulse rounded-full border bg-muted sm:block" />;
  }

  if (!session) {
    return (
      <Button variant="outline" size="sm" className="ml-1 h-9" asChild>
        <Link to="/masuk">
          <LogIn className="size-3.5" />
          {COPY.masuk}
        </Link>
      </Button>
    );
  }

  const nama = profil?.nama_tampilan ?? session.user.email ?? "Pengguna";
  const peranLabel = profil ? LABEL_PERAN[profil.peran] : "…";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="ml-1 flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-left"
        >
          <span className="grid size-7 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {inisialNama(nama)}
          </span>
          <span className="hidden max-w-[9rem] truncate text-xs font-medium sm:inline">
            {nama} · {peranLabel}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium">{nama}</p>
          <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            void keluar().then(() => navigate({ to: "/masuk" }));
          }}
        >
          <LogOut className="size-4" />
          {COPY.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
