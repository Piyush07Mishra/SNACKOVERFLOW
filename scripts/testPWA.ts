import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config({ path: '.env.local' });
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: '.env' });
}

if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = 'mongodb://localhost:27017/empay';
}

console.log('🔍 Testing PWA Installation Requirements...\n');

// Check 1: Service Worker
console.log('1️⃣ Service Worker Check:');
try {
  const fs = await import('fs');
  const swPath = './public/sw.js';
  if (fs.existsSync(swPath)) {
    console.log('✅ Service worker exists at /public/sw.js');
    
    const swContent = fs.readFileSync(swPath, 'utf8');
    if (swContent.includes('install') && swContent.includes('fetch')) {
      console.log('✅ Service worker has required events (install, fetch)');
    } else {
      console.log('❌ Service worker missing required events');
    }
  } else {
    console.log('❌ Service worker not found');
  }
} catch (error) {
  console.log('❌ Error checking service worker:', error);
}

// Check 2: Manifest
console.log('\n2️⃣ Manifest Check:');
try {
  const fs = await import('fs');
  const manifestPath = './public/manifest.json';
  if (fs.existsSync(manifestPath)) {
    console.log('✅ Manifest exists at /public/manifest.json');
    
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
    let missingFields = [];
    
    requiredFields.forEach(field => {
      if (!manifest[field]) {
        missingFields.push(field);
      }
    });
    
    if (missingFields.length === 0) {
      console.log('✅ Manifest has all required fields');
    } else {
      console.log(`❌ Manifest missing fields: ${missingFields.join(', ')}`);
    }
    
    if (manifest.icons && manifest.icons.length > 0) {
      console.log(`✅ Manifest has ${manifest.icons.length} icons`);
      
      // Check if icon files exist
      const fs2 = await import('fs');
      let existingIcons = 0;
      manifest.icons.forEach((icon: any) => {
        if (fs2.existsSync(`./public${icon.src}`)) {
          existingIcons++;
        }
      });
      
      if (existingIcons === manifest.icons.length) {
        console.log('✅ All icon files exist');
      } else {
        console.log(`⚠️  Only ${existingIcons}/${manifest.icons.length} icon files exist`);
      }
    } else {
      console.log('❌ Manifest has no icons');
    }
  } else {
    console.log('❌ Manifest not found');
  }
} catch (error) {
  console.log('❌ Error checking manifest:', error);
}

// Check 3: HTTPS requirement (for production)
console.log('\n3️⃣ HTTPS Check:');
const isLocalhost = process.env.NODE_ENV === 'development' || 
                   process.env.NEXTAUTH_URL?.includes('localhost') ||
                   process.env.NEXTAUTH_URL?.includes('127.0.0.1');

if (isLocalhost) {
  console.log('✅ Running on localhost (HTTPS not required for development)');
} else {
  console.log('⚠️  Production deployment requires HTTPS');
}

// Check 4: PWA Install Banner Component
console.log('\n4️⃣ PWA Install Banner Check:');
try {
  const fs = await import('fs');
  const componentPath = './components/PWAInstallBanner.tsx';
  if (fs.existsSync(componentPath)) {
    console.log('✅ PWAInstallBanner component exists');
  } else {
    console.log('❌ PWAInstallBanner component not found');
  }
} catch (error) {
  console.log('❌ Error checking PWA install banner:', error);
}

// Check 5: PWA Hook
console.log('\n5️⃣ PWA Hook Check:');
try {
  const fs = await import('fs');
  const hookPath = './hooks/usePWAInstall.ts';
  if (fs.existsSync(hookPath)) {
    console.log('✅ usePWAInstall hook exists');
  } else {
    console.log('❌ usePWAInstall hook not found');
  }
} catch (error) {
  console.log('❌ Error checking PWA hook:', error);
}

console.log('\n🎯 PWA Installation Instructions:');
console.log('1. Open Chrome/Edge browser');
console.log('2. Navigate to http://localhost:3000');
console.log('3. Look for install icon (↓) in address bar or install banner');
console.log('4. Click "Install EmPay" to add to desktop/home screen');
console.log('5. For mobile: Use Chrome menu → "Add to Home screen"');

console.log('\n📱 Testing Checklist:');
console.log('□ Service worker registered successfully');
console.log('□ Manifest loads without errors');
console.log('□ Icons display correctly');
console.log('□ Install prompt appears');
console.log('□ App launches in standalone mode');
console.log('□ Offline functionality works');

console.log('\n🔧 If PWA install prompt doesn\'t appear:');
console.log('1. Clear site data (Chrome Settings → Privacy → Clear browsing data)');
console.log('2. Refresh the page');
console.log('3. Interact with the site (click buttons, navigate)');
console.log('4. Check Chrome DevTools → Application → Manifest');
console.log('5. Check Chrome DevTools → Application → Service Workers');

console.log('\n✅ PWA setup complete! Ready for installation testing.');
