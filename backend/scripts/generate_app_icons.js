const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outputDir = path.join(__dirname, '../public/app-icons');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Path to illustrations in flutter_mobile
const illustrationsDir = path.join(__dirname, '../../flutter_mobile/assets/illustrations');

const icons = [
  {
    name: 'teachers.png',
    source: path.join(illustrationsDir, 'teacher.jpg'),
    title: 'Teachers',
    bgColor: '#EA4335',
    bannerGradient: ['#E11D48', '#BE123C'],
    cropExtract: { top: 60, left: 160, width: 700, height: 700 }
  },
  {
    name: 'classes.png',
    source: path.join(illustrationsDir, 'classes.jpg'),
    title: 'Classes',
    bgColor: '#34A853',
    bannerGradient: ['#16A34A', '#15803D'],
    cropExtract: { top: 120, left: 120, width: 780, height: 780 }
  },
  {
    name: 'collect fee.png',
    source: path.join(illustrationsDir, 'fees.jpg'),
    title: 'Collect Fee',
    bgColor: '#FBBC05',
    bannerGradient: ['#EA580C', '#C2410C'],
    cropExtract: { top: 140, left: 100, width: 820, height: 820 }
  },
  {
    name: 'installments.png',
    source: path.join(illustrationsDir, 'payment.jpg'),
    title: 'Installments',
    bgColor: '#00ACC1',
    bannerGradient: ['#0284C7', '#0369A1'],
    cropExtract: { top: 120, left: 120, width: 780, height: 780 }
  },
  {
    name: 'transactions.png',
    source: path.join(illustrationsDir, 'revenue.jpg'),
    title: 'Transactions',
    bgColor: '#FF7043',
    bannerGradient: ['#E11D48', '#BE185D'],
    cropExtract: { top: 200, left: 100, width: 820, height: 820 }
  },
  {
    name: 'subjects.png',
    source: path.join(illustrationsDir, 'exams.jpg'),
    title: 'Subjects',
    bgColor: '#7CB342',
    bannerGradient: ['#65A30D', '#4D7C0F'],
    cropExtract: { top: 160, left: 80, width: 860, height: 860 }
  },
  {
    name: 'app installs.png',
    source: null, // Custom generated 3D mobile icon
    title: 'App Installs',
    bgColor: '#673AB7',
    bannerGradient: ['#7C3AED', '#6D28D9']
  }
];

function buildBannerSvg(title, color1, color2) {
  return Buffer.from(`
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${color1}" />
          <stop offset="100%" stop-color="${color2}" />
        </linearGradient>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.35"/>
        </filter>
      </defs>
      <!-- Bottom wave / banner -->
      <path d="M 0,195 Q 128,175 256,195 L 256,256 L 0,256 Z" fill="url(#grad)" />
      <!-- Subtle top highlight on banner -->
      <path d="M 0,195 Q 128,175 256,195" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2.5" />
      <!-- Centered bold title text -->
      <text x="128" y="234" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="25" fill="#FFFFFF" letter-spacing="0.2" filter="url(#shadow)">
        ${title}
      </text>
    </svg>
  `);
}

function buildAppInstallsSvg(title, color1, color2) {
  return Buffer.from(`
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#F5F3FF" />
          <stop offset="100%" stop-color="#EDE9FE" />
        </linearGradient>
        <linearGradient id="bannerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${color1}" />
          <stop offset="100%" stop-color="${color2}" />
        </linearGradient>
        <linearGradient id="phoneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#8B5CF6" />
          <stop offset="100%" stop-color="#6D28D9" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-opacity="0.25"/>
        </filter>
      </defs>
      <!-- Background -->
      <rect width="256" height="256" rx="56" fill="url(#bgGrad)" />
      
      <!-- 3D Smartphone illustration -->
      <g filter="url(#shadow)">
        <!-- Phone body -->
        <rect x="73" y="24" width="110" height="155" rx="20" fill="url(#phoneGrad)" />
        <!-- Screen -->
        <rect x="81" y="36" width="94" height="131" rx="14" fill="#FFFFFF" />
        <!-- Notch -->
        <rect x="110" y="29" width="36" height="4" rx="2" fill="rgba(255,255,255,0.7)" />
        
        <!-- App Icon on Screen (JY Logo simulation) -->
        <rect x="98" y="55" width="60" height="60" rx="14" fill="#6366F1" />
        <circle cx="128" cy="85" r="18" fill="#FBBF24" />
        <path d="M 120,85 L 128,75 L 136,85 Z" fill="#FFFFFF" />
        
        <!-- Download Arrow badge -->
        <circle cx="128" cy="140" r="16" fill="#10B981" />
        <path d="M 128,132 L 128,145 M 123,141 L 128,146 L 133,141" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      </g>
      
      <!-- Bottom wave / banner -->
      <path d="M 0,195 Q 128,175 256,195 L 256,256 L 0,256 Z" fill="url(#bannerGrad)" />
      <path d="M 0,195 Q 128,175 256,195" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2.5" />
      <text x="128" y="234" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="23" fill="#FFFFFF" letter-spacing="0.2">
        ${title}
      </text>
    </svg>
  `);
}

async function generate() {
  console.log('Generating 3D app icons...');

  for (const item of icons) {
    const destPath = path.join(outputDir, item.name);

    if (!item.source) {
      // Generate directly from SVG
      const svgBuffer = buildAppInstallsSvg(item.title, item.bannerGradient[0], item.bannerGradient[1]);
      await sharp(svgBuffer)
        .resize(256, 256)
        .png()
        .toFile(destPath);
      console.log(`Generated: ${item.name}`);
      continue;
    }

    if (!fs.existsSync(item.source)) {
      console.warn(`Source not found: ${item.source}, skipping ${item.name}`);
      continue;
    }

    // Process illustration: extract center crop, resize to 256x256, overlay banner
    const bannerSvg = buildBannerSvg(item.title, item.bannerGradient[0], item.bannerGradient[1]);

    await sharp(item.source)
      .extract(item.cropExtract)
      .resize(256, 256, { fit: 'cover' })
      .composite([
        {
          input: bannerSvg,
          top: 0,
          left: 0
        }
      ])
      .png()
      .toFile(destPath);

    console.log(`Generated: ${item.name}`);
  }

  console.log('All icons generated successfully in:', outputDir);
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});

