import { createHash } from 'node:crypto';

export class UpstreamError extends Error {
  constructor(status, retryAfter = 0) { super(`Upstream HTTP ${status}`); this.status = status; this.retryAfter = retryAfter; }
}
export async function getJSON(url, headers = {}) {
  const r = await fetch(url, { headers: { Accept: 'application/json', ...headers }, signal: AbortSignal.timeout(5500) });
  if (!r.ok) { await r.body?.cancel(); throw new UpstreamError(r.status, Number(r.headers.get('retry-after')) || 60); }
  // Bound untrusted provider responses, including chunked responses.
  let size = 0; const parts = [];
  for await (const chunk of r.body) {
    size += chunk.length;
    if (size > 2_000_000) throw new Error('Provider response too large');
    parts.push(chunk);
  }
  return JSON.parse(Buffer.concat(parts).toString('utf8'));
}
export function baseURL(value) {
  const u = new URL(value);
  if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password) throw new Error('Invalid source URL');
  u.pathname = u.pathname.replace(/\/manifest\.json\/?$/, '').replace(/\/$/, '');
  return u.toString().replace(/\/$/, '');
}
export function endpoint(base, path, params = {}) {
  const u = new URL(base);
  u.pathname = u.pathname.replace(/\/$/, '') + path;
  for (const [k, v] of Object.entries(params)) if (v !== undefined) u.searchParams.set(k, String(v));
  return u;
}
function mediaURL(url) { const u = new URL(url); if (u.protocol !== 'https:') throw new Error('Non-HTTPS media'); return u.href; }
export function validateStream(s) {
  if (!s || s.encrypted === true || s.encrypted === 1 || s.encrypted === 'true') throw new Error('Protected or missing rendition');
  return { ...s, url: mediaURL(s.url) };
}
export function flacInfo(bytes) {
  if (bytes.length < 42 || bytes.subarray(0, 4).toString() !== 'fLaC' || (bytes[4] & 127) !== 0) return {};
  const info = bytes.readBigUInt64BE(18);
  return { codec: 'flac', container: 'flac', format: 'flac', mimeType: 'audio/flac',
    sampleRate: Number(info >> 44n), bitDepth: Number((info >> 36n) & 31n) + 1 };
}
async function inspectDirect(url) {
  const r = await fetch(url, { headers: { Range: 'bytes=0-63' }, signal: AbortSignal.timeout(5500) });
  if (!r.ok) { await r.body?.cancel(); throw new UpstreamError(r.status); }
  const reader = r.body.getReader(); let bytes = Buffer.alloc(0);
  try {
    while (bytes.length < 64) { const chunk = await reader.read(); if (chunk.done) break; bytes = Buffer.concat([bytes, Buffer.from(chunk.value).subarray(0, 64 - bytes.length)]); }
  } finally { await reader.cancel(); }
  const mimeType = r.headers.get('content-type')?.split(';')[0];
  if (mimeType?.includes('text') || mimeType?.includes('json')) throw new Error('Provider returned a document instead of audio');
  return { mimeType, ...flacInfo(bytes) };
}
function mapTrack(t, modern = false) {
  const names = t.artistNames || t.artists?.map(a => a.name);
  const image = t.album?.cover;
  return {
    id: String(t.id ?? t.trackId ?? ''), title: t.title || t.name || '',
    artist: names?.join(', ') || t.performer?.name || t.artist?.name || t.artist || '',
    album: t.album?.title || (typeof t.album === 'string' ? t.album : ''),
    duration: modern ? Number(t.duration) / 1000 : Number(t.duration),
    artworkURL: t.artwork || t.artworkURL || t.album?.image?.large || (image ? `https://resources.tidal.com/images/${image.replaceAll('-', '/')}/640x640.jpg` : undefined),
    isrc: t.isrc, audioQuality: t.audioQuality,
    audioModes: t.audioModes, atmos: t.audioModes?.includes('DOLBY_ATMOS') || undefined,
  };
}
export function decodeHiFi(data) {
  const t = data.data || data;
  if (t.assetPresentation === 'PREVIEW' || t.sample === true) throw new Error('Preview rendition');
  const raw = Buffer.from(t.manifest || '', 'base64').toString('utf8').trim();
  if (raw.startsWith('<')) {
    if (!/<MPD[\s>]/i.test(raw) || /ContentProtection|<\s*!DOCTYPE|<\s*!ENTITY/i.test(raw)) throw new Error('Protected or invalid DASH');
    // Relative segment templates need an absolute BaseURL to survive relocation.
    const absoluteBase = /<BaseURL[^>]*>\s*https:\/\//i.test(raw);
    for (const m of raw.matchAll(/(?:media|initialization)="([^"]+)"/g)) {
      if (!m[1].startsWith('https://') && !absoluteBase) throw new Error('Relative DASH segments');
    }
    return { xml: raw, codec: /ec-3|eac3|eac-3/i.test(raw) ? (/JOC|atmos/i.test(raw) ? 'eac3-joc' : 'eac3') : /flac/i.test(raw) ? 'flac' : undefined,
      manifest: 'dash', container: 'mp4', format: 'dash', encrypted: false };
  }
  const b = JSON.parse(raw);
  if (b.encryptionType && String(b.encryptionType).toUpperCase() !== 'NONE') throw new Error('Encrypted BTS');
  return validateStream({ url: b.urls?.[0], format: b.codecs || b.mimeType?.split('/')[1], codec: b.codecs,
    mimeType: b.mimeType, manifest: 'none', encrypted: false,
    sampleRate: b.sampleRate || t.sampleRate, bitDepth: b.bitDepth || t.bitDepth, quality: t.audioQuality });
}

