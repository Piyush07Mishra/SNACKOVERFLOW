import { writeFileSync } from 'fs';
import path from 'path';

// Simple SVG template for icons
function createSVGIcon(size: number, color: string, text: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="${color}"/>
  <text x="${size/2}" y="${size/2}" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${text}</text>
</svg>`;
}

function createShortcutSVG(size: number, color: string, symbol: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="${color}"/>
  <text x="${size/2}" y="${size/2}" font-family="Arial, sans-serif" font-size="${size * 0.5}" fill="white" text-anchor="middle" dominant-baseline="middle">${symbol}</text>
</svg>`;
}

// Icon sizes needed for PWA
const iconSizes = [16, 32, 70, 72, 96, 128, 144, 150, 152, 167, 180, 192, 310, 384, 512];

// Shortcut icons configuration
const shortcutIcons = [
  { name: 'dashboard', color: '#3b82f6', symbol: '📊' },
  { name: 'attendance', color: '#10b981', symbol: '✓' },
  { name: 'leave', color: '#f59e0b', symbol: '🏖' },
  { name: 'payroll', color: '#8b5cf6', symbol: '💰' }
];

console.log('🎨 Creating PWA icons (SVG format)...');

// Create main app icons
iconSizes.forEach(size => {
  const svg = createSVGIcon(size, '#3b82f6', 'E');
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(process.cwd(), 'public', 'icons', filename);
  writeFileSync(filepath, svg);
  console.log(`✅ Created ${filename}`);
});

// Create shortcut icons
console.log('\n🎨 Creating shortcut icons...');

shortcutIcons.forEach(({ name, color, symbol }) => {
  const svg = createShortcutSVG(96, color, symbol);
  const filename = `${name}-96x96.svg`;
  const filepath = path.join(process.cwd(), 'public', 'icons', filename);
  writeFileSync(filepath, svg);
  console.log(`✅ Created ${filename}`);
});

// Update manifest to use SVG icons
console.log('\n📝 Updating manifest.json for SVG icons...');

const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
const manifest = {
  name: "EmPay - HR Management System",
  short_name: "EmPay",
  description: "Smart Human Resource Management System for modern businesses",
  start_url: "/",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#3b82f6",
  orientation: "portrait-primary",
  scope: "/",
  lang: "en",
  categories: ["business", "productivity", "utilities"],
  icons: [
    {
      src: "/icons/icon-192x192.svg",
      sizes: "192x192",
      type: "image/svg+xml",
      purpose: "maskable any"
    },
    {
      src: "/icons/icon-512x512.svg",
      sizes: "512x512",
      type: "image/svg+xml",
      purpose: "maskable any"
    }
  ],
  shortcuts: [
    {
      name: "Dashboard",
      short_name: "Dashboard",
      description: "View your HR dashboard",
      url: "/dashboard",
      icons: [
        {
          src: "/icons/dashboard-96x96.svg",
          sizes: "96x96",
          type: "image/svg+xml"
        }
      ]
    },
    {
      name: "Attendance",
      short_name: "Attendance",
      description: "Mark your attendance",
      url: "/dashboard/attendance",
      icons: [
        {
          src: "/icons/attendance-96x96.svg",
          sizes: "96x96",
          type: "image/svg+xml"
        }
      ]
    },
    {
      name: "Time Off",
      short_name: "Leave",
      description: "Request time off",
      url: "/dashboard/timeoff",
      icons: [
        {
          src: "/icons/leave-96x96.svg",
          sizes: "96x96",
          type: "image/svg+xml"
        }
      ]
    },
    {
      name: "Payroll",
      short_name: "Payroll",
      description: "View payroll information",
      url: "/dashboard/payroll",
      icons: [
        {
          src: "/icons/payroll-96x96.svg",
          sizes: "96x96",
          type: "image/svg+xml"
        }
      ]
    }
  ]
};

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('✅ Updated manifest.json with SVG icons');

console.log('\n🎉 Icons created successfully!');
console.log('📱 PWA is now ready for installation!');
console.log('💡 Note: Using SVG icons for better quality and smaller size');
