const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function syncAllIcons() {
  const publicDir = path.join(process.cwd(), 'public');
  const iconsDir = path.join(publicDir, 'icons');

  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  const logoSvg = path.join(publicDir, 'logo.svg');
  const logoMaskableSvg = path.join(publicDir, 'logo-maskable.svg');

  console.log('Generating complete suite of icons for /public and /public/icons...');

  // 1. Generate icons in /public/icons/
  const sizes = [16, 32, 48, 64, 192, 256, 384, 512, 1024];
  for (const s of sizes) {
    await sharp(logoSvg)
      .resize(s, s)
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(path.join(iconsDir, `icon-${s}x${s}.png`));
  }

  // Maskables
  await sharp(logoMaskableSvg)
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(iconsDir, 'icon-maskable-192x192.png'));

  await sharp(logoMaskableSvg)
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(iconsDir, 'icon-maskable-512x512.png'));

  await sharp(logoMaskableSvg)
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(iconsDir, 'maskable-icon-512x512.png'));

  await sharp(logoMaskableSvg)
    .resize(180, 180)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'));

  await sharp(logoMaskableSvg)
    .resize(150, 150)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(iconsDir, 'mstile-150x150.png'));

  // 2. Generate root level icons in /public/ directly (for crawlers checking root paths)
  await sharp(logoMaskableSvg)
    .resize(180, 180)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  await sharp(logoMaskableSvg)
    .resize(180, 180)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'apple-touch-icon-precomposed.png'));

  await sharp(logoSvg)
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'icon-192x192.png'));

  await sharp(logoSvg)
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'icon-512x512.png'));

  await sharp(logoSvg)
    .resize(16, 16)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'favicon-16x16.png'));

  await sharp(logoSvg)
    .resize(32, 32)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'favicon-32x32.png'));

  await sharp(logoSvg)
    .resize(32, 32)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'favicon.png'));

  console.log('\n--- VERIFYING ALL CREATED ICONS ---');
  const allIconPaths = [
    'public/favicon.ico',
    'public/favicon.png',
    'public/favicon-16x16.png',
    'public/favicon-32x32.png',
    'public/apple-touch-icon.png',
    'public/apple-touch-icon-precomposed.png',
    'public/icon-192x192.png',
    'public/icon-512x512.png',
    'public/icons/icon-192x192.png',
    'public/icons/icon-512x512.png',
    'public/icons/icon-1024x1024.png',
    'public/icons/icon-maskable-192x192.png',
    'public/icons/icon-maskable-512x512.png',
    'public/icons/maskable-icon-512x512.png',
    'public/icons/apple-touch-icon.png'
  ];

  for (const p of allIconPaths) {
    if (!fs.existsSync(p)) {
      console.error(`❌ FAILED: ${p} does not exist`);
    } else {
      const stat = fs.statSync(p);
      try {
        const meta = await sharp(p).metadata();
        console.log(`[OK] ${p.padEnd(42)} | ${stat.size.toString().padStart(6)} bytes | ${meta.width}x${meta.height} | format: ${meta.format.toUpperCase()}`);
      } catch {
        console.log(`[OK - Binary] ${p.padEnd(35)} | ${stat.size} bytes`);
      }
    }
  }
}

syncAllIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
