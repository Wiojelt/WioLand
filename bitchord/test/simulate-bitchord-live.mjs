/**
 * BitChord Live Engine Simulation Test
 * 
 * Accurately simulates BitChord's Android QuickJsExecutor sandbox environment
 * and executes real network requests against live lossless audio sources.
 */

import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);

// 1. BitChord QuickJs Sandbox Factory (matching QuickJsExecutor.kt)
function createBitChordQuickJsContext(moduleCode, networkInterceptor = null) {
  const box = {
    module: { exports: {} },
    atob: (s) => Buffer.from(s, 'base64').toString('binary'),
    btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (id) => clearTimeout(id),
    console: {
      log: (...args) => console.log('   [QuickJS log]', ...args),
      warn: (...args) => console.warn('   [QuickJS warn]', ...args),
      error: (...args) => console.error('   [QuickJS error]', ...args)
    }
  };

  // Web-compatible fetch surface over QuickJS native bindings
  box.fetch = async (url, options = {}) => {
    if (networkInterceptor) {
      const intercepted = await networkInterceptor(String(url), options);
      if (intercepted !== undefined) return intercepted;
    }

    const method = options.method || 'GET';
    const headers = options.headers || {};
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      method,
      headers,
      body: options.body,
      signal: controller.signal
    });
    clearTimeout(timeout);

    const textBody = await res.text();

    // QuickJsExecutor.kt lines 440-449: synchronous body readers!
    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      json: () => {
        try {
          return JSON.parse(textBody);
        } catch (e) {
          throw new Error('Invalid JSON: ' + textBody.substring(0, 200));
        }
      },
      text: () => textBody,
      arrayBuffer: () => {
        throw new Error('Not implemented'); // QuickJsExecutor throws this
      },
      headers: {
        get: () => null // QuickJsExecutor always returns null
      }
    };
  };

  const context = vm.createContext(box);
  vm.runInContext(moduleCode, context);
  return { exports: box.module.exports, context, box };
}

