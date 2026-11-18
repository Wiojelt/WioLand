(function () {
'use strict';
var config = {"id":"lastbabe","name":"LastBabe","type":"addon","url":"https://lastbabe-addon.de.deplexo.com"};
function setting(context, key, fallback) {
  var value = context && context.settings && context.settings[key];
  if (value && typeof value === 'object') value = value.value;
  return value == null || value === '' ? fallback : value;
}
function query(path, values) {
  var pairs = [];
  Object.keys(values).forEach(function (key) {
    if (values[key] != null) pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(values[key]));
  });
  return path + (path.indexOf('?') < 0 ? '?' : '&') + pairs.join('&');
}
var UA = (config.type === 'monochrome' || config.type === 'losslessbridge' || config.id === 'losslessbridge')
  ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  : 'BitChord/v1.8.1 WioJelt/0.2';
async function json(url, headers) {
  var h = { Accept: 'application/json', 'User-Agent': UA };
  if (headers) for (var k in headers) h[k] = headers[k];
  var response = await fetch(url, { headers: h });
  if (!response.ok) throw new Error('HTTP ' + response.status);
  return await response.json();
}
var manifestPromise;
var resolvedBaseUrl = null;
async function resolveBaseUrl(context) {
  if (config.type === 'losslessbridge' || config.id === 'losslessbridge') {
    var custom = setting(context, 'manifestUrl') || setting(context, 'token');
    if (custom) {
      if (String(custom).indexOf('http') === 0) return String(custom).replace(/\/manifest\.json$/, '').replace(/\/+$/, '');
      return 'https://losslessbridge.de.deplexo.com/u/' + String(custom).trim();
    }
    if (resolvedBaseUrl) return resolvedBaseUrl;
    try {
      var resp = await fetch(config.url + '/', {
        headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' }
      });
      var html = await resp.text();
      var match = html.match(/https:\/\/losslessbridge\.de\.deplexo\.com\/u\/([a-zA-Z0-9._-]+)/);
      if (match) {
        resolvedBaseUrl = 'https://losslessbridge.de.deplexo.com/u/' + match[1];
        return resolvedBaseUrl;
      }
    } catch (_) {}
  }
  return config.url;
}
async function addonManifest(context) {
  var base = await resolveBaseUrl(context);
  if (!manifestPromise) manifestPromise = json(base + '/manifest.json').then(function (m) {
    if (!m.id) throw new Error('Invalid addon manifest');
    if ([0, false, '0', 'false'].indexOf(m.allowDownloads) >= 0) throw new Error('Streaming-only addon');
    return m;
  }).catch(function (error) { manifestPromise = null; resolvedBaseUrl = null; throw error; });
  return await manifestPromise;
}
async function addonParams(quality, context) {
  var m = await addonManifest(context), params = {};
  (m.settings || []).forEach(function (s) {
    if (['string', 'number', 'boolean'].indexOf(typeof s.default) >= 0) params[s.key] = s.default;
  });
  var requested = String(quality || setting(context, 'quality', 'LOSSLESS')).toUpperCase();
  var key = requested === 'LOW' ? 'low' : requested === 'HIGH' ? 'high' : 'lossless';
  var schema = (m.settings || []).filter(function (s) { return s.key === 'quality'; })[0];
  var options = schema && schema.options || [];
  var choices = key === 'lossless' ? ['hi_res_lossless', 'HI_RES_LOSSLESS', 'hi_res', 'lossless', 'LOSSLESS'] : [key, key.toUpperCase()];
  params.quality = key;
  for (var i = 0; i < choices.length; i++) {
    if (options.some(function (o) { return o.value === choices[i]; })) { params.quality = choices[i]; break; }
  }
  params.atmos = String(setting(context, 'dolbyAtmos', 'false')) === 'true' ? 'auto' : 'stereo';
  return params;
}
function track(t) {
  var artist = t.artistNames ? (Array.isArray(t.artistNames) ? t.artistNames.join(', ') : String(t.artistNames)) : t.artist;
  if (artist && typeof artist === 'object') artist = artist.name;
  if (!artist && t.artists) artist = t.artists.map(function (a) { return a.name; }).join(', ');
  var album = t.album && typeof t.album === 'object' ? t.album.title : t.album;
  var image = t.artworkURL || t.albumArtworkURL || t.artwork;
  if (!image && t.album && t.album.cover) image = 'https://resources.tidal.com/images/' + t.album.cover.replace(/-/g, '/') + '/640x640.jpg';
  var dur = Number(t.duration) || 0;
  if (dur > 10000) dur = Math.round(dur / 1000);
  return {
    id: encodeURIComponent(String(t.id == null ? t.trackId : t.id)),
    title: String(t.title || t.name || ''),
    artist: String(artist || ''),
    album: String(album || ''),
    albumCover: image || null,
    duration: Math.max(0, Math.round(dur)),
    audioQuality: String(t.audioQuality || 'LOSSLESS'),
    format: String(t.format || 'flac'),
  };
}
var poolCursor = 0;
async function pool(path, params) {
  var last;
  for (var i = 0; i < Math.min(2, config.urls.length); i++) {
    var base = config.urls[(poolCursor++) % config.urls.length];
    try { return await json(query(base + path, params)); } catch (e) { last = e; }
  }
  throw last || new Error('No upstream');
}
function unencrypted(s) {
  if (!s || [true, 1, 'true', '1'].indexOf(s.encrypted) >= 0) throw new Error('Protected rendition');
  if (typeof s.url !== 'string' || !/^https:\/\/[^\s]+$/.test(s.url)) throw new Error('No playable URL');
  return s;
}
function decodeHiFi(result) {
  var data = result.data || result;
  if (data.assetPresentation === 'PREVIEW' || data.sample === true) throw new Error('Preview');
  var body = atob(data.manifest || '').trim();
  // Inline MPD needs a server; the client module requests direct lossless instead.
  if (body.charAt(0) === '<') throw new Error('Inline DASH');
  var b = JSON.parse(body);
  if (b.encryptionType && String(b.encryptionType).toUpperCase() !== 'NONE') throw new Error('Encrypted BTS');
  return unencrypted({ url: b.urls && b.urls[0], codec: b.codecs, mimeType: b.mimeType,
    bitDepth: b.bitDepth || data.bitDepth, sampleRate: b.sampleRate || data.sampleRate,
    audioQuality: data.audioQuality, encrypted: false });
}
function streamResult(s, id) {
  unencrypted(s);
  var codec = String(s.codec || s.format || '').toLowerCase();
  var mime = s.mimeType || ({ flac: 'audio/flac', alac: 'audio/alac', mp3: 'audio/mpeg', aac: 'audio/aac', 'eac3-joc': 'audio/eac3-joc' })[codec];
  var meta = { id: String(id), audioQuality: String(s.audioQuality || s.quality || ''), audioModes: s.audioModes || (s.audioMode ? [s.audioMode] : []) };
  if (mime) meta.mimeType = mime;
  if (Number(s.bitDepth) > 0) meta.bitDepth = Math.round(Number(s.bitDepth));
  if (Number(s.sampleRate) > 0) meta.sampleRate = Number(s.sampleRate);
  if (Number(s.bitrate) > 0) meta.bitrate = Math.round(Number(s.bitrate));
  return { streamUrl: s.url, track: meta };
}
async function searchTracks(text, limit, context) {
  try {
    var response;
    if (config.type === 'monochrome') {
      var searchLimit = Math.max(1, Math.min(30, limit || 15));
      response = await json(query(config.url + '/search/tracks', { q: text, limit: searchLimit }));
    } else if (config.type === 'hifi') {
      response = await pool('/search/', { s: text });
      response = { tracks: response.data && response.data.items || response.items || [] };
    } else {
      var params = await addonParams(null, context); params.q = text;
      var base = await resolveBaseUrl(context);
      response = await json(query(base + '/search', params));
    }
    var rows = response.tracks || response.data && response.data.tracks || [];
    if (!Array.isArray(rows)) rows = [];
    var tracks = rows.filter(function (t) { return t && (t.id != null || t.trackId != null) && (t.title || t.name) && t.playable !== false; }).slice(0, Math.max(1, Math.min(30, limit || 15))).map(track);
    return { tracks: tracks, total: tracks.length };
  } catch (_) { return { tracks: [], total: 0 }; }
}
async function getTrackStreamUrl(id, quality, context) {
  try {
    var original = decodeURIComponent(String(id)), result;
    if (config.type === 'monochrome') {
      var streamUrl = config.url + '/track/' + encodeURIComponent(original);
      return {
        streamUrl: streamUrl,
        track: {
          id: String(id),
          audioQuality: 'LOSSLESS',
          mimeType: 'audio/flac',
          audioModes: ['STEREO']
        }
      };
    } else if (config.type === 'hifi') {
      var tier = String(quality || setting(context, 'quality', 'LOSSLESS')).toUpperCase();
      try { result = decodeHiFi(await pool('/track/', { id: original, quality: tier === 'LOSSLESS' ? 'HI_RES_LOSSLESS' : tier })); }
      catch (_) { result = decodeHiFi(await pool('/track/', { id: original, quality: 'LOSSLESS' })); }
      return streamResult(result, id);
    } else {
      var params = await addonParams(quality, context);
      var base = await resolveBaseUrl(context);
      result = await json(query(base + '/stream/' + encodeURIComponent(original), params));
      result = result.stream || result.data || result;
      return streamResult(result, id);
    }
  } catch (_) { return { streamUrl: null }; }
}
module.exports = { searchTracks: searchTracks, getTrackStreamUrl: getTrackStreamUrl };

})();
