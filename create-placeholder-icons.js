import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create placeholder PNG icons using data URLs
const createPlaceholderIcon = (size) => {
  // Create a simple canvas-like data URL for a PNG icon
  const canvas = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#6e44ff;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#ff44e3;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#grad)"/>
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">E</text>
    <circle cx="${size * 0.75}" cy="${size * 0.25}" r="${size * 0.08}" fill="rgba(255,255,255,0.3)"/>
  </svg>`;
  
  return `data:image/svg+xml;base64,${Buffer.from(canvas).toString('base64')}`;
};

// Icon sizes needed
const iconSizes = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 16, name: 'favicon-16x16.png' }
];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('🎨 Creating placeholder PNG icons...\n');

// Create a simple HTML file that can generate PNG icons
const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>Icon Generator</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        canvas { border: 1px solid #ddd; margin: 10px; }
        .download-btn { 
            background: #6e44ff; 
            color: white; 
            border: none; 
            padding: 5px 10px; 
            border-radius: 3px; 
            cursor: pointer; 
            margin: 5px;
        }
    </style>
</head>
<body>
    <h1>PWA Icon Generator</h1>
    <p>This page will generate PNG icons for your PWA. Click "Generate All" to download all icons.</p>
    
    <button onclick="generateAllIcons()" style="background: #6e44ff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 16px;">
        Generate All Icons
    </button>
    
    <div id="iconContainer"></div>

    <script>
        const iconSizes = ${JSON.stringify(iconSizes)};

        function generateIcon(size) {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            // Background gradient
            const gradient = ctx.createLinearGradient(0, 0, size, size);
            gradient.addColorStop(0, '#6e44ff');
            gradient.addColorStop(1, '#ff44e3');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, size, size);

            // Add rounded corners
            ctx.globalCompositeOperation = 'destination-in';
            ctx.beginPath();
            ctx.roundRect(0, 0, size, size, size * 0.15);
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';

            // Add "E" letter
            ctx.fillStyle = 'white';
            ctx.font = \`bold \${size * 0.4}px Arial\`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('E', size / 2, size / 2);

            // Add accent dot
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(size * 0.75, size * 0.25, size * 0.08, 0, Math.PI * 2);
            ctx.fill();

            return canvas;
        }

        function downloadCanvas(canvas, filename) {
            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }

        function generateAllIcons() {
            const container = document.getElementById('iconContainer');
            container.innerHTML = '<h2>Generated Icons:</h2>';

            iconSizes.forEach(({ size, name }) => {
                const canvas = generateIcon(size);
                
                const iconDiv = document.createElement('div');
                iconDiv.style.display = 'inline-block';
                iconDiv.style.margin = '10px';
                iconDiv.style.textAlign = 'center';
                
                iconDiv.innerHTML = \`
                    <div>\${name}</div>
                    <div>\${size}x\${size}</div>
                    <button class="download-btn" onclick="downloadCanvas(this.previousElementSibling.previousElementSibling, '\${name}')">Download</button>
                \`;
                
                iconDiv.insertBefore(canvas, iconDiv.querySelector('button'));
                container.appendChild(iconDiv);
                
                // Auto-download after a short delay
                setTimeout(() => {
                    downloadCanvas(canvas, name);
                }, 100 * iconSizes.indexOf({ size, name }));
            });
            
            alert('All icons will be downloaded automatically. Save them to your public/icons/ folder.');
        }

        // Polyfill for roundRect
        if (!CanvasRenderingContext2D.prototype.roundRect) {
            CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
                this.beginPath();
                this.moveTo(x + radius, y);
                this.lineTo(x + width - radius, y);
                this.quadraticCurveTo(x + width, y, x + width, y + radius);
                this.lineTo(x + width, y + height - radius);
                this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                this.lineTo(x + radius, y + height);
                this.quadraticCurveTo(x, y + height, x, y + height - radius);
                this.lineTo(x, y + radius);
                this.quadraticCurveTo(x, y, x + radius, y);
                this.closePath();
            };
        }
    </script>
</body>
</html>`;

// Write the HTML file
fs.writeFileSync(path.join(__dirname, 'generate-icons.html'), htmlContent);

console.log('✅ Created generate-icons.html');
console.log('\n📝 Next steps:');
console.log('1. Open generate-icons.html in your browser');
console.log('2. Click "Generate All Icons" button');
console.log('3. Save all downloaded PNG files to public/icons/');
console.log('4. Deploy your app');
console.log('\n🌐 Or use online converter:');
console.log('- Upload SVG files from public/icons/ to https://convertio.co/svg-png/');
console.log('- Download PNG versions');
console.log('- Replace SVG files with PNG files');

// Also create a quick fix script
const quickFixScript = `#!/bin/bash
# Quick fix script for PWA icons

echo "🔧 PWA Icon Quick Fix"
echo "This script will create placeholder PNG icons using online placeholders"

# Create placeholder icons using placeholder.com
curl -s "https://via.placeholder.com/192x192/6e44ff/ffffff?text=E" -o "public/icons/icon-192x192.png"
curl -s "https://via.placeholder.com/512x512/6e44ff/ffffff?text=E" -o "public/icons/icon-512x512.png"
curl -s "https://via.placeholder.com/72x72/6e44ff/ffffff?text=E" -o "public/icons/icon-72x72.png"
curl -s "https://via.placeholder.com/96x96/6e44ff/ffffff?text=E" -o "public/icons/icon-96x96.png"
curl -s "https://via.placeholder.com/128x128/6e44ff/ffffff?text=E" -o "public/icons/icon-128x128.png"
curl -s "https://via.placeholder.com/144x144/6e44ff/ffffff?text=E" -o "public/icons/icon-144x144.png"
curl -s "https://via.placeholder.com/152x152/6e44ff/ffffff?text=E" -o "public/icons/icon-152x152.png"
curl -s "https://via.placeholder.com/384x384/6e44ff/ffffff?text=E" -o "public/icons/icon-384x384.png"
curl -s "https://via.placeholder.com/180x180/6e44ff/ffffff?text=E" -o "public/icons/apple-touch-icon.png"
curl -s "https://via.placeholder.com/32x32/6e44ff/ffffff?text=E" -o "public/icons/favicon-32x32.png"
curl -s "https://via.placeholder.com/16x16/6e44ff/ffffff?text=E" -o "public/icons/favicon-16x16.png"

echo "✅ Placeholder PNG icons created!"
echo "🚀 Deploy your app and test the install prompt"
`;

fs.writeFileSync(path.join(__dirname, 'quick-fix-icons.sh'), quickFixScript);
fs.chmodSync(path.join(__dirname, 'quick-fix-icons.sh'), '755');

console.log('\n🚀 Also created quick-fix-icons.sh for instant placeholder icons');
console.log('Run: ./quick-fix-icons.sh (requires curl)');
