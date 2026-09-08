import { Link } from "@tanstack/react-router";
import { Grid3X3, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { modulFarm } from "@/lib/farm-data";

export function ModuleMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="hidden h-9 gap-2 lg:inline-flex">
          <Grid3X3 className="size-4" />
          Modul
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Search className="size-4 text-muted-foreground" />
          Navigasi Farm Management
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {modulFarm.map((modul) => (
          <DropdownMenuItem key={modul.href} asChild>
            <Link to={modul.href} className="flex cursor-pointer flex-col items-start gap-0.5 py-2">
              <span className="text-sm font-semibold">
                {modul.nama} · {modul.lokal}
              </span>
              <span className="text-xs text-muted-foreground">{modul.deskripsi}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