export function createProvider(source, { request = getJSON, env = process.env } = {}) {
  const s = { ...source, url: env[source.urlEnv] || source.url };
  if (!['addon', 'monochrome', 'hifi', 'qobuz'].includes(s.type)) throw new Error('Unknown provider type');
  if (s.id === 'qqdl' && env.HIFI_URLS) s.urls = env.HIFI_URLS.split(',').map(x => x.trim()).filter(Boolean);
  const configured = Boolean(s.url || s.urls?.length) && (s.type !== 'qobuz' || Boolean(env.QOBUZ_APP_ID && env.QOBUZ_APP_SECRET && env.QOBUZ_USER_TOKEN));
  if (s.url) s.url = baseURL(s.url);
  let manifest, manifestUntil = 0, retryAt = 0, health = configured ? 'unchecked' : 'configuration_required';
  let activeNode = 0;
  async function manifestInfo() {
    if (s.type !== 'addon') return { id: s.id, resources: ['search', 'stream'] };
    if (manifest && Date.now() < manifestUntil) return manifest;
    const m = await request(endpoint(s.url, '/manifest.json'));
    if (!m.id || !m.resources?.includes('search')) throw new Error('Not a searchable addon');
    // A download-restricted provider cannot participate in a downloadable aggregate.
    if ([0, false, '0', 'false'].includes(m.allowDownloads)) throw new Error('Streaming-only source requires a separate aggregate');
    manifest = m; manifestUntil = Date.now() + 600_000; return m;
  }
  async function params(q) {
    const m = await manifestInfo();
    const defaults = Object.fromEntries((m.settings || []).filter(x => ['string', 'number', 'boolean'].includes(typeof x.default)).map(x => [x.key, x.default]));
    return { ...defaults, ...q };
  }
  async function pool(path, query) {
    let last;
    // At most two nodes per request; cycle remaining nodes on subsequent requests.
    for (let n = 0; n < Math.min(2, s.urls.length); n++) {
      const node = s.urls[(activeNode++) % s.urls.length];
      try { return await request(endpoint(baseURL(node), path, query)); } catch (e) { last = e; }
    }
    throw last;
  }
  function qbHeaders() { return { 'X-App-Id': env.QOBUZ_APP_ID, 'X-User-Auth-Token': env.QOBUZ_USER_TOKEN }; }
  async function search(q) {
    if (s.type === 'addon') {
      const r = await request(endpoint(s.url, '/search', await params(q)));
      return r.tracks || r.data?.tracks || [];
    }
    if (s.type === 'monochrome') {
      const r = await request(endpoint(s.url, '/search', { q: q.q }));
      return (r.tracks || []).filter(t => t.playable !== false).map(t => mapTrack(t, true));
    }
    if (s.type === 'hifi') {
      const r = await pool('/search/', { s: q.q });
      return (r.data?.items || r.items || r.tracks?.items || []).map(t => mapTrack(t));
    }
    const r = await request(endpoint(s.url, '/catalog/search', { query: q.q, type: 'tracks', limit: 15, app_id: env.QOBUZ_APP_ID }), qbHeaders());
    return (r.tracks?.items || []).map(t => mapTrack(t));
  }
  async function stream(id, q) {
    if (s.type === 'addon') {
      const r = await request(endpoint(s.url, `/stream/${encodeURIComponent(id)}`, await params(q)));
      return validateStream(r.stream || r.data || r);
    }
    if (s.type === 'monochrome') {
      const url = endpoint(s.url, `/track/${encodeURIComponent(id)}`).href;
      return validateStream({ url, manifest: 'none', ...await inspectDirect(url) });
    }
    if (s.type === 'hifi') {
      const quality = /low/i.test(q.quality) ? 'LOW' : /^high$/i.test(q.quality) ? 'HIGH' : 'HI_RES_LOSSLESS';
      try { return decodeHiFi(await pool('/track/', { id, quality })); }
      catch { return decodeHiFi(await pool('/track/', { id, quality: 'LOSSLESS' })); }
    }
    const format = /low/i.test(q.quality) || /^high$/i.test(q.quality) ? 5 : 27;
    const ts = Math.floor(Date.now() / 1000);
    const sig = createHash('md5').update(`trackgetFileUrlformat_id${format}intentstreamtrack_id${id}${ts}${env.QOBUZ_APP_SECRET}`).digest('hex');
    const r = await request(endpoint(s.url, '/track/getFileUrl', { track_id: id, format_id: format, intent: 'stream', request_ts: ts, request_sig: sig, app_id: env.QOBUZ_APP_ID }), qbHeaders());
    if (r.sample || r.restrictions?.some(x => x.code === 'UserUnauthenticated')) throw new Error('Preview rendition');
    return validateStream({ url: r.url, codec: r.format_id >= 6 ? 'flac' : 'mp3', manifest: 'none', encrypted: false,
      sampleRate: r.sampling_rate ? Number(r.sampling_rate) * 1000 : undefined, bitDepth: r.bit_depth });
  }
  async function run(fn) {
    if (!configured || Date.now() < retryAt) throw new Error('Source unavailable');
    try { const result = await fn(); health = 'ok'; return result; }
    catch (e) { health = e.status ? `http_${e.status}` : 'unavailable'; if (e.status !== 404) retryAt = Date.now() + Math.min(900, e.retryAfter || 30) * 1000; throw e; }
  }
  return { id: s.id, name: s.name, configured,
    status: () => ({ id: s.id, name: s.name, configured, status: health, retryAt: retryAt || undefined }),
    probe: () => run(manifestInfo), search: q => run(() => search(q)), stream: (id, q) => run(() => stream(id, q)) };
}
