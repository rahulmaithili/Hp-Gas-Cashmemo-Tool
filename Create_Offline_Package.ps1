# HP Gas Delivery Memo Pro - Offline Package Creator
# Run this script to create a clean offline folder

$source = Split-Path -Parent $MyInvocation.MyCommand.Path
$outputFolder = Join-Path $source "HP_Gas_Delivery_Tool_OFFLINE"

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  HP Gas Delivery Memo Pro - Package Creator" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# Remove old package if exists
if (Test-Path $outputFolder) {
    Write-Host "[INFO] Removing old package folder..." -ForegroundColor Yellow
    Remove-Item $outputFolder -Recurse -Force
}

# Create fresh output folder
New-Item -ItemType Directory -Path $outputFolder | Out-Null
Write-Host "[OK] Created output folder: $outputFolder" -ForegroundColor Green

# Copy dist folder (pre-built frontend)
Write-Host "[COPY] Copying built frontend (dist)..." -ForegroundColor White
Copy-Item -Path (Join-Path $source "dist") -Destination $outputFolder -Recurse
Write-Host "[OK] dist/ copied" -ForegroundColor Green

# Copy server.js
Write-Host "[COPY] Copying server.js..." -ForegroundColor White
Copy-Item -Path (Join-Path $source "server.js") -Destination $outputFolder
Write-Host "[OK] server.js copied" -ForegroundColor Green

# Copy the lightweight offline package.json
Write-Host "[COPY] Copying package.json (production only)..." -ForegroundColor White
Copy-Item -Path (Join-Path $source "package_offline.json") -Destination (Join-Path $outputFolder "package.json")
Write-Host "[OK] package.json copied" -ForegroundColor Green

# Copy settings.json if it exists
$settingsFile = Join-Path $source "settings.json"
if (Test-Path $settingsFile) {
    Write-Host "[COPY] Copying settings.json..." -ForegroundColor White
    Copy-Item -Path $settingsFile -Destination $outputFolder
    Write-Host "[OK] settings.json copied" -ForegroundColor Green
}

# Copy the improved Launch_Tool.bat
Write-Host "[COPY] Copying launcher..." -ForegroundColor White
Copy-Item -Path (Join-Path $source "Launch_Tool.bat") -Destination $outputFolder
Write-Host "[OK] Launch_Tool.bat copied" -ForegroundColor Green

# Copy any CSV files present
$csvFiles = Get-ChildItem -Path $source -Filter "*.csv" -File
if ($csvFiles.Count -gt 0) {
    Write-Host "[COPY] Copying $($csvFiles.Count) CSV data file(s)..." -ForegroundColor White
    foreach ($csv in $csvFiles) {
        Copy-Item -Path $csv.FullName -Destination $outputFolder
        Write-Host "   - $($csv.Name)" -ForegroundColor Gray
    }
    Write-Host "[OK] CSV files copied" -ForegroundColor Green
}

# Create README.txt
$readmeContent = @"
HP GAS DELIVERY MEMO PRO - OFFLINE TOOL
========================================

HOW TO USE:
-----------
1. Make sure Node.js is installed on your computer.
   Download from: https://nodejs.org (LTS version)

2. Double-click "Launch_Tool.bat" to start the tool.
   - First time: It will auto-install required files (needs internet ONCE)
   - After that: Works 100% offline forever

3. Your browser will open at: http://localhost:3001

4. To stop: Close the black command window.

HOW TO SHARE WITH SOMEONE:
---------------------------
- Copy this entire folder to a USB drive or share via WhatsApp.
- They also need Node.js installed (one-time install).
- After that, just double-click Launch_Tool.bat.

CSV DATA FILES:
---------------
- Place your HP Gas booking CSV files inside this folder.
- The tool will auto-detect and load them.

SETTINGS:
---------
- Your agency name, rates, and vendor list are saved in settings.json.
- You can back up this file to preserve your settings.

VERSION: 1.0.0
"@

$readmeContent | Out-File -FilePath (Join-Path $outputFolder "README.txt") -Encoding UTF8
Write-Host "[OK] README.txt created" -ForegroundColor Green

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  PACKAGE CREATED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Location: $outputFolder" -ForegroundColor Yellow
Write-Host ""
Write-Host "  WHAT TO DO NEXT:" -ForegroundColor White
Write-Host "  1. Copy the folder 'HP_Gas_Delivery_Tool_OFFLINE'" -ForegroundColor White
Write-Host "     to any computer or USB drive." -ForegroundColor White
Write-Host "  2. Double-click Launch_Tool.bat to run." -ForegroundColor White
Write-Host ""

# Open the output folder in Explorer
Start-Process explorer.exe $outputFolder

Write-Host "  (Folder opened in Explorer)" -ForegroundColor Gray
Write-Host ""
