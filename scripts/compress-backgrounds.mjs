import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const sourceDir = path.resolve(root, '..', 'MYBOTSTV', 'public');
const embedBgDir = path.join(root, 'avatar-embed', 'backgrounds');
const rnBgDir = path.join(root, 'assets', 'avatar-backgrounds');

const SELECTED = [
  { file: 'bg_nyc2.jpg',     label: 'New York' },
  { file: 'bg_dubai.jpg',    label: 'Dubai' },
  { file: 'bg_hongkong.jpg', label: 'Hong Kong' },
  { file: 'bg_beijing.jpg',  label: 'Beijing' },
  { file: 'bg_munich.jpg',   label: 'Munich' },
  { file: 'bg_glasgow.jpg',  label: 'Glasgow' },
  { file: 'bg_honolulu.jpg', label: 'Honolulu' },
  { file: 'bg_spaceship.jpg',label: 'Spaceship' },
];

for (const { file } of SELECTED) {
  const src = path.join(sourceDir, file);
  if (!fs.existsSync(src)) {
    console.warn(`SKIP (not found): ${file}`);
    continue;
  }
  const destEmbed = path.join(embedBgDir, file);
  const destRN = path.join(rnBgDir, file);

  await sharp(src)
    .resize({ width: 1280, withoutEnlargement: true })
    .jpeg({ quality: 60, progressive: true })
    .toFile(destEmbed);

  fs.copyFileSync(destEmbed, destRN);

  const sizeKB = Math.round(fs.statSync(destEmbed).size / 1024);
  const flag = sizeKB > 250 ? '  *** OVER 250KB ***' : '';
  console.log(`[compress] ${file} → ${sizeKB}KB${flag}`);
}

console.log('\nDone. Verifying sizes:');
fs.readdirSync(embedBgDir)
  .filter(f => f.startsWith('bg_') && f.endsWith('.jpg'))
  .forEach(f => {
    const s = fs.statSync(path.join(embedBgDir, f)).size;
    console.log(`  ${f}: ${Math.round(s / 1024)}KB ${s > 256000 ? 'OVER BUDGET' : 'OK'}`);
  });
