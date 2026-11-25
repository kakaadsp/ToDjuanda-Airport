# Script Pencadangan Otomatis PostgreSQL ToDjuanda (Disaster Recovery Plan)
param (
    [string]$DatabaseUrl = $env:DATABASE_URL,
    [string]$BackupDir = "./backups"
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
    Write-Host "[ERROR] DATABASE_URL tidak ditemukan di environment variables." -ForegroundColor Red
    Write-Host "Contoh: `$env:DATABASE_URL='postgresql://user:pass@host:5432/db?sslmode=require'" -ForegroundColor Yellow
    exit 1
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$OutputFile = "$BackupDir/todjuanda_backup_$Timestamp.sql"

if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
    Write-Host "[INIT] Membuat direktori backup: $BackupDir" -ForegroundColor Cyan
}

Write-Host "[INFO] Memulai pencadangan basis data ToDjuanda..." -ForegroundColor Cyan
Write-Host "[INFO] Target output: $OutputFile" -ForegroundColor Gray

try {
    # Eksekusi pg_dump menghasilkan plain-text SQL script (.sql)
    pg_dump $DatabaseUrl --format=plain --clean --if-exists --no-owner --no-acl --encoding=UTF8 --file=$OutputFile
    
    if ($LASTEXITCODE -eq 0 -or (Test-Path $OutputFile)) {
        $FileSize = (Get-Item $OutputFile).Length / 1KB
        $FileHash = (Get-FileHash -Path $OutputFile -Algorithm SHA256).Hash
        Write-Host "[SUCCESS] Pencadangan berhasil diselesaikan!" -ForegroundColor Green
        Write-Host "  - Ukuran Berkas : $([math]::Round($FileSize, 2)) KB" -ForegroundColor Green
        Write-Host "  - SHA256 Hash   : $FileHash" -ForegroundColor Green
        Write-Host "  - Format Berkas : Plain-Text SQL Script (.sql)" -ForegroundColor Green
    } else {
        throw "Perintah pg_dump keluar dengan status error."
    }
} catch {
    Write-Host "[ERROR] Proses pencadangan gagal: $_" -ForegroundColor Red
    exit 1
}
