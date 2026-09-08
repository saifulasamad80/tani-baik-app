#!/bin/bash
# SOP Zero Defect: Backup Harian Supabase ke Lokal (Linux Mint)
# Revisi: Menggunakan PGPASSWORD untuk menghindari URL Parsing Error pada karakter spesial

BACKUP_DIR="/home/saifulsamad/tani-baik-backups"
DATE=$(date +"%Y%m%d_%H%M%S")
FILE_NAME="tani_baik_backup_$DATE.sql"

mkdir -p "$BACKUP_DIR"

# INJEKSI PASSWORD AMAN (Tanpa kurung siku)
export PGPASSWORD="a/uFzhxNhwupCKDDEbpaNN79kBtYr+Zcm4tIRif6g0Y="

# EKSEKUSI PG_DUMP MENGGUNAKAN PARAMETER TRADISIONAL
pg_dump -h aws-0-ap-southeast-1.pooler.supabase.com -p 6543 -U postgres.npqluyzxkvibfsenehnk -d postgres -F c > "$BACKUP_DIR/$FILE_NAME"

# BERSIHKAN VARIABEL LINGKUNGAN SETELAH SELESAI
unset PGPASSWORD

find "$BACKUP_DIR" -type f -name "*.sql" -mtime +7 -exec rm {} \;

echo "Backup sukses: $FILE_NAME"