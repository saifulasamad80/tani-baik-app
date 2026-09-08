import { CloudOff } from "lucide-react";

import { COPY } from "@/lib/ui-copy";

export function OfflineBanner({ tampil, antrean }: { tampil: boolean; antrean: number }) {
  if (!tampil) return null;
  return (
    <div className="flex items-center justify-center gap-2 border-b border-warning/40 bg-warning/25 px-3 py-2 text-center text-xs font-medium text-warning-foreground">
      <CloudOff className="size-3.5 shrink-0" />
      <span>
        {COPY.bannerLuring}
        {antrean > 0 ? ` · ${antrean} ${COPY.antrean}` : ""}
      </span>
    </div>
  );
}
