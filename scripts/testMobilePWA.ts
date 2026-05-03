import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: '.env' });
}

console.log('📱 Testing Mobile PWA Installation Requirements...\n');

// Check 1: Mobile-specific manifest settings
console.log('1️⃣ Mobile Manifest Check:');
try {
  const fs = await import('fs');
  const manifestPath = './public/manifest.json';
  
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    console.log(`✅ Name: ${manifest.name}`);
    console.log(`✅ Short Name: ${manifest.short_name}`);
    console.log(`✅ Display: ${manifest.display}`);
    console.log(`✅ Orientation: ${manifest.orientation}`);
    console.log(`✅ Theme Color: ${manifest.theme_color}`);
    
    // Check mobile-specific requirements
    if (manifest.display === 'standalone') {
      console.log('✅ Standalone display mode (mobile-friendly)');
    } else {
      console.log('❌ Display mode should be "standalone" for mobile');
    }
    
    if (manifest.orientation === 'portrait-primary' || manifest.orientation === 'portrait') {
      console.log('✅ Portrait orientation (mobile-friendly)');
    } else {
      console.log('⚠️  Orientation should be portrait for mobile');
    }
    
    if (manifest.icons && manifest.icons.length >= 2) {
      console.log(`✅ Has ${manifest.icons.length} icons for mobile`);
      
      // Check for required mobile icon sizes
      const requiredSizes = ['192x192', '512x512'];
      const availableSizes = manifest.icons.map((icon: any) => icon.sizes);
      
      requiredSizes.forEach(size => {
        if (availableSizes.includes(size)) {
          console.log(`✅ Has ${size} icon (required for mobile)`);
        } else {
          console.log(`❌ Missing ${size} icon (required for mobile)`);
        }
      });
    } else {
      console.log('❌ Need at least 2 icons for mobile PWA');
    }
    
    // Check start_url for mobile
    if (manifest.start_url === '/' || manifest.start_url === '/dashboard') {
      console.log('✅ Start URL is mobile-friendly');
    } else {
      console.log('⚠️  Start URL should be "/" or "/dashboard"');
    }
    
  } else {
    console.log('❌ Manifest not found');
  }
} catch (error) {
  console.log('❌ Error checking manifest:', error);
}

// Check 2: Service Worker for mobile
console.log('\n2️⃣ Mobile Service Worker Check:');
try {
  const fs = await import('fs');
  const swPath = './public/sw.js';
  
  if (fs.existsSync(swPath)) {
    const swContent = fs.readFileSync(swPath, 'utf8');
    
    // Check for mobile-specific service worker features
    if (swContent.includes('install')) {
      console.log('✅ Service worker has install event');
    } else {
      console.log('❌ Service worker missing install event');
    }
    
    if (swContent.includes('fetch')) {
      console.log('✅ Service worker has fetch event (offline support)');
    } else {
      console.log('❌ Service worker missing fetch event');
    }
    
    if (swContent.includes('cache')) {
      console.log('✅ Service worker has caching (mobile offline support)');
    } else {
      console.log('⚠️  Service worker missing caching (important for mobile)');
    }
    
  } else {
    console.log('❌ Service worker not found');
  }
} catch (error) {
  console.log('❌ Error checking service worker:', error);
}

// Check 3: Mobile viewport and meta tags
console.log('\n3️⃣ Mobile Meta Tags Check:');
try {
  const fs = await import('fs');
  const layoutPath = './app/layout.tsx';
  
  if (fs.existsSync(layoutPath)) {
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');
    
    // Check for essential mobile meta tags
    if (layoutContent.includes('viewport')) {
      console.log('✅ Has viewport meta tag');
    } else {
      console.log('❌ Missing viewport meta tag (critical for mobile)');
    }
    
    if (layoutContent.includes('apple-mobile-web-app-capable')) {
      console.log('✅ Has Apple mobile web app capable meta tag');
    } else {
      console.log('⚠️  Missing Apple mobile web app capable meta tag');
    }
    
    if (layoutContent.includes('apple-mobile-web-app-status-bar-style')) {
      console.log('✅ Has Apple status bar style meta tag');
    } else {
      console.log('⚠️  Missing Apple status bar style meta tag');
    }
    
    if (layoutContent.includes('theme-color')) {
      console.log('✅ Has theme color meta tag');
    } else {
      console.log('⚠️  Missing theme color meta tag');
    }
    
  } else {
    console.log('❌ Layout file not found');
  }
} catch (error) {
  console.log('❌ Error checking layout:', error);
}

// Check 4: Mobile-specific icons
console.log('\n4️⃣ Mobile Icons Check:');
try {
  const fs = await import('fs');
  const iconsDir = './public/icons';
  
  if (fs.existsSync(iconsDir)) {
    const iconFiles = fs.readdirSync(iconsDir);
    
    // Check for mobile-specific icon files
    const mobileIcons = [
      'icon-192x192.svg',
      'icon-512x512.svg',
      'apple-touch-icon.png',
      'favicon.ico'
    ];
    
    mobileIcons.forEach(icon => {
      if (iconFiles.includes(icon)) {
        console.log(`✅ Has ${icon}`);
      } else {
        console.log(`⚠️  Missing ${icon}`);
      }
    });
    
  } else {
    console.log('❌ Icons directory not found');
  }
} catch (error) {
  console.log('❌ Error checking icons:', error);
}

console.log('\n📱 Mobile PWA Installation Guide:');
console.log('1. **Android (Chrome)**:');
console.log('   - Open Chrome browser');
console.log('   - Navigate to app URL');
console.log('   - Look for "Add to Home screen" banner OR');
console.log('   - Tap menu (⋮) → "Add to Home screen"');
console.log('   - Confirm installation');

console.log('\n2. **iOS (Safari)**:');
console.log('   - Open Safari browser');
console.log('   - Navigate to app URL');
console.log('   - Tap Share icon (□↑)');
console.log('   - Select "Add to Home Screen"');
console.log('   - Confirm installation');

console.log('\n3. **Troubleshooting Mobile Installation**:');
console.log('   - Ensure HTTPS (localhost works for development)');
console.log('   - Clear browser data and refresh');
console.log('   - Interact with the app before trying to install');
console.log('   - Check browser console for errors');
console.log('   - Verify service worker is registered');

console.log('\n📊 Mobile PWA Testing Checklist:');
console.log('□ App loads correctly on mobile browsers');
console.log('□ Responsive design works on small screens');
console.log('□ Touch interactions work properly');
console.log('□ Install prompt appears on mobile browsers');
console.log('□ App installs successfully on mobile');
console.log('□ App launches in standalone mode on mobile');
console.log('□ Offline functionality works on mobile');
console.log('□ Push notifications work on mobile (if implemented)');

console.log('\n🔧 If Mobile Installation Fails:');
console.log('1. Check browser compatibility (Chrome for Android, Safari for iOS)');
console.log('2. Verify HTTPS connection (required for production)');
console.log('3. Test with different mobile browsers');
console.log('4. Check mobile-specific console errors');
console.log('5. Verify manifest and service worker are accessible');
console.log('6. Test with mobile device emulation in Chrome DevTools');

console.log('\n✅ Mobile PWA setup analysis complete!');
