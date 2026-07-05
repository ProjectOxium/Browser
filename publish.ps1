param(
    [string]$Configuration = "Release",
    [string]$OutputDir = "publish"
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host ""
Write-Host "========================================" -ForegroundColor Red
Write-Host "  OXIUM INSTALLER — Build Script" -ForegroundColor Red
Write-Host "  Project Oxium" -ForegroundColor DarkGray
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

# Check .NET 8 SDK
Write-Host "[1/4] Checking .NET 8 SDK..." -ForegroundColor Gray
$dotnet = Get-Command dotnet -ErrorAction SilentlyContinue
if (-not $dotnet) {
    Write-Host "ERROR: .NET SDK not found. Please install .NET 8 SDK from:" -ForegroundColor Red
    Write-Host "  https://dotnet.microsoft.com/en-us/download/dotnet/8.0" -ForegroundColor Yellow
    exit 1
}
$sdkVersion = & dotnet --version
Write-Host "  .NET SDK $sdkVersion detected" -ForegroundColor Green

# Package payload
Write-Host "[2/4] Packaging payload..." -ForegroundColor Gray
$payloadDir = Join-Path $scriptDir "Payload"
$zipPath = Join-Path $scriptDir "OxiumInstaller\Payload\AppPayload.zip"
$zipDir = Join-Path $scriptDir "OxiumInstaller\Payload"

New-Item -ItemType Directory -Path $zipDir -Force | Out-Null

# Remove README.txt from the zipped payload (keep AppPayload.zip clean)
$payloadFiles = Get-ChildItem -Path $payloadDir -Exclude "AppPayload.zip" -ErrorAction SilentlyContinue
if ($payloadFiles.Count -eq 0) {
    Write-Host "  WARNING: No payload files found. Creating placeholder zip." -ForegroundColor Yellow
    # Keep existing placeholder zip
    Copy-Item -Path (Join-Path $payloadDir "AppPayload.zip") -Destination $zipPath -Force
} else {
    Write-Host "  Found $($payloadFiles.Count) file(s) to package" -ForegroundColor Cyan
    $tempZip = Join-Path $env:TEMP "OxiumPayload.zip"
    Compress-Archive -Path (Join-Path $payloadDir "*") -DestinationPath $tempZip -Force
    Copy-Item -Path $tempZip -Destination $zipPath -Force
    Remove-Item $tempZip -Force
}
Write-Host "  Payload packaged successfully" -ForegroundColor Green

# Restore
Write-Host "[3/4] Restoring NuGet packages..." -ForegroundColor Gray
$projectPath = Join-Path $scriptDir "OxiumInstaller\OxiumInstaller.csproj"
& dotnet restore $projectPath
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: dotnet restore failed." -ForegroundColor Red
    exit 1
}
Write-Host "  Restore complete" -ForegroundColor Green

# Publish
Write-Host "[4/4] Publishing single-file executable..." -ForegroundColor Gray
$outputFull = Join-Path $scriptDir $OutputDir
& dotnet publish $projectPath `
    -c $Configuration `
    -o $outputFull `
    /p:PublishSingleFile=true `
    /p:SelfContained=true `
    /p:IncludeNativeLibrariesForSelfExtract=true `
    /p:EnableCompressionInSingleFile=true `
    /p:RuntimeIdentifier=win-x64 `
    --nologo

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: dotnet publish failed." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  BUILD SUCCESSFUL" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Output: $outputFull\OxiumInstaller.exe" -ForegroundColor Cyan
$exePath = Join-Path $outputFull "OxiumInstaller.exe"
$sizeMB = [math]::Round((Get-Item $exePath).Length / 1MB, 1)
Write-Host "  Size:   $sizeMB MB" -ForegroundColor Cyan
Write-Host ""
