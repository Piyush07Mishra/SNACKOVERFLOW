import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';
import path from 'path';

// Icon sizes needed for PWA
const iconSizes = [
  16, 32, 70, 72, 96, 128, 144, 150, 152, 167, 180, 192, 310, 384, 512
];

// Shortcut icons
const shortcutIcons = [
  { name: 'dashboard', color: '#3b82f6' },
  { name: 'attendance', color: '#10b981' },
  { name: 'leave', color: '#f59e0b' },
  { name: 'payroll', color: '#8b5cf6' }
];

function createIcon(size: number, color: string = '#3b82f6', text?: string): Buffer {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  
  // Add rounded corners effect
  ctx.globalCompositeOperation = 'destination-in';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  
  // Add text or icon
  if (text) {
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${size * 0.3}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, size / 2, size / 2);
  } else {
    // Draw a simple "E" for EmPay
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${size * 0.5}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('E', size / 2, size / 2);
  }
  
  return canvas.toBuffer('image/png');
}

function createShortcutIcon(size: number, name: string, color: string): Buffer {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background with rounded corners
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.15);
  ctx.fill();
  
  // Add icon symbol based on type
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const symbols: Record<string, string> = {
    dashboard: '📊',
    attendance: '✓',
    leave: '🏖',
    payroll: '💰'
  };
  
  ctx.fillText(symbols[name] || name.charAt(0).toUpperCase(), size / 2, size / 2);
  
  return canvas.toBuffer('image/png');
}

// Generate main app icons
console.log('🎨 Generating PWA icons...');

iconSizes.forEach(size => {
  const iconBuffer = createIcon(size);
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(process.cwd(), 'public', 'icons', filename);
  writeFileSync(filepath, iconBuffer);
  console.log(`✅ Created ${filename}`);
});

// Generate shortcut icons
console.log('\n🎨 Generating shortcut icons...');

shortcutIcons.forEach(({ name, color }) => {
  const iconBuffer = createShortcutIcon(96, name, color);
  const filename = `${name}-96x96.png`;
  const filepath = path.join(process.cwd(), 'public', 'icons', filename);
  writeFileSync(filepath, iconBuffer);
  console.log(`✅ Created ${filename}`);
});

// Generate additional sizes for compatibility
const additionalSizes = [192, 512];
additionalSizes.forEach(size => {
  shortcutIcons.forEach(({ name, color }) => {
    const iconBuffer = createShortcutIcon(size, name, color);
    const filename = `${name}-${size}x${size}.png`;
    const filepath = path.join(process.cwd(), 'public', 'icons', filename);
    writeFileSync(filepath, iconBuffer);
    console.log(`✅ Created ${filename}`);
  });
});

console.log('\n🎉 All icons generated successfully!');
console.log('📱 PWA is now ready for installation!');
