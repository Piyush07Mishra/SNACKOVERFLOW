import { writeFileSync } from 'fs';
import path from 'path';

// Create Apple Touch Icon (for iOS)
function createAppleTouchIcon(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
  <rect width="180" height="180" rx="40" fill="#3b82f6"/>
  <text x="90" y="110" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">E</text>
  <text x="90" y="140" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">EmPay</text>
</svg>`;
}

// Create Favicon
function createFavicon(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="8" fill="#3b82f6"/>
  <text x="16" y="22" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">E</text>
</svg>`;
}

// Create various sized Apple touch icons
function createAppleIcon(size: number): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#3b82f6"/>
  <text x="${size/2}" y="${size/2 + size * 0.1}" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">E</text>
</svg>`;
}

console.log('🍎 Creating Mobile PWA Icons for iOS...');

// Create Apple Touch Icon (180x180)
const appleTouchIcon = createAppleTouchIcon();
writeFileSync(path.join(process.cwd(), 'public', 'apple-touch-icon.svg'), appleTouchIcon);
console.log('✅ Created apple-touch-icon.svg');

// Create various sizes for Apple devices
const appleSizes = [57, 72, 114, 144, 152, 167, 180];
appleSizes.forEach(size => {
  const icon = createAppleIcon(size);
  const filename = `apple-touch-icon-${size}x${size}.png`;
  // For now, create SVG versions (can be converted to PNG later)
  const svgFilename = `apple-touch-icon-${size}x${size}.svg`;
  writeFileSync(path.join(process.cwd(), 'public', svgFilename), icon);
  console.log(`✅ Created ${svgFilename}`);
});

// Create favicon
const favicon = createFavicon();
writeFileSync(path.join(process.cwd(), 'public', 'favicon.svg'), favicon);
console.log('✅ Created favicon.svg');

// Create favicon.ico (simplified version)
const faviconIco = createFavicon();
writeFileSync(path.join(process.cwd(), 'public', 'favicon.ico'), faviconIco);
console.log('✅ Created favicon.ico');

// Update layout.tsx to include Apple-specific meta tags
console.log('\n📝 Updating layout with Apple-specific meta tags...');

const layoutPath = path.join(process.cwd(), 'app', 'layout.tsx');
const fs = await import('fs');

if (fs.existsSync(layoutPath)) {
  let layoutContent = fs.readFileSync(layoutPath, 'utf8');
  
  // Add Apple touch icon links if not present
  if (!layoutContent.includes('apple-touch-icon')) {
    const appleIconLinks = `
  {/* Apple Touch Icons for iOS PWA */}
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.svg" />
  <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152x152.svg" />
  <link rel="apple-touch-icon" sizes="144x144" href="/apple-touch-icon-144x144.svg" />
  <link rel="apple-touch-icon" sizes="120x120" href="/apple-touch-icon-120x120.svg" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="icon" type="image/x-icon" href="/favicon.ico" />`;
    
    // Find the position after the manifest link
    const manifestIndex = layoutContent.indexOf('<link rel="manifest"');
    if (manifestIndex !== -1) {
      const endOfManifestLine = layoutContent.indexOf('>', manifestIndex) + 1;
      layoutContent = layoutContent.slice(0, endOfManifestLine) + appleIconLinks + layoutContent.slice(endOfManifestLine);
      
      fs.writeFileSync(layoutPath, layoutContent);
      console.log('✅ Added Apple touch icon links to layout.tsx');
    }
  }
}

console.log('\n🎉 Mobile PWA icons created successfully!');
console.log('📱 iOS PWA installation should now work properly!');
