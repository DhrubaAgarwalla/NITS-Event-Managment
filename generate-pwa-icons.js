import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple SVG icon generator for PWA
const generateSVGIcon = (size) => {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6e44ff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ff44e3;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#grad)"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.5}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">E</text>
  <circle cx="${size * 0.75}" cy="${size * 0.25}" r="${size * 0.08}" fill="rgba(255,255,255,0.3)"/>
</svg>`;
};

// Icon sizes needed for PWA
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

// Generate SVG files (can be converted to PNG later)
iconSizes.forEach(({ size, name }) => {
  const svgContent = generateSVGIcon(size);
  const svgName = name.replace('.png', '.svg');
  const svgPath = path.join(iconsDir, svgName);

  fs.writeFileSync(svgPath, svgContent);
  console.log(`Generated ${svgName}`);
});

// Create a simple favicon.ico placeholder
const faviconPath = path.join(__dirname, 'public', 'favicon.ico');
if (!fs.existsSync(faviconPath)) {
  // Copy the 32x32 SVG as a placeholder
  const favicon32 = generateSVGIcon(32);
  fs.writeFileSync(path.join(iconsDir, 'favicon.svg'), favicon32);
  console.log('Generated favicon.svg (use online converter to create favicon.ico)');
}

console.log('\n✅ PWA icons generated successfully!');
console.log('\n📝 Next steps:');
console.log('1. Convert SVG files to PNG using an online converter or image editor');
console.log('2. Replace the SVG files with PNG files in public/icons/');
console.log('3. Convert favicon.svg to favicon.ico and place in public/');
console.log('\n🌐 Online converters you can use:');
console.log('- https://convertio.co/svg-png/');
console.log('- https://cloudconvert.com/svg-to-png');
console.log('- https://favicon.io/favicon-converter/');

// Create a README for the icons
const readmeContent = `# PWA Icons

This directory contains all the icons needed for the Progressive Web App (PWA).

## Generated Icons

${iconSizes.map(({ size, name }) => `- ${name} (${size}x${size})`).join('\n')}

## Usage

These icons are referenced in:
- \`manifest.json\` - For PWA installation
- \`index.html\` - For browser tabs and bookmarks

## Converting SVG to PNG

The generated SVG files need to be converted to PNG format:

1. Use an online converter like:
   - https://convertio.co/svg-png/
   - https://cloudconvert.com/svg-to-png/

2. Or use a tool like Inkscape:
   \`\`\`bash
   inkscape icon-192x192.svg --export-png=icon-192x192.png
   \`\`\`

3. Replace the SVG files with the PNG files

## Favicon

Convert \`favicon.svg\` to \`favicon.ico\` using:
- https://favicon.io/favicon-converter/
- Place the \`favicon.ico\` file in the \`public/\` directory
`;

fs.writeFileSync(path.join(iconsDir, 'README.md'), readmeContent);
console.log('\n📖 Created README.md with instructions');