async function runLiveSimulation() {
  console.log('====================================================');
  console.log('   BitChord Real QuickJS Engine & Live Audio Test   ');
  console.log('====================================================\n');

  const moduleCode = await readFile(new URL('modules/wiochord-lossless.js', root), 'utf8');

  // STEP 1: Verify QuickJS Sandbox constraints
  console.log('1. Initializing QuickJS Sandbox & verifying strict constraints...');
  const { exports: api, box } = createBitChordQuickJsContext(moduleCode);
  assert.equal(box.URLSearchParams, undefined, 'Sandbox must NOT leak URLSearchParams');
  assert.equal(box.Buffer, undefined, 'Sandbox must NOT leak Node Buffer');
  console.log('   ✔ Sandboxed environment verified: URLSearchParams & Buffer absent.\n');

  // STEP 2: Real live search
  const searchQuery = 'Daft Punk';
  console.log(`2. Executing real live searchTracks("${searchQuery}", limit=5)...`);
  const searchStartTime = Date.now();
  const searchResult = await api.searchTracks(searchQuery, 5, {});
  const searchElapsed = Date.now() - searchStartTime;

  console.log(`   ✔ Search completed in ${searchElapsed}ms`);
  console.log(`   ✔ Tracks returned: ${searchResult.tracks ? searchResult.tracks.length : 0}`);
  assert.ok(searchResult.tracks && searchResult.tracks.length > 0, 'Live search should return tracks');

  const firstTrack = searchResult.tracks[0];
  console.log('   --- Sample Result Metadata ---');
  console.log(`   • Title:        ${firstTrack.title}`);
  console.log(`   • Artist:       ${firstTrack.artist}`);
  console.log(`   • Album:        ${firstTrack.album}`);
  console.log(`   • Track ID:     ${firstTrack.id}`);
  console.log(`   • Duration:     ${firstTrack.duration}s`);
  console.log(`   • Format:       ${firstTrack.format}`);
  console.log(`   • AudioQuality: ${firstTrack.audioQuality}`);
  console.log(`   • Artwork URL:  ${firstTrack.albumCover}\n`);

  assert.ok(firstTrack.id, 'Track must have an ID');
  assert.ok(firstTrack.title, 'Track must have a title');
  assert.equal(firstTrack.format, 'flac', 'Format must be flac');
  assert.equal(firstTrack.audioQuality, 'LOSSLESS', 'Quality must be LOSSLESS');

  // STEP 3: Real live stream URL resolution
  console.log(`3. Executing real live getTrackStreamUrl("${firstTrack.id}", quality="LOSSLESS")...`);
  const streamStartTime = Date.now();
  const streamResult = await api.getTrackStreamUrl(firstTrack.id, 'LOSSLESS', {});
  const streamElapsed = Date.now() - streamStartTime;

  console.log(`   ✔ Stream resolution completed in ${streamElapsed}ms`);
  console.log(`   • Stream URL:   ${streamResult.streamUrl}`);
  console.log(`   • Codec:        ${streamResult.track?.mimeType || 'audio/flac'}`);
  console.log(`   • Quality:      ${streamResult.track?.audioQuality}`);
  assert.ok(streamResult.streamUrl, 'Stream URL must not be null');
  assert.ok(streamResult.streamUrl.startsWith('https://'), 'Stream URL must be an https URL');
  assert.equal(streamResult.track.mimeType, 'audio/flac');
  console.log('   ✔ Stream URL & track metadata successfully acquired.\n');

  // STEP 4: ExoPlayer HTTP Range audio verification
  console.log('4. Simulating ExoPlayer GET request with Range: bytes=0-1024...');
  let audioRes;
  for (let attempt = 1; attempt <= 3; attempt++) {
    audioRes = await fetch(streamResult.streamUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Safari/537.36',
        'Range': 'bytes=0-1024'
      }
    });
    if (audioRes.status !== 429) break;
    console.log(`   [ExoPlayer retry] 429 received, backing off 2500ms (attempt ${attempt}/3)...`);
    await new Promise(r => setTimeout(r, 2500));
  }

  console.log(`   • HTTP Status:     ${audioRes.status}`);
  console.log(`   • Content-Type:    ${audioRes.headers.get('content-type')}`);
  console.log(`   • Content-Range:   ${audioRes.headers.get('content-range')}`);

  assert.ok(audioRes.status === 200 || audioRes.status === 206, 'Audio request must return 200 or 206');
  const audioBuffer = Buffer.from(await audioRes.arrayBuffer());
  const magic = audioBuffer.slice(0, 4).toString('ascii');
  console.log(`   • Read bytes:      ${audioBuffer.length} bytes`);
  console.log(`   • FLAC Magic Sign: "${magic}" (Hex: ${audioBuffer.slice(0, 4).toString('hex')})`);
  assert.equal(magic, 'fLaC', 'Audio stream must begin with FLAC magic signature ("fLaC")');
  console.log('   ✔ FLAC byte-level audio integrity successfully verified!\n');

  // STEP 5: Cascading Fallback Simulation
  console.log('5. Testing Cascading Failover (Simulating Primary Monochrome Outage)...');
  const { exports: failoverApi } = createBitChordQuickJsContext(moduleCode, (url) => {
    if (url.includes('tracks.monochrome.st')) {
      return {
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: () => ({ error: 'Simulated primary outage' }),
        text: () => 'Simulated primary outage',
        arrayBuffer: () => { throw new Error('Not implemented'); },
        headers: { get: () => null }
      };
    }
    return undefined; // Passthrough to real network for fallbacks
  });

  const fallbackSearch = await failoverApi.searchTracks('Bohemian Rhapsody', 3, {});
  console.log(`   ✔ Fallback search returned: ${fallbackSearch.tracks ? fallbackSearch.tracks.length : 0} tracks`);
  assert.ok(fallbackSearch.tracks && fallbackSearch.tracks.length > 0, 'Fallback search should return tracks');
  const fallbackTrack = fallbackSearch.tracks[0];
  console.log(`   • Fallback Track: "${fallbackTrack.title}" by "${fallbackTrack.artist}" (ID: ${fallbackTrack.id})`);

  const fallbackStream = await failoverApi.getTrackStreamUrl(fallbackTrack.id, 'LOSSLESS', {});
  console.log(`   • Fallback Stream URL: ${fallbackStream.streamUrl}`);
  assert.ok(fallbackStream.streamUrl, 'Fallback stream URL must not be null');
  console.log('   ✔ Automatic cascading fallback verified live against secondary upstream!\n');

  console.log('====================================================');
  console.log('   ALL BITCHORD SIMULATION TESTS PASSED (100%)       ');
  console.log('====================================================');
}

runLiveSimulation().catch((err) => {
  console.error('\n❌ BitChord Simulation Failed:', err);
  process.exit(1);
});
