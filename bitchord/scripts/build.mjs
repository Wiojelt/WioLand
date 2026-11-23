import { readFile, writeFile, mkdir } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const sources = JSON.parse(await readFile(new URL('sources.json', root), 'utf8'));
const runtime = await readFile(new URL('scripts/module-runtime.js', root), 'utf8');

const modules = [];
await mkdir(new URL('modules/', root), { recursive: true });

const logoUrl = 'https://raw.githubusercontent.com/Wiojelt/WioLand/main/bitchord/logo.svg';

for (const s of sources) {
  const file = `modules/${s.id}.js`;
  const code = `(function () {\n'use strict';\nvar config = ${JSON.stringify(s)};\n${runtime}\n})();\n`;
  await writeFile(new URL(file, root), code);

  modules.push({
    id: `wiojelt-${s.id}`,
    name: s.name,
    author: 'WioJelt',
    version: '0.3.0',
    code: 5,
    type: 'MODULE',
    download: file,
    trusted: false,
    logo: logoUrl,
    icon: logoUrl,
    tags: ['lossless', 'flac', 'hi-res'],
    labels: ['lossless', 'flac', 'hi-res']
  });
}

const manifest = {
  id: 'art.wiochord.lossless',
  name: '⚡ Wiochord Lossless ⚡',
  title: '⚡ Wiochord Lossless ⚡',
  displayName: '⚡ Wiochord Lossless ⚡',
  description: 'Multi-catalog lossless and Hi-Res music modules with automatic failover',
  version: '1.3.0',
  logo: logoUrl,
  icon: logoUrl,
  checkValidLossless: 0,
  allowDownloads: 1,
  'category:music': modules
};

await writeFile(new URL('manifest.json', root), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Successfully built ${modules.length} modules and manifest.json`);
