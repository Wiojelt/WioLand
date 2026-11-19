import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8'));
async function load(id, reply, asyncBodies = false) {
  const entry = manifest['category:music'].find(m => m.id === `wiojelt-${id}`);
  const code = await readFile(new URL(entry.download, root), 'utf8');
  const calls = [];
  const box = vm.createContext({ module: { exports: {} }, atob: s => Buffer.from(s, 'base64').toString('binary'),
    fetch: async (url, options) => {
      calls.push({ url, options });
      const r = await reply(String(url), options);
      const data = r.data || {};
      return { ok: (r.status || 200) < 400, status: r.status || 200,
        json: () => asyncBodies ? Promise.resolve(data) : data,
        text: () => asyncBodies ? Promise.resolve(JSON.stringify(data)) : JSON.stringify(data),
        headers: { get: () => null }, arrayBuffer: () => { throw Error('Not implemented'); } };
    },
  });
  vm.runInContext(code, box);
  return { api: box.module.exports, calls, box };
}
const addon = { id: 'test', checkValidLossless: 1, resources: ['search', 'stream'], settings: [
  { key: 'quality', default: 'lossless', options: [{ value: 'hi_res_lossless' }, { value: 'lossless' }, { value: 'high' }, { value: 'low' }] },
] };
const track = { id: '123/a?b"', title: 'Track', artist: 'Artist', album: 'Album', duration: 200.4, artworkURL: 'https://img.example/a', format: 'flac' };

