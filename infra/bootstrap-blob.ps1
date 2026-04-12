# CortexYou — Bootstrap Blob Storage
# Creates all required containers in Azurite (local) or Azure Storage (production).
# Usage (local Azurite):   .\bootstrap-blob.ps1
# Usage (Azure):           .\bootstrap-blob.ps1 -AccountName "mystorageaccount"

param(
    [string]$AccountName = "",
    [string]$AccountKey  = "",
    [switch]$UseAzurite  = $false
)

$containers = @(
    "cortexyou-items",
    "cortexyou-raw",
    "cortexyou-derived",
    "cortexyou-logs",
    "cortexyou-exports"
)

if ($UseAzurite -or ($AccountName -eq "")) {
    Write-Host "Targeting Azurite (local emulator)…" -ForegroundColor Cyan
    $connStr = "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KkzdGtHzM=;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;"

    foreach ($container in $containers) {
        Write-Host "  Creating container: $container" -NoNewline
        $result = az storage container create `
            --name $container `
            --connection-string $connStr `
            --output none 2>&1

        if ($LASTEXITCODE -eq 0) {
            Write-Host " ✓" -ForegroundColor Green
        } else {
            Write-Host " (already exists or error)" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "Targeting Azure Storage account: $AccountName" -ForegroundColor Cyan

    $authArgs = if ($AccountKey) {
        @("--account-name", $AccountName, "--account-key", $AccountKey)
    } else {
        @("--account-name", $AccountName, "--auth-mode", "login")
    }

    foreach ($container in $containers) {
        Write-Host "  Creating container: $container" -NoNewline
        $result = az storage container create `
            --name $container @authArgs `
            --output none 2>&1

        if ($LASTEXITCODE -eq 0) {
            Write-Host " ✓" -ForegroundColor Green
        } else {
            Write-Host " (already exists or error)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "Done. Containers:" -ForegroundColor Cyan
$containers | ForEach-Object { Write-Host "  • $_" }
