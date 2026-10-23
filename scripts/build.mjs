import { readFile, writeFile, mkdir } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const sources = JSON.parse(await readFile(new URL('sources.json', root), 'utf8'));
const runtime = await readFile(new URL('scripts/module-runtime.js', root), 'utf8');
const modules = [];
await mkdir(new URL('modules/', root), { recursive: true });
for (const s of sources) {
  const file = `modules/${s.id}.js`;
  const code = `(function () {\n'use strict';\nvar config = ${JSON.stringify(s)};\n${runtime}\n})();\n`;
  await writeFile(new URL(file, root), code);
  modules.push({ id: `wiojelt-${s.id}`, name: s.name, author: 'WioJelt', version: '0.2.0', code: 4, type: 'MODULE', download: file, trusted: false });
}
const externalBase = 'https://raw.githubusercontent.com/OreoMuncher45/bitchord-streaming-modules/df97c0ca349fbf63007ad48199bf389004b3e1a9/modules/';
modules.unshift({ id: 'bitchord-tidal-flac', name: 'Monochrome FLAC', author: 'community', version: '0.4.0', code: 4, type: 'MODULE', download: externalBase + 'bitchord-tidal-flac.js', trusted: false });
modules.push({ id: 'archive-flac', name: 'Internet Archive FLAC', author: 'community', version: '1.0.0', code: 4, type: 'MODULE', download: externalBase + 'archive-flac.js', trusted: false });
const manifest = { id: 'art.wiojelt.bitchord.modules', name: 'WioJelt Hi-Res', version: '0.2.0', checkValidLossless: 0, allowDownloads: 1, 'category:music': modules };
await writeFile(new URL('manifest.json', root), JSON.stringify(manifest, null, 2) + '\n');
console.log(`${modules.length} modules`);
