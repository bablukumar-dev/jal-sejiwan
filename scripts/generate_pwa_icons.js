const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateAndVerifyAllIcons() {
  const dir = path.join(process.cwd(), 'public', 'icons');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const logoSvg = path.join(process.cwd(), 'public', 'logo.svg');
  const logoMaskableSvg = path.join(process.cwd(), 'public', 'logo-maskable.svg');

  console.log('Generating full suite of PWA & TWA icons...');

  // Standard icons
  const standardSizes = [32, 48, 64, 192, 256, 384, 512, 1024];
  for (const size of standardSizes) {
    await sharp(logoSvg)
      .resize(size, size)
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(path.join(dir, `icon-${size}x${size}.png`));
  }

  // Maskable icons
  const maskableSizes = [192, 512];
  for (const size of maskableSizes) {
    await sharp(logoMaskableSvg)
      .resize(size, size)
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(path.join(dir, `icon-maskable-${size}x${size}.png`));
  }

  // Alias maskable
  await sharp(logoMaskableSvg)
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(dir, 'maskable-icon-512x512.png'));

  // Apple touch icon (180x180)
  await sharp(logoMaskableSvg)
    .resize(180, 180)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(dir, 'apple-touch-icon.png'));

  // MS Tile icon (150x150)
  await sharp(logoMaskableSvg)
    .resize(150, 150)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(dir, 'mstile-150x150.png'));

  // Favicon 32x32 PNG in public root
  await sharp(logoSvg)
    .resize(32, 32)
    .png({ quality: 100 })
    .toFile(path.join(process.cwd(), 'public', 'favicon.png'));

  console.log('\n--- VERIFICATION OF ALL GENERATED PWA ICONS ---');
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const filePath = path.join(dir, f);
    const stat = fs.statSync(filePath);
    const meta = await sharp(filePath).metadata();
    console.log(`[VALID] ${f.padEnd(30)} | ${stat.size.toString().padStart(6)} bytes | ${meta.width}x${meta.height} | ${meta.format.toUpperCase()} | alpha: ${meta.hasAlpha}`);
  }
}

generateAndVerifyAllIcons().catch(err => {
  console.error('Failed to generate PWA icons:', err);
  process.exit(1);
});
