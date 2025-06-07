# PWA Icons

This directory contains all the icons needed for the Progressive Web App (PWA).

## Generated Icons

- icon-72x72.png (72x72)
- icon-96x96.png (96x96)
- icon-128x128.png (128x128)
- icon-144x144.png (144x144)
- icon-152x152.png (152x152)
- icon-192x192.png (192x192)
- icon-384x384.png (384x384)
- icon-512x512.png (512x512)
- apple-touch-icon.png (180x180)
- favicon-32x32.png (32x32)
- favicon-16x16.png (16x16)

## Usage

These icons are referenced in:
- `manifest.json` - For PWA installation
- `index.html` - For browser tabs and bookmarks

## Converting SVG to PNG

The generated SVG files need to be converted to PNG format:

1. Use an online converter like:
   - https://convertio.co/svg-png/
   - https://cloudconvert.com/svg-to-png/

2. Or use a tool like Inkscape:
   ```bash
   inkscape icon-192x192.svg --export-png=icon-192x192.png
   ```

3. Replace the SVG files with the PNG files

## Favicon

Convert `favicon.svg` to `favicon.ico` using:
- https://favicon.io/favicon-converter/
- Place the `favicon.ico` file in the `public/` directory
