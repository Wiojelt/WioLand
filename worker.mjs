import { httpServerHandler } from 'cloudflare:node';
import { createApp } from './server.mjs';
import { createProvider } from './providers.mjs';
import sources from './sources.json';
import page from './index.html';

let handler;
export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/') return new Response(page, { headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=300',
    } });
    if (!handler) {
      const app = createApp(sources.map(s => createProvider(s, { env: {} })), { PUBLIC_URL: url.origin });
      app.listen(8787);
      handler = httpServerHandler({ port: 8787 });
    }
    return handler.fetch(request);
  },
};
