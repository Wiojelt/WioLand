import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp, encodeId, decodeId } from '../server.mjs';
import { createProvider, decodeHiFi, endpoint, baseURL, validateStream, flacInfo } from '../providers.mjs';

async function running(t, providers, env = {}) {
  const app = createApp(providers, env); app.listen(0, '127.0.0.1'); await once(app, 'listening');
  t.after(() => new Promise(resolve => { app.closeAllConnections(); app.close(resolve); }));
  return `http://127.0.0.1:${app.address().port}`;
}
const row = { id: 'one/a?b', title: 'Track', artist: 'Artist', album: 'Album', duration: 200 };
const provider = (id, stream) => ({ id, name: id, configured: true, status: () => ({ id, status: 'ok' }), search: async () => [row], stream });

test('opaque IDs roundtrip punctuation and unicode; reject malformed IDs', () => {
  assert.deepEqual(decodeId(encodeId('a', '12/a?ışık')), ['a', '12/a?ışık']);
  assert.throws(() => decodeId('!!!'));
  assert.throws(() => decodeId(Buffer.from('["a",null]').toString('base64url')));
});
test('merge exact recordings; fallback resolves second source and forwards Atmos', async t => {
  const root = await running(t, [provider('bad', async () => { throw Error('offline'); }), provider('good', async (id, q) => {
    assert.equal(id, row.id); assert.equal(q.atmos, 'auto');
    return { url: 'https://audio.example/track', codec: 'eac3-joc', audioMode: 'DOLBY_ATMOS', encrypted: false };
  })]);
  const { tracks } = await (await fetch(`${root}/search?q=Track&atmos=auto`)).json();
  assert.equal(tracks.length, 1);
  const r = await fetch(`${root}/stream/${tracks[0].id}?atmos=auto`);
  assert.equal(r.status, 200); assert.equal((await r.json()).codec, 'eac3-joc');
});
test('private path protects manifest, health and streams', async t => {
  const root = await running(t, [], { ACCESS_TOKEN: 'secret' });
  assert.equal((await fetch(`${root}/manifest.json`)).status, 404);
  assert.equal((await fetch(`${root}/secret-wrong/health`)).status, 404);
  assert.equal((await fetch(`${root}/secret/manifest.json`)).status, 200);
  assert.equal((await fetch(`${root}/secret/stream/bad`)).status, 400);
});
test('DASH served through protected origin; ContentProtection rejected', async t => {
  const xml = '<MPD><Period><SegmentTemplate media="https://cdn.example/$Number$.m4s"/></Period></MPD>';
  const root = await running(t, [provider('dash', async () => ({ xml, manifest: 'dash', encrypted: false }))], { ACCESS_TOKEN: 'secret', PUBLIC_URL: 'https://addon.example' });
  const r = await (await fetch(`${root}/secret/stream/${encodeId('dash', row.id)}`)).json();
  assert.ok(r.url.startsWith('https://addon.example/secret/dash/'));
  const d = await fetch(root + new URL(r.url).pathname);
  assert.equal(d.headers.get('content-type'), 'application/dash+xml'); assert.equal(await d.text(), xml);
  assert.throws(() => decodeHiFi({ manifest: Buffer.from('<MPD><ContentProtection/></MPD>').toString('base64') }));
});
test('BTS preserves real metadata; rejects encrypted and preview audio', () => {
  const manifest = Buffer.from(JSON.stringify({ urls: ['https://cdn.example/audio'], codecs: 'flac', bitDepth: 24, sampleRate: 96000, encryptionType: 'NONE' })).toString('base64');
  assert.equal(decodeHiFi({ manifest }).sampleRate, 96000);
  assert.throws(() => decodeHiFi({ manifest, assetPresentation: 'PREVIEW' }));
  assert.throws(() => decodeHiFi({ manifest: Buffer.from('{"encryptionType":"AES"}').toString('base64') }));
  assert.throws(() => validateStream({ url: 'https://a.example', encrypted: true }));
});
test('FLAC STREAMINFO reports the binary sample rate and bit depth', () => {
  const bytes = Buffer.alloc(42); bytes.write('fLaC'); bytes[4] = 0x80; bytes[7] = 34;
  bytes.writeBigUInt64BE((96000n << 44n) | (1n << 41n) | (23n << 36n), 18);
  assert.equal(flacInfo(bytes).sampleRate, 96000); assert.equal(flacInfo(bytes).bitDepth, 24);
  assert.deepEqual(flacInfo(Buffer.from('<html>')), {});
});
test('addon honors scalar defaults, profile query and upstream download permission', async () => {
  const calls = [];
  const p = createProvider({ id: 'a', name: 'a', type: 'addon', url: 'https://a.example/profile/manifest.json?key=private' }, { env: {}, request: async u => {
    calls.push(String(u));
    return u.pathname.endsWith('manifest.json') ? { id: 'x', resources: ['search'], settings: [{ key: 'mode', default: 'yes' }] } : { tracks: [row] };
  } });
  await p.search({ q: 'x', quality: 'lossless' });
  const u = new URL(calls[1]); assert.equal(u.pathname, '/profile/search'); assert.equal(u.searchParams.get('key'), 'private'); assert.equal(u.searchParams.get('mode'), 'yes');
  const denied = createProvider({ id: 'b', type: 'addon', url: 'https://a.example' }, { env: {}, request: async () => ({ id: 'x', resources: ['search'], allowDownloads: 0 }) });
  await assert.rejects(denied.search({ q: 'x' }));
  assert.equal(baseURL('https://a.example/manifest.json'), 'https://a.example');
  assert.equal(endpoint('https://a.example/p?a=b', '/search', { q: 'ş' }).searchParams.get('a'), 'b');
});
test('outage reports 503; health never exposes upstream configuration', async t => {
  const p = provider('down', async () => {}); p.search = async () => { throw Error('https://secret.example/token'); };
  const root = await running(t, [p]);
  const r = await fetch(`${root}/search?q=test`); assert.equal(r.status, 503); assert.equal(r.headers.get('retry-after'), '30');
  assert.ok(!(await (await fetch(`${root}/health`)).text()).includes('secret.example'));
});
