#!/usr/bin/env bash
# ==============================================================================
# Script Pencadangan Basis Data PostgreSQL ToDjuanda (Disaster Recovery Plan)
# Mendukung format Plain-Text (.sql) dan Custom Archive (.dump)
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
FORMAT="${1:-sql}" # default: sql, opsi: dump

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo -e "\033[0;31m[ERROR] DATABASE_URL tidak ditemukan pada environment variables.\033[0m"
  echo "Contoh: export DATABASE_URL='postgresql://user:pass@localhost:5432/todjuanda?sslmode=require'"
  exit 1
fi

mkdir -p "${BACKUP_DIR}"

if [[ "${FORMAT}" == "dump" ]]; then
  OUTPUT_FILE="${BACKUP_DIR}/todjuanda_backup_${TIMESTAMP}.dump"
  echo -e "\033[0;36m[INFO] Menjalankan pg_dump format Custom Archive terkompresi (-F c)...\033[0m"
  pg_dump "${DATABASE_URL}" -F c -b -v -f "${OUTPUT_FILE}"
else
  OUTPUT_FILE="${BACKUP_DIR}/todjuanda_backup_${TIMESTAMP}.sql"
  echo -e "\033[0;36m[INFO] Menjalankan pg_dump format Plain-Text SQL (--clean --if-exists)...\033[0m"
  pg_dump "${DATABASE_URL}" --format=plain --clean --if-exists --no-owner --no-acl --encoding=UTF8 --file="${OUTPUT_FILE}"
fi

if [[ -f "${OUTPUT_FILE}" ]]; then
  FILE_SIZE=$(du -h "${OUTPUT_FILE}" | cut -f1)
  CHECKSUM=$(sha256sum "${OUTPUT_FILE}" | cut -d' ' -f1)
  
  echo -e "\033[0;32m[SUCCESS] Pencadangan basis data berhasil diselesaikan!\033[0m"
  echo "  - Berkas Output : ${OUTPUT_FILE}"
  echo "  - Ukuran Berkas : ${FILE_SIZE}"
  echo "  - SHA-256 Hash  : ${CHECKSUM}"
  echo "  - Format        : ${FORMAT^^}"
  
  # Rotasi cadangan: Hapus berkas cadangan yang lebih lama dari 7 hari
  find "${BACKUP_DIR}" -type f \( -name "*.sql" -o -name "*.dump" \) -mtime +7 -exec rm -f {} \;
  echo -e "\033[0;34m[INFO] Rotasi otomatis berkas cadangan > 7 hari selesai.\033[0m"
else
  echo -e "\033[0;31m[ERROR] Berkas cadangan tidak terbentuk!\033[0m"
  exit 1
fi
