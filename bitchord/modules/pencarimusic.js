(function () {
'use strict';
var config = {"id":"pencarimusic","name":"PencariMusic Hi-Res 24-bit","type":"pencarimusic","url":"https://stream.pencarimovie.com/66ff097863dedb7ccd8401d5ffe616f3/music","speed":"🚀 24-bit 96kHz / 192kHz Master FLAC","latency":"~600ms"};
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

var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

async function json(url, headers, timeoutMs) {
  var h = { 'Accept': 'application/json', 'User-Agent': UA };
  if (headers) for (var k in headers) h[k] = headers[k];
  var opts = { headers: h };
  if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
    opts.signal = AbortSignal.timeout(timeoutMs || 8000);
  }
  var response = await fetch(url, opts);
  if (!response.ok) throw new Error('HTTP ' + response.status);
  return await response.json();
}

function parseMonoTrack(t) {
  var artist = t.artistNames ? (Array.isArray(t.artistNames) ? t.artistNames.join(', ') : String(t.artistNames)) : t.artist;
  if (artist && typeof artist === 'object') artist = artist.name;
  if (!artist && t.artists) artist = t.artists.map(function (a) { return a.name; }).join(', ');
  var album = t.albumTitle || t.releaseTitle || (t.album && typeof t.album === 'object' ? t.album.title : t.album) || '';
  var image = t.artwork || t.artworkURL || t.albumArtworkURL;
  if (!image && t.album && t.album.cover) {
    image = 'https://resources.tidal.com/images/' + t.album.cover.replace(/-/g, '/') + '/640x640.jpg';
  }
  var dur = Number(t.duration) || 0;
  if (dur > 10000) dur = Math.round(dur / 1000);
  return {
    id: 'mono::' + encodeURIComponent(String(t.id == null ? t.trackId : t.id)),
    title: String(t.title || t.name || ''),
    artist: String(artist || ''),
    album: String(album),
    albumCover: image || null,
    duration: Math.max(0, Math.round(dur)),
    audioQuality: String(t.audioQuality || 'LOSSLESS'),
    format: 'flac'
  };
}

function parsePencariTrack(t) {
  var dur = Number(t.duration) || 0;
  if (dur > 10000) dur = Math.round(dur / 1000);
  return {
    id: 'pm::' + encodeURIComponent(String(t.id)),
    title: String(t.title || ''),
    artist: String(t.artist || ''),
    album: String(t.album || ''),
    albumCover: t.artworkURL || null,
    duration: Math.max(0, Math.round(dur)),
    audioQuality: String(t.audioQuality || 'LOSSLESS'),
    format: String(t.format || 'flac')
  };
}

function parseArchiveTrack(doc, flacFile) {
  var dur = 0;
  if (flacFile && flacFile.length) {
    dur = Math.round(parseFloat(flacFile.length) || 0);
  }
  var id = 'ia::' + encodeURIComponent(doc.identifier) + (flacFile ? '::' + encodeURIComponent(flacFile.name) : '');
  return {
    id: id,
    title: String((flacFile && flacFile.title) || doc.title || ''),
    artist: String(doc.creator || doc.artist || ''),
    album: String(doc.title || ''),
    albumCover: 'https://archive.org/services/img/' + encodeURIComponent(doc.identifier),
    duration: dur,
    audioQuality: 'LOSSLESS',
    format: 'flac'
  };
}

var MONO_BASE = 'https://tracks.monochrome.st';
var PENCARI_BASE = 'https://stream.pencarimovie.com/66ff097863dedb7ccd8401d5ffe616f3/music';

async function fetchMonochrome(text, limit) {
  try {
    var searchLimit = Math.max(1, Math.min(30, limit || 15));
    var res = await json(query(MONO_BASE + '/search/tracks', { q: text, limit: searchLimit }), null, 6000);
    var rows = (res.data && res.data.tracks) || res.tracks || [];
    if (Array.isArray(rows) && rows.length > 0) {
      return rows.filter(function (t) {
        return t && (t.id != null || t.trackId != null) && (t.title || t.name) && t.playable !== false;
      }).slice(0, searchLimit).map(parseMonoTrack);
    }
  } catch (_) {}
  return [];
}

async function fetchPencari(text, limit) {
  try {
    var searchLimit = Math.max(1, Math.min(30, limit || 15));
    var res = await json(query(PENCARI_BASE + '/search', { q: text }), null, 6000);
    var rows = res.tracks || [];
    if (Array.isArray(rows) && rows.length > 0) {
      return rows.filter(function (t) {
        return t && t.id && t.title;
      }).slice(0, searchLimit).map(parsePencariTrack);
    }
  } catch (_) {}
  return [];
}

async function fetchArchive(text, limit) {
  try {
    var searchLimit = Math.max(1, Math.min(10, limit || 5));
    var sUrl = 'https://archive.org/advancedsearch.php?q=mediatype:(audio)+AND+format:(Flac)+AND+' +
      encodeURIComponent('(' + text + ')') + '&fl[]=identifier,title,creator,year&rows=' + searchLimit + '&output=json';
    var res = await json(sUrl, null, 7000);
    var docs = (res.response && res.response.docs) || [];
    var tracks = [];
    for (var i = 0; i < docs.length; i++) {
      tracks.push(parseArchiveTrack(docs[i], null));
    }
    return tracks;
  } catch (_) {}
  return [];
}

async function searchTracks(text, limit, context) {
  var searchLimit = Math.max(1, Math.min(30, limit || 15));
  try {
    if (config.type === 'wiochord-lossless') {
      var monoPromise = fetchMonochrome(text, searchLimit);
      var pmPromise = fetchPencari(text, searchLimit);
      var results = await Promise.all([monoPromise, pmPromise]);
      var mTracks = results[0] || [];
      var pTracks = results[1] || [];

      // Interleave results so both catalogues provide candidates to TrackMatcher
      var combined = [];
      var maxLen = Math.max(mTracks.length, pTracks.length);
      for (var i = 0; i < maxLen; i++) {
        if (i < mTracks.length) combined.push(mTracks[i]);
        if (i < pTracks.length) combined.push(pTracks[i]);
      }
      if (combined.length > 0) {
        return { tracks: combined.slice(0, searchLimit), total: combined.length };
      }

      // Fallback to Archive if both are empty
      var iaTracks = await fetchArchive(text, searchLimit);
      return { tracks: iaTracks, total: iaTracks.length };
    } else if (config.type === 'monochrome') {
      var mTracks = await fetchMonochrome(text, searchLimit);
      if (mTracks.length > 0) return { tracks: mTracks, total: mTracks.length };
      var pTracks = await fetchPencari(text, searchLimit);
      return { tracks: pTracks, total: pTracks.length };
    } else if (config.type === 'pencarimusic') {
      var pTracks = await fetchPencari(text, searchLimit);
      if (pTracks.length > 0) return { tracks: pTracks, total: pTracks.length };
      var mTracks = await fetchMonochrome(text, searchLimit);
      return { tracks: mTracks, total: mTracks.length };
    } else if (config.type === 'archive') {
      var iaTracks = await fetchArchive(text, searchLimit);
      return { tracks: iaTracks, total: iaTracks.length };
    } else {
      var mTracks = await fetchMonochrome(text, searchLimit);
      return { tracks: mTracks, total: mTracks.length };
    }
  } catch (_) {
    return { tracks: [], total: 0 };
  }
}

async function getTrackStreamUrl(id, quality, context) {
  try {
    var rawId = decodeURIComponent(String(id));
    if (rawId.indexOf('pm::') === 0) {
      var cleanPmId = rawId.replace(/^pm::/, '');
      var pmRes = await json(PENCARI_BASE + '/stream/' + encodeURIComponent(cleanPmId), null, 8000);
      if (pmRes && pmRes.url) {
        return {
          streamUrl: pmRes.url,
          track: {
            id: String(id),
            audioQuality: 'LOSSLESS',
            mimeType: pmRes.mimeType || 'audio/flac',
            bitDepth: Number(pmRes.bitDepth) || 24,
            sampleRate: Number(pmRes.sampleRate) || 96000,
            audioModes: ['STEREO']
          }
        };
      }
    } else if (rawId.indexOf('ia::') === 0) {
      var parts = rawId.split('::');
      var iaId = parts[1];
      var fileName = parts[2];
      if (!fileName) {
        var mRes = await json('https://archive.org/metadata/' + encodeURIComponent(iaId), null, 8000);
        var files = (mRes && mRes.files) || [];
        var flac = files.find(function (f) { return (f.format === 'Flac' || (f.name && f.name.toLowerCase().endsWith('.flac'))); });
        if (flac) fileName = flac.name;
      }
      if (fileName) {
        return {
          streamUrl: 'https://archive.org/download/' + encodeURIComponent(iaId) + '/' + encodeURIComponent(fileName),
          track: {
            id: String(id),
            audioQuality: 'LOSSLESS',
            mimeType: 'audio/flac',
            bitDepth: 16,
            sampleRate: 44100,
            audioModes: ['STEREO']
          }
        };
      }
    }

    // Default to Monochrome
    var cleanMonoId = rawId.replace(/^[a-zA-Z0-9_-]+::/, '');
    return {
      streamUrl: MONO_BASE + '/track/' + encodeURIComponent(cleanMonoId),
      track: {
        id: String(id),
        audioQuality: 'LOSSLESS',
        mimeType: 'audio/flac',
        bitDepth: 16,
        sampleRate: 44100,
        audioModes: ['STEREO']
      }
    };
  } catch (_) {
    var fallbackId = decodeURIComponent(String(id)).replace(/^[a-zA-Z0-9_-]+::/, '');
    return {
      streamUrl: MONO_BASE + '/track/' + encodeURIComponent(fallbackId),
      track: {
        id: String(id),
        audioQuality: 'LOSSLESS',
        mimeType: 'audio/flac',
        bitDepth: 16,
        sampleRate: 44100,
        audioModes: ['STEREO']
      }
    };
  }
}

module.exports = {
  searchTracks: searchTracks,
  getTrackStreamUrl: getTrackStreamUrl
};

})();
