import { createServer } from 'node:http';
import { createHash, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { createProvider, validateStream } from './providers.mjs';

export const manifest = {
  id: 'art.wiojelt.bitchord', name: 'WioJelt Hi-Res', version: '0.1.0',
  resources: ['search', 'stream'], allowDownloads: 1, checkValidLossless: 1,
  settings: [{ key: 'quality', type: 'select', default: 'lossless', options: [
    { label: 'Hi-Res / Lossless', value: 'lossless' }, { label: 'High', value: 'high' }, { label: 'Low', value: 'low' },
  ] }],
};
export const encodeId = (source, id) => Buffer.from(JSON.stringify([source, String(id)])).toString('base64url');
export function decodeId(value) {
  if (value.length > 2048 || !/^[\w-]+$/.test(value)) throw new Error('Invalid ID');
  const v = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
  if (!Array.isArray(v) || v.length !== 2 || !v.every(x => typeof x === 'string' && x.length && x.length <= 512)) throw new Error('Invalid ID');
  return v;
}
function recordingKey(t) {
  // Conservative grouping: preserve editions, Atmos mixes and distinct durations.
  const norm = x => String(x || '').normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
  return JSON.stringify([norm(t.title), norm(t.artist), norm(t.album), Number(t.duration).toFixed(0), Boolean(t.atmos), t.audioModes || []]);
}
function boundedSet(map, key, value, max) {
  map.delete(key); map.set(key, value);
  while (map.size > max) map.delete(map.keys().next().value);
}
export function createApp(providers, env = process.env) {
  const byId = new Map(providers.map(p => [p.id, p]));
  const candidates = new Map(), searches = new Map(), dash = new Map();
  const prefix = env.ACCESS_TOKEN ? `/${encodeURIComponent(env.ACCESS_TOKEN)}` : '';
  const publicURL = (env.PUBLIC_URL || env.RENDER_EXTERNAL_URL || '').replace(/\/$/, '');
  if (publicURL && new URL(publicURL).protocol !== 'https:') throw new Error('PUBLIC_URL must use HTTPS');
  async function search(q) {
    const key = JSON.stringify(q), cached = searches.get(key);
    if (cached?.until > Date.now()) return cached.value;
    const batches = await Promise.allSettled(providers.filter(p => p.configured).map(async p => ({ p, rows: await p.search(q) })));
    const groups = new Map();
    let successful = 0;
    for (const batch of batches) {
      if (batch.status !== 'fulfilled') continue;
      successful++;
      const { p, rows } = batch.value;
      if (!Array.isArray(rows)) continue;
      for (const row of rows.slice(0, 15)) {
        if (row.id == null || !row.title || !String(row.id).length) continue;
        const ref = [p.id, String(row.id)];
        const id = encodeId(...ref);
        if (id.length > 2048) continue;
        const k = recordingKey(row);
        let group = groups.get(k);
        if (!group) {
          // Direct fallback URLs would bypass this server's stream validation.
          const { streamURL, ...metadata } = row;
          group = { track: { ...metadata, id, source: p.name }, refs: [] };
          groups.set(k, group);
        }
        group.refs.push(ref);
      }
    }
    if (!successful) throw Object.assign(new Error('All sources unavailable'), { status: 503 });
    const tracks = [...groups.values()].slice(0, 100).map(g => {
      boundedSet(candidates, g.track.id, { refs: g.refs, until: Date.now() + 1_800_000 }, 3000);
      return g.track;
    });
    const value = { tracks };
    boundedSet(searches, key, { value, until: Date.now() + 20_000 }, 100);
    return value;
  }
  async function resolve(id, q) {
    const original = decodeId(id);
    const entry = candidates.get(id);
    const refs = entry?.until > Date.now() ? entry.refs : [original];
    for (const [source, trackId] of refs) {
      const p = byId.get(source);
      if (!p?.configured) continue;
      try {
        let s = await p.stream(trackId, q);
        if (s.xml) {
          if (!publicURL) continue;
          const key = createHash('sha256').update(s.xml).digest('hex');
          boundedSet(dash, key, { xml: s.xml, until: Date.now() + 600_000 }, 200);
          const { xml, ...metadata } = s;
          s = { ...metadata, url: `${publicURL}${prefix}/dash/${key}.mpd` };
        }
        return validateStream(s);
      } catch { /* Try only candidates with matching recording metadata. */ }
    }
    throw Object.assign(new Error('No playable rendition from the matched sources'), { status: 404 });
  }
  return createServer(async (req, res) => {
    function send(status, body, type = 'application/json; charset=utf-8') {
      res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...(status === 503 ? { 'Retry-After': '30' } : {}) });
      res.end(type.startsWith('application/json') ? JSON.stringify(body) : body);
    }
    try {
      if (req.method !== 'GET') return send(405, { error: 'GET required' });
      const u = new URL(req.url, 'http://localhost');
      let path = u.pathname;
      if (prefix) {
        const part = path.slice(0, prefix.length);
        if (part.length !== prefix.length || !timingSafeEqual(Buffer.from(part), Buffer.from(prefix)) || (path[prefix.length] && path[prefix.length] !== '/')) return send(404, { error: 'Not found' });
        path = path.slice(prefix.length) || '/';
      }
      if (path === '/' || path === '/manifest.json') return send(200, manifest);
      if (path === '/health') return send(200, { version: manifest.version, providers: providers.map(p => p.status()) });
      const q = Object.fromEntries(['q', 'quality', 'atmos'].filter(k => u.searchParams.has(k)).map(k => [k, u.searchParams.get(k)]));
      if ((q.quality?.length || 0) > 64 || (q.atmos?.length || 0) > 16) return send(400, { error: 'Invalid playback parameters' });
      if (path === '/search') {
        if (!q.q?.trim() || q.q.length > 256 || u.search.length > 4096) return send(400, { error: 'q must contain 1–256 characters' });
        return send(200, await search({ ...q, q: q.q.trim() }));
      }
      if (path.startsWith('/stream/')) {
        const id = decodeURIComponent(path.slice(8));
        try { decodeId(id); } catch { return send(400, { error: 'Invalid track ID' }); }
        return send(200, await resolve(id, q));
      }
      if (/^\/dash\/[a-f0-9]{64}\.mpd$/.test(path)) {
        const d = dash.get(path.slice(6, -4));
        if (d?.until > Date.now()) return send(200, d.xml, 'application/dash+xml');
      }
      return send(404, { error: 'Not found' });
    } catch (e) { return send(e.status || 500, { error: e.status ? e.message : 'Request failed' }); }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let file = new URL('./sources.json', import.meta.url);
  try { await readFile(new URL('./sources.local.json', import.meta.url)); file = new URL('./sources.local.json', import.meta.url); } catch {}
  const sources = JSON.parse(await readFile(file, 'utf8'));
  const ids = new Set();
  for (const s of sources) { if (!s.id || ids.has(s.id)) throw new Error('Duplicate or empty source ID'); ids.add(s.id); }
  const providers = sources.filter(s => s.enabled !== false).map(s => createProvider(s));
  const server = createApp(providers);
  server.listen(Number(process.env.PORT || 8787), process.env.HOST || '127.0.0.1', () => console.log('WioJelt BitChord addon listening on port', server.address().port));
  for (const event of ['SIGINT', 'SIGTERM']) process.on(event, () => server.close());
}
