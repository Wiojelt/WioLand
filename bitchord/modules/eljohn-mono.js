(function () {
'use strict';
var config = {"id":"eljohn-mono","name":"Eljohnzc Monochrome","type":"addon","url":"https://eljohnzc-mono.de.deplexo.com"};
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
async function json(url) {
  var response = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'BitChord/v1.8.1 WioJelt/0.2' } });
  if (!response.ok) throw new Error('HTTP ' + response.status);
  return await response.json();
}
var manifestPromise;
async function addonManifest() {
  if (!manifestPromise) manifestPromise = json(config.url + '/manifest.json').then(function (m) {
    if (!m.id) throw new Error('Invalid addon manifest');
    if ([0, false, '0', 'false'].indexOf(m.allowDownloads) >= 0) throw new Error('Streaming-only addon');
    return m;
  }).catch(function (error) { manifestPromise = null; throw error; });
  return await manifestPromise;
}
async function addonParams(quality, context) {
  var m = await addonManifest(), params = {};
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
  var artist = t.artistNames ? t.artistNames.join(', ') : t.artist;
  if (artist && typeof artist === 'object') artist = artist.name;
  if (!artist && t.artists) artist = t.artists.map(function (a) { return a.name; }).join(', ');
  var album = t.album && typeof t.album === 'object' ? t.album.title : t.album;
  var image = t.artworkURL || t.albumArtworkURL || t.artwork;
  if (!image && t.album && t.album.cover) image = 'https://resources.tidal.com/images/' + t.album.cover.replace(/-/g, '/') + '/640x640.jpg';
  return {
    id: encodeURIComponent(String(t.id == null ? t.trackId : t.id)),
    title: String(t.title || t.name || ''), artist: String(artist || ''), album: String(album || ''),
    albumCover: image || null, duration: Math.max(0, Math.round(Number(t.duration) || 0)),
    audioQuality: String(t.audioQuality || ''), format: String(t.format || ''),
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
    if (config.type === 'hifi') {
      response = await pool('/search/', { s: text });
      response = { tracks: response.data && response.data.items || response.items || [] };
    } else {
      var params = await addonParams(null, context); params.q = text;
      response = await json(query(config.url + '/search', params));
    }
    var rows = response.tracks || response.data && response.data.tracks || [];
    if (!Array.isArray(rows)) rows = [];
    var tracks = rows.filter(function (t) { return t && t.id != null && t.title; }).slice(0, Math.max(1, Math.min(30, limit || 15))).map(track);
    return { tracks: tracks, total: tracks.length };
  } catch (_) { return { tracks: [], total: 0 }; }
}
async function getTrackStreamUrl(id, quality, context) {
  try {
    var original = decodeURIComponent(String(id)), result;
    if (config.type === 'hifi') {
      var tier = String(quality || setting(context, 'quality', 'LOSSLESS')).toUpperCase();
      try { result = decodeHiFi(await pool('/track/', { id: original, quality: tier === 'LOSSLESS' ? 'HI_RES_LOSSLESS' : tier })); }
      catch (_) { result = decodeHiFi(await pool('/track/', { id: original, quality: 'LOSSLESS' })); }
    } else {
      var params = await addonParams(quality, context);
      result = await json(query(config.url + '/stream/' + encodeURIComponent(original), params));
      result = result.stream || result.data || result;
    }
    return streamResult(result, id);
  } catch (_) { return { streamUrl: null }; }
}
module.exports = { searchTracks: searchTracks, getTrackStreamUrl: getTrackStreamUrl };

})();
