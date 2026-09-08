import { useQuery } from "@tanstack/react-query";

import { muatWorkbookRows, parseKasHarian } from "@/lib/workbook-rows";

export function useWorkbookRows(sheetName?: string) {
  return useQuery({
    queryKey: ["workbook_rows", sheetName ?? "all"],
    queryFn: () => muatWorkbookRows(sheetName),
    staleTime: 60_000,
  });
}

export function useKasHarianRows() {
  return useQuery({
    queryKey: ["workbook_rows", "Kas_Harian"],
    queryFn: async () => {
      const rows = await muatWorkbookRows("Kas_Harian");
      return parseKasHarian(rows);
    },
    staleTime: 60_000,
  });
}
