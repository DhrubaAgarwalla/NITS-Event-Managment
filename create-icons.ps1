# PowerShell script to create placeholder PNG icons for PWA
Write-Host "Creating PWA Icons..." -ForegroundColor Cyan

# Create icons directory if it doesn't exist
$iconsDir = "public\icons"
if (!(Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir -Force
    Write-Host "Created icons directory" -ForegroundColor Green
}

# Icon sizes needed
$iconSizes = @(
    @{size=72; name="icon-72x72.png"},
    @{size=96; name="icon-96x96.png"},
    @{size=128; name="icon-128x128.png"},
    @{size=144; name="icon-144x144.png"},
    @{size=152; name="icon-152x152.png"},
    @{size=192; name="icon-192x192.png"},
    @{size=384; name="icon-384x384.png"},
    @{size=512; name="icon-512x512.png"},
    @{size=180; name="apple-touch-icon.png"},
    @{size=32; name="favicon-32x32.png"},
    @{size=16; name="favicon-16x16.png"}
)

Write-Host "Downloading placeholder icons..." -ForegroundColor Yellow

foreach ($icon in $iconSizes) {
    $size = $icon.size
    $name = $icon.name
    $url = "https://via.placeholder.com/${size}x${size}/6e44ff/ffffff?text=E"
    $outputPath = "$iconsDir\$name"

    try {
        Invoke-WebRequest -Uri $url -OutFile $outputPath -ErrorAction Stop
        Write-Host "Created $name ($size x $size)" -ForegroundColor Green
    }
    catch {
        Write-Host "Failed to create $name" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nPWA Icons created successfully!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Deploy your app to Vercel" -ForegroundColor White
Write-Host "2. Test on mobile device" -ForegroundColor White
Write-Host "3. Install prompt should appear!" -ForegroundColor White

# Also update service worker to reference PNG files
$swPath = "public\sw.js"
if (Test-Path $swPath) {
    $swContent = Get-Content $swPath -Raw
    $swContent = $swContent -replace "icon-192x192\.svg", "icon-192x192.png"
    $swContent = $swContent -replace "icon-512x512\.svg", "icon-512x512.png"
    Set-Content $swPath $swContent
    Write-Host "Updated service worker to use PNG icons" -ForegroundColor Green
}

Write-Host "`nPWA Setup Complete!" -ForegroundColor Magenta
Write-Host "Your app should now show install prompts on mobile devices!" -ForegroundColor Green