test('module index has no headphone gate, backend routes or Workers URLs', () => {
  assert.equal(manifest.checkValidLossless, 0);
  assert.equal(manifest['category:music'].length, 12);
  assert.equal(new Set(manifest['category:music'].map(m => m.id)).size, 12);
  assert.ok(!manifest.resources);
  assert.ok(!JSON.stringify(manifest).includes('workers.dev'));
  for (const m of manifest['category:music']) assert.equal(m.type, 'MODULE');
});
for (const asyncBodies of [false, true]) {
  test(`addon search/stream contract with ${asyncBodies ? 'async' : 'QuickJS sync'} response bodies`, async () => {
    const { api, calls, box } = await load('gglos', url => ({ data: url.includes('/manifest.json') ? addon : url.includes('/search?') ? { tracks: [track] } : {
      url: 'https://cdn.example/music.flac', codec: 'flac', sampleRate: 96000, bitDepth: 24, encrypted: false,
    } }), asyncBodies);
    assert.equal(box.URLSearchParams, undefined);
    assert.equal(box.Buffer, undefined);
    const search = await api.searchTracks('Track Artist', 8, {});
    assert.equal(search.tracks.length, 1);
    assert.equal(search.tracks[0].duration, 200);
    assert.equal(search.tracks[0].albumCover, track.artworkURL);
    const stream = await api.getTrackStreamUrl(search.tracks[0].id, 'LOSSLESS', { settings: { dolbyAtmos: { value: 'true' } } });
    assert.equal(stream.streamUrl, 'https://cdn.example/music.flac');
    assert.equal(stream.track.sampleRate, 96000);
    assert.equal(stream.track.bitDepth, 24);
    const requested = new URL(calls.at(-1).url);
    assert.equal(decodeURIComponent(requested.pathname.slice('/stream/'.length)), track.id);
    assert.equal(requested.searchParams.get('quality'), 'hi_res_lossless');
    assert.equal(requested.searchParams.get('atmos'), 'auto');
    assert.ok(calls[0].options.headers['User-Agent'].startsWith('BitChord/'));
  });

  test(`Dial Monochrome embedded source search and stream with ${asyncBodies ? 'async' : 'QuickJS sync'} response bodies`, async () => {
    const sampleTracks = [
      { id: '155102871061270528', trackId: '155102871061270528', title: 'One More Time', artistNames: ['Daft Punk'], artwork: 'https://tracks.monochrome.st/proxy/mi/1.jpg', duration: 320357, playable: true },
      { id: '155102871061270999', trackId: '155102871061270999', title: 'Unplayable Song', artistNames: ['Daft Punk'], artwork: 'https://tracks.monochrome.st/proxy/mi/2.jpg', duration: 180000, playable: false },
    ];
    const { api, calls } = await load('dial-monochrome', (url) => {
      if (url.includes('/search/tracks')) {
        return { data: { tracks: sampleTracks } };
      }
      return { status: 200, data: {} };
    }, asyncBodies);

    const search = await api.searchTracks('Daft Punk', 5, {});
    assert.equal(search.tracks.length, 1);
    assert.equal(search.tracks[0].id, '155102871061270528');
    assert.equal(search.tracks[0].title, 'One More Time');
    assert.equal(search.tracks[0].artist, 'Daft Punk');
    assert.equal(search.tracks[0].duration, 320);
    assert.equal(search.tracks[0].albumCover, 'https://tracks.monochrome.st/proxy/mi/1.jpg');
    assert.equal(search.tracks[0].audioQuality, 'LOSSLESS');
    assert.equal(search.tracks[0].format, 'flac');
    assert.match(calls[0].options.headers['User-Agent'], /Chrome\//);

    const stream = await api.getTrackStreamUrl('155102871061270528', 'LOSSLESS', {});
    assert.equal(stream.streamUrl, 'https://tracks.monochrome.st/track/155102871061270528');
    assert.equal(stream.track.audioQuality, 'LOSSLESS');
    assert.equal(stream.track.mimeType, 'audio/flac');
  });
}
test('unavailable source yields a miss and does not prevent later retry', async () => {
  let online = false;
  const { api } = await load('lastbabe', () => online ? { data: addon } : { status: 404 });
  assert.equal((await api.searchTracks('x', 8, {})).tracks.length, 0);
  assert.equal((await api.getTrackStreamUrl('x', 'LOSSLESS', {})).streamUrl, null);
  online = true;
  assert.equal((await api.searchTracks('x', 8, {})).tracks.length, 0);
});
test('protected rendition never reaches playback', async () => {
  const { api } = await load('juanjob', url => ({ data: url.includes('/manifest.json') ? addon : { url: 'https://cdn.example/audio', encrypted: true } }));
  assert.equal((await api.getTrackStreamUrl('123', 'LOSSLESS', {})).streamUrl, null);
});
test('QQDL inline DASH falls back to direct lossless BTS', async () => {
  const bts = Buffer.from(JSON.stringify({ urls: ['https://cdn.example/t.flac'], codecs: 'flac', mimeType: 'audio/flac', encryptionType: 'NONE', bitDepth: 16, sampleRate: 44100 })).toString('base64');
  const { api, calls } = await load('qqdl', url => ({ data: { manifest: new URL(url).searchParams.get('quality') === 'LOSSLESS' ? bts : Buffer.from('<MPD/>').toString('base64') } }));
  const stream = await api.getTrackStreamUrl('12', 'LOSSLESS', {});
  assert.equal(stream.streamUrl, 'https://cdn.example/t.flac');
  assert.equal(stream.track.sampleRate, 44100);
  assert.equal(new URL(calls.at(-1).url).searchParams.get('quality'), 'LOSSLESS');
});
test('Lossless Bridge auto-enrolls 15-day token and uses dynamic base URL', async () => {
  const token = 'tpg000.abc123mock.xyz456mock';
  const mockHtml = '<code id="manifest-url">https://losslessbridge.de.deplexo.com/u/' + token + '/manifest.json</code>';
  const { api, calls } = await load('losslessbridge', url => {
    if (url === 'https://losslessbridge.de.deplexo.com/') {
      return { data: mockHtml };
    }
    if (url.includes(token + '/manifest.json')) {
      return { data: addon };
    }
    if (url.includes(token + '/search')) {
      return { data: { tracks: [track] } };
    }
    if (url.includes(token + '/stream/')) {
      return { data: { url: 'https://cdn.example/song.flac', codec: 'flac', sampleRate: 96000, bitDepth: 24, encrypted: false } };
    }
    return { status: 404, data: {} };
  });

  const search = await api.searchTracks('Queen', 5, {});
  assert.equal(search.tracks.length, 1);
  assert.equal(search.tracks[0].title, 'Track');
  assert.ok(calls.some(c => c.url.includes('/u/' + token + '/search')));

  const stream = await api.getTrackStreamUrl(search.tracks[0].id, 'LOSSLESS', {});
  assert.equal(stream.streamUrl, 'https://cdn.example/song.flac');
  assert.equal(stream.track.sampleRate, 96000);
});

test('both requested Oreo providers are included and pinned', () => {
  const entries = manifest['category:music'].filter(x => x.download.startsWith('https://'));
  assert.deepEqual(entries.map(e => e.id).sort(), ['archive-flac', 'bitchord-tidal-flac']);
  for (const e of entries) assert.match(e.download, /\/df97c0ca349fbf63007ad48199bf389004b3e1a9\/modules\//);
});
