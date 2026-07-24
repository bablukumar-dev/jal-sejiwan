const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateScreenshots() {
  const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // 1. Wide Screenshot (1280x720) - Desktop Dashboard Mockup
  const wideSvg = `
  <svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
    <rect width="1280" height="720" fill="#0f172a" />
    <!-- Top Navigation Bar -->
    <rect width="1280" height="64" fill="#1e293b" />
    <circle cx="40" cy="32" r="16" fill="#0284c7" />
    <path d="M 40,22 C 40,22 30,35 30,41 C 30,46 34,50 40,50 C 46,50 50,46 50,41 C 50,35 40,22 40,22 Z" fill="#ffffff" transform="scale(0.5) translate(40,16)" />
    <text x="70" y="38" fill="#ffffff" font-family="sans-serif" font-size="20" font-weight="bold">JalSejiwan Enterprise</text>

    <!-- Sidebar -->
    <rect y="64" width="220" height="656" fill="#1e293b" />
    <rect x="16" y="88" width="188" height="40" rx="8" fill="#0284c7" />
    <text x="36" y="113" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="600">Dashboard</text>
    <text x="36" y="160" fill="#94a3b8" font-family="sans-serif" font-size="14">Deliveries</text>
    <text x="36" y="200" fill="#94a3b8" font-family="sans-serif" font-size="14">Inventory</text>
    <text x="36" y="240" fill="#94a3b8" font-family="sans-serif" font-size="14">Customers</text>

    <!-- Main Content Grid -->
    <text x="260" y="112" fill="#ffffff" font-family="sans-serif" font-size="24" font-weight="bold">Water Management Dashboard</text>

    <!-- Stat Card 1 -->
    <rect x="260" y="140" width="220" height="110" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1" />
    <text x="280" y="170" fill="#94a3b8" font-family="sans-serif" font-size="12">TODAY'S DELIVERIES</text>
    <text x="280" y="210" fill="#38bdf8" font-family="sans-serif" font-size="32" font-weight="bold">142 Cans</text>

    <!-- Stat Card 2 -->
    <rect x="500" y="140" width="220" height="110" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1" />
    <text x="520" y="170" fill="#94a3b8" font-family="sans-serif" font-size="12">EMPTY BOTTLES</text>
    <text x="520" y="210" fill="#f59e0b" font-family="sans-serif" font-size="32" font-weight="bold">88 Pending</text>

    <!-- Stat Card 3 -->
    <rect x="740" y="140" width="220" height="110" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1" />
    <text x="760" y="170" fill="#94a3b8" font-family="sans-serif" font-size="12">COLLECTED PAYMENT</text>
    <text x="760" y="210" fill="#10b981" font-family="sans-serif" font-size="32" font-weight="bold">₹12,450</text>

    <!-- Main Table View Mockup -->
    <rect x="260" y="280" width="980" height="400" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1" />
    <text x="290" y="320" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold">Active Delivery Routes</text>
    
    <line x1="260" y1="340" x2="1240" y2="340" stroke="#334155" stroke-width="1" />
    <text x="290" y="370" fill="#94a3b8" font-family="sans-serif" font-size="13">Route #1 - Downtown Commercial</text>
    <text x="700" y="370" fill="#10b981" font-family="sans-serif" font-size="13">In Progress (85%)</text>
    <text x="1100" y="370" fill="#38bdf8" font-family="sans-serif" font-size="13">Staff: Rajesh K.</text>

    <line x1="260" y1="400" x2="1240" y2="400" stroke="#334155" stroke-width="1" />
    <text x="290" y="430" fill="#94a3b8" font-family="sans-serif" font-size="13">Route #2 - West Suburban Sector</text>
    <text x="700" y="430" fill="#f59e0b" font-family="sans-serif" font-size="13">Dispatched</text>
    <text x="1100" y="430" fill="#38bdf8" font-family="sans-serif" font-size="13">Staff: Vikram S.</text>
  </svg>
  `;

  await sharp(Buffer.from(wideSvg))
    .png({ quality: 100 })
    .toFile(path.join(screenshotsDir, 'desktop.png'));

  console.log('✓ Desktop wide screenshot created (1280x720)');

  // 2. Narrow Screenshot (540x960) - Mobile App Mockup
  const narrowSvg = `
  <svg width="540" height="960" viewBox="0 0 540 960" xmlns="http://www.w3.org/2000/svg">
    <rect width="540" height="960" fill="#0f172a" />
    <!-- Mobile Header -->
    <rect width="540" height="72" fill="#1e293b" />
    <circle cx="36" cy="36" r="16" fill="#0284c7" />
    <text x="64" y="42" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="bold">JalSejiwan Mobile</text>

    <!-- Mobile Body -->
    <text x="24" y="112" fill="#ffffff" font-family="sans-serif" font-size="20" font-weight="bold">Water Delivery Staff</text>

    <!-- Mobile Card 1 -->
    <rect x="24" y="136" width="492" height="140" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1" />
    <text x="44" y="170" fill="#38bdf8" font-family="sans-serif" font-size="14" font-weight="bold">NEXT STOP: A-102 Green Heights</text>
    <text x="44" y="196" fill="#94a3b8" font-family="sans-serif" font-size="13">Items: 5 Cans (20L)</text>
    <text x="44" y="220" fill="#94a3b8" font-family="sans-serif" font-size="13">Empty Return expected: 5 Cans</text>
    <rect x="44" y="236" width="120" height="28" rx="6" fill="#10b981" />
    <text x="64" y="255" fill="#ffffff" font-family="sans-serif" font-size="12" font-weight="bold">COMPLETE</text>

    <!-- Mobile Card 2 -->
    <rect x="24" y="296" width="492" height="140" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1" />
    <text x="44" y="330" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="bold">STOP #2: B-204 Sunshine Towers</text>
    <text x="44" y="356" fill="#94a3b8" font-family="sans-serif" font-size="13">Items: 2 Cans (20L)</text>
    <text x="44" y="380" fill="#94a3b8" font-family="sans-serif" font-size="13">Payment Mode: UPI Cash-on-Delivery</text>

    <!-- Bottom Navigation Bar -->
    <rect y="888" width="540" height="72" fill="#1e293b" />
    <circle cx="108" cy="924" r="16" fill="#0284c7" />
    <text x="100" y="950" fill="#ffffff" font-family="sans-serif" font-size="10">Home</text>
    <circle cx="270" cy="924" r="16" fill="#334155" />
    <text x="254" y="950" fill="#94a3b8" font-family="sans-serif" font-size="10">Deliveries</text>
    <circle cx="432" cy="924" r="16" fill="#334155" />
    <text x="418" y="950" fill="#94a3b8" font-family="sans-serif" font-size="10">Profile</text>
  </svg>
  `;

  await sharp(Buffer.from(narrowSvg))
    .png({ quality: 100 })
    .toFile(path.join(screenshotsDir, 'mobile.png'));

  console.log('✓ Mobile narrow screenshot created (540x960)');
}

generateScreenshots().catch(err => {
  console.error('Error generating PWA screenshots:', err);
  process.exit(1);
});
