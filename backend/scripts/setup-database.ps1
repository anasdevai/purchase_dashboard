# Creates the PostgreSQL database from DATABASE_URL in .env and applies Prisma migrations.
# Requires PostgreSQL to be running (see README / error output if connection fails).

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path $PSScriptRoot -Parent
Set-Location $ProjectRoot

function Get-DatabaseUrl {
    $envPath = Join-Path $ProjectRoot ".env"
    if (-not (Test-Path $envPath)) {
        throw ".env not found. Copy .env.example to .env and set DATABASE_URL."
    }
    foreach ($line in Get-Content $envPath) {
        if ($line -match '^\s*DATABASE_URL\s*=\s*"(.+)"\s*$') {
            return $Matches[1]
        }
    }
    throw "DATABASE_URL not found in .env"
}

function Find-Psql {
    $candidates = @(
        ${env:PGROOT} + "\bin\psql.exe",
        "C:\Program Files\PostgreSQL\18\bin\psql.exe",
        "C:\Program Files\PostgreSQL\17\bin\psql.exe",
        "C:\Program Files\PostgreSQL\16\bin\psql.exe"
    ) | Where-Object { $_ -and (Test-Path $_) }
    if ($candidates.Count -gt 0) { return $candidates[0] }
    $fromPath = Get-Command psql -ErrorAction SilentlyContinue
    if ($fromPath) { return $fromPath.Source }
    throw "psql.exe not found. Install PostgreSQL or add it to PATH."
}

function Parse-PostgresUrl([string]$url) {
    if ($url -notmatch '^postgresql://([^:]+):([^@]+)@([^:/]+):(\d+)/([^?]+)') {
        throw "DATABASE_URL format not recognized: $url"
    }
    return @{
        User     = $Matches[1]
        Password = $Matches[2]
        Host     = $Matches[3]
        Port     = [int]$Matches[4]
        Database = $Matches[5]
    }
}

$dbUrl = Get-DatabaseUrl
$pg = Parse-PostgresUrl $dbUrl
$psql = Find-Psql
$env:PGPASSWORD = $pg.Password

Write-Host "Checking PostgreSQL at $($pg.Host):$($pg.Port) ..."

$ready = $false
for ($i = 1; $i -le 15; $i++) {
    & $psql -U $pg.User -h $pg.Host -p $pg.Port -d postgres -tAc "SELECT 1" 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $ready = $true
        break
    }
    if ($i -eq 1) {
        $svc = Get-Service -Name "postgresql-x64-*" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($svc -and $svc.Status -ne "Running") {
            Write-Host ""
            Write-Host "PostgreSQL service '$($svc.Name)' is stopped."
            Write-Host "Start it in an elevated PowerShell:"
            Write-Host "  Start-Service $($svc.Name)"
            Write-Host "  # or: net start $($svc.Name)"
            Write-Host ""
        }
    }
    Start-Sleep -Seconds 2
}

if (-not $ready) {
    throw "Cannot connect to PostgreSQL. Start the server, verify DATABASE_URL in .env (this install uses port 5433 by default), then run this script again."
}

$exists = & $psql -U $pg.User -h $pg.Host -p $pg.Port -d postgres -tAc `
    "SELECT 1 FROM pg_database WHERE datname = '$($pg.Database)'"
if ($exists -ne "1") {
    Write-Host "Creating database '$($pg.Database)' ..."
    & $psql -U $pg.User -h $pg.Host -p $pg.Port -d postgres -v ON_ERROR_STOP=1 -c `
        "CREATE DATABASE $($pg.Database) ENCODING 'UTF8' TEMPLATE template0;"
} else {
    Write-Host "Database '$($pg.Database)' already exists."
}

Write-Host "Applying Prisma migrations ..."
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Done. Database '$($pg.Database)' is ready."
