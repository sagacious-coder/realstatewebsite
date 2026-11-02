import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, '..');
const panelsDir = path.join(webRoot, 'public/images/panels');

if (!fs.existsSync(panelsDir)) {
  fs.mkdirSync(panelsDir, { recursive: true });
}

// Curated high-resolution editorial luxury photographs from Unsplash (all native 3000px+ portrait)
const PANELS = [
  {
    code: 'ae',
    legacy: 'uae',
    name: 'UAE (Dubai Marina Waterfront Skyline at Dusk)',
    photoId: 'photo-1518684079-3c830dcef090',
  },
  {
    code: 'tr',
    legacy: 'turkey',
    name: 'Turkey (Istanbul Bosphorus Waterfront Sunset)',
    photoId: 'photo-1527838832700-5059252407fa',
  },
  {
    code: 'ge',
    legacy: 'georgia',
    name: 'Georgia (Modern Architectural Hillside Villa & Pool)',
    photoId: 'photo-1600585154526-990dced4db0d',
  },
  {
    code: 'eg',
    legacy: 'egypt',
    name: 'Egypt (Red Sea Luxury Waterfront Resort Villa & Turquoise Waters)',
    photoId: 'photo-1571003123894-1f0594d2b5d9',
  },
];

const TARGET_WIDTH = 1400;
const TARGET_HEIGHT = 2000;

async function downloadAndProcess() {
  console.log(`Starting CountryChooser panels download & optimization (Target: ${TARGET_WIDTH}x${TARGET_HEIGHT} WebP, quality=90)...`);

  const results = [];

  for (const panel of PANELS) {
    const url = `https://images.unsplash.com/${panel.photoId}?q=95&w=2400&auto=format`;
    console.log(`\nFetching ${panel.name}...`);
    console.log(`URL: ${url}`);

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch ${panel.code}: ${res.status} ${res.statusText}`);
    }

    const inputBuffer = Buffer.from(await res.arrayBuffer());
    const sourceMeta = await sharp(inputBuffer).metadata();
    console.log(`Source dimensions: ${sourceMeta.width}x${sourceMeta.height} (${sourceMeta.format})`);

    // Crop & resize to 1400x2000 portrait with center focal alignment
    const outputBuffer = await sharp(inputBuffer)
      .resize({
        width: TARGET_WIDTH,
        height: TARGET_HEIGHT,
        fit: 'cover',
        position: 'center',
      })
      .webp({
        quality: 90,
        effort: 6,
      })
      .toBuffer();

    // Generate tiny blur placeholder for smooth loading (32px wide)
    const blurBuffer = await sharp(outputBuffer)
      .resize(32, Math.round(32 * (TARGET_HEIGHT / TARGET_WIDTH)))
      .webp({ quality: 20 })
      .toBuffer();
    const blurDataURL = `data:image/webp;base64,${blurBuffer.toString('base64')}`;

    const filenameCode = `panel-${panel.code}.webp`;
    const filenameLegacy = `panel-${panel.legacy}.webp`;

    const destCode = path.join(panelsDir, filenameCode);
    const destLegacy = path.join(panelsDir, filenameLegacy);

    fs.writeFileSync(destCode, outputBuffer);
    fs.writeFileSync(destLegacy, outputBuffer);

    const sizeKB = (outputBuffer.length / 1024).toFixed(1);
    console.log(`Saved ${filenameCode} & ${filenameLegacy} (${sizeKB} KB, ${TARGET_WIDTH}x${TARGET_HEIGHT})`);

    results.push({
      code: panel.code,
      legacy: panel.legacy,
      filenameCode,
      filenameLegacy,
      sizeBytes: outputBuffer.length,
      sizeKB: parseFloat(sizeKB),
      blurDataURL,
    });
  }

  // Update image-manifest.ts with new entries
  const manifestPath = path.join(webRoot, 'lib/image-manifest.ts');
  if (fs.existsSync(manifestPath)) {
    let manifestContent = fs.readFileSync(manifestPath, 'utf8');

    for (const r of results) {
      const keys = [`/images/panels/${r.filenameCode}`, `/images/panels/${r.filenameLegacy}`];
      for (const key of keys) {
        const entryStr = `  "${key}": {
    "path": "${key}",
    "width": ${TARGET_WIDTH},
    "height": ${TARGET_HEIGHT},
    "format": "webp",
    "sizeBytes": ${r.sizeBytes},
    "sizeKB": ${r.sizeKB},
    "budgetKB": 250,
    "overBudget": false,
    "is_sample": false,
    "is_placeholder_image": false,
    "blurDataURL": "${r.blurDataURL}"
  }`;

        // Check if key exists in manifest
        const regex = new RegExp(`\\s*"${key}":\\s*{[\\s\\S]*?}`, 'g');
        if (regex.test(manifestContent)) {
          manifestContent = manifestContent.replace(regex, entryStr);
        } else {
          // Insert after export const imageManifest: Record<string, ImageManifestEntry> = {
          const insertMarker = 'export const imageManifest: Record<string, ImageManifestEntry> = {';
          manifestContent = manifestContent.replace(
            insertMarker,
            `${insertMarker}\n${entryStr},`
          );
        }
      }
    }

    fs.writeFileSync(manifestPath, manifestContent, 'utf8');
    console.log('\nUpdated apps/web/lib/image-manifest.ts with high-res dimensions and blur placeholders.');
  }

  console.log('\nAll CountryChooser panel images downloaded and processed successfully!');
}

downloadAndProcess().catch((err) => {
  console.error('Error downloading panels:', err);
  process.exit(1);
});
