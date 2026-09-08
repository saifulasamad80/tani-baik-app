import { CloudOff } from "lucide-react";

import { COPY } from "@/lib/ui-copy";
import { cn } from "@/lib/utils";

export function ConnectionStatus({ daring, antrean }: { daring: boolean; antrean: number }) {
  return (
    <div
      className={cn(
        "hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium sm:flex",
        daring ? "border-success/30 bg-success/10 text-success" : "border-warning/40 bg-warning/15 text-warning-foreground",
      )}
      title={daring ? COPY.terhubung : COPY.bannerLuring}
    >
      {daring ? (
        <span className="size-1.5 rounded-full bg-success" />
      ) : (
        <CloudOff className="size-3" />
      )}
      <span>{daring ? COPY.terhubung : COPY.luring}</span>
      {!daring && antrean > 0 ? <span className="tabular-nums">· {antrean}</span> : null}
    </div>
  );
}
