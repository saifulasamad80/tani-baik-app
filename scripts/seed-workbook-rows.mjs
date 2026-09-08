import fs from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

import * as XLSX from "xlsx";

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, ".env.local");
const WORKBOOK_PATH =
  process.argv[2] ??
  "/mnt/A212D4FE12D4D7FD/Documents/Tani/Workbook_Profesional_Benih_Tani_Baik R00.xlsx";

function loadEnv(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}

if (!fs.existsSync(ENV_PATH)) {
  throw new Error(".env.local tidak ditemukan");
}
loadEnv(ENV_PATH);

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error("Supabase URL tidak tersedia di .env.local");
}

if (!fs.existsSync(WORKBOOK_PATH)) {
  throw new Error(`Workbook tidak ditemukan: ${WORKBOOK_PATH}`);
}

const workbookBuffer = fs.readFileSync(WORKBOOK_PATH);
const workbook = XLSX.read(workbookBuffer, { type: "buffer", cellDates: false });
const sourceFile = path.basename(WORKBOOK_PATH);
const projectRef = new URL(supabaseUrl).hostname.split(".")[0];

const records = [];
for (const sheetName of workbook.SheetNames) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) continue;
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false });
  rows.forEach((row, index) => {
    records.push({
      sheet_name: sheetName,
      row_index: index + 1,
      row_data: { values: row },
      source_file: sourceFile,
    });
  });
}

console.log(`Seeding ${records.length} workbook rows from ${workbook.SheetNames.length} sheets...`);

const sqlLines = [
  "BEGIN;",
  `DELETE FROM public.workbook_rows WHERE source_file = '${sourceFile.replaceAll("'", "''")}';`,
];

for (let i = 0; i < records.length; i += 100) {
  const chunk = records.slice(i, i + 100);
  const values = chunk
    .map((row) => {
      const json = JSON.stringify(row.row_data);
      return `('${row.sheet_name.replaceAll("'", "''")}', ${row.row_index}, $_json_$${json}$_json_$::jsonb, '${row.source_file.replaceAll("'", "''")}')`;
    })
    .join(",\n");
  sqlLines.push(
    `INSERT INTO public.workbook_rows (sheet_name, row_index, row_data, source_file)\nVALUES\n${values}\nON CONFLICT (sheet_name, row_index) DO UPDATE\nSET row_data = EXCLUDED.row_data,\n    source_file = EXCLUDED.source_file;`,
  );
}

sqlLines.push("COMMIT;");

const sqlPath = path.join("/tmp", `tani-baik-workbook-seed-${Date.now()}.sql`);
fs.writeFileSync(sqlPath, sqlLines.join("\n"), "utf8");

execFileSync(
  "npx",
  ["supabase@latest", "db", "query", "--linked", "--project-ref", projectRef, "--file", sqlPath],
  {
    stdio: "inherit",
    env: process.env,
  },
);

console.log("Workbook seed complete.");
