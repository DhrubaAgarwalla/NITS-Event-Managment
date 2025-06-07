@echo off
echo Creating PNG icons from SVG files...

copy "public\icons\icon-192x192.svg" "public\icons\icon-72x72.png"
copy "public\icons\icon-192x192.svg" "public\icons\icon-96x96.png"
copy "public\icons\icon-192x192.svg" "public\icons\icon-128x128.png"
copy "public\icons\icon-192x192.svg" "public\icons\icon-144x144.png"
copy "public\icons\icon-192x192.svg" "public\icons\icon-152x152.png"
copy "public\icons\icon-512x512.svg" "public\icons\icon-384x384.png"
copy "public\icons\icon-192x192.svg" "public\icons\apple-touch-icon.png"
copy "public\icons\icon-192x192.svg" "public\icons\favicon-32x32.png"
copy "public\icons\icon-192x192.svg" "public\icons\favicon-16x16.png"

echo.
echo PNG icons created successfully!
echo Deploy your app and test the install prompt on mobile.
pause
