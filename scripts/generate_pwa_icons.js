const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateAndVerify() {
  const dir = path.join(process.cwd(), 'public', 'icons');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const logoSvg = path.join(process.cwd(), 'public', 'logo.svg');
  const logoMaskableSvg = path.join(process.cwd(), 'public', 'logo-maskable.svg');

  console.log('Generating PWA Icons from SVGs...');

  // 1. Standard icon-192x192.png
  await sharp(logoSvg)
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(dir, 'icon-192x192.png'));

  // 2. Standard icon-512x512.png
  await sharp(logoSvg)
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(dir, 'icon-512x512.png'));

  // 3. Apple Touch Icon (180x180)
  await sharp(logoMaskableSvg)
    .resize(180, 180)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(dir, 'apple-touch-icon.png'));

  // 4. maskable-icon-512x512.png (512x512)
  await sharp(logoMaskableSvg)
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(dir, 'maskable-icon-512x512.png'));

  // 5. icon-maskable-512x512.png (512x512)
  await sharp(logoMaskableSvg)
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(dir, 'icon-maskable-512x512.png'));

  // 6. icon-maskable-192x192.png (192x192)
  await sharp(logoMaskableSvg)
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(dir, 'icon-maskable-192x192.png'));

  console.log('\n--- VERIFICATION OF GENERATED PWA ICONS ---');
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const filePath = path.join(dir, f);
    const stat = fs.statSync(filePath);
    const meta = await sharp(filePath).metadata();
    console.log(`[VALID] ${f.padEnd(28)} | ${stat.size.toString().padStart(6)} bytes | ${meta.width}x${meta.height} | ${meta.format.toUpperCase()} | alpha: ${meta.hasAlpha}`);
  }
}

generateAndVerify().catch(err => {
  console.error('Failed to generate PWA icons:', err);
  process.exit(1);
});
