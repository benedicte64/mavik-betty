'use strict';

const http = require('node:http');
const { URL } = require('node:url');

const PORT = Number(process.env.GCOS_PORT || 4782);
const HOST = process.env.GCOS_HOST || '127.0.0.1';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'app6i45G4WG2nmQff';
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN || '';
const ALLOWED_ORIGIN = process.env.GCOS_ALLOWED_ORIGIN || '*';

function json(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type, X-GCOS-Client',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 2_000_000) throw Object.assign(new Error('GCOS_BODY_TOO_LARGE'), { status: 413 });
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function requireAirtable(res) {
  if (AIRTABLE_TOKEN) return true;
  json(res, 503, { error: 'AIRTABLE_NOT_CONFIGURED' });
  return false;
}

async function airtableRequest(table, options = {}) {
  const recordSuffix = options.recordId ? `/${encodeURIComponent(options.recordId)}` : '';
  const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}${recordSuffix}`);
  Object.entries(options.query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  });
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error?.message || `AIRTABLE_${response.status}`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);

  try {
    if (req.method === 'GET' && url.pathname === '/health') {
      return json(res, 200, {
        service: 'GCOS Server',
        version: '0.2.0',
        airtableConfigured: Boolean(AIRTABLE_TOKEN),
        host: HOST,
        time: new Date().toISOString()
      });
    }

    const recordMatch = url.pathname.match(/^\/api\/airtable\/tables\/([^/]+)\/([^/]+)$/);
    if (recordMatch && req.method === 'PATCH') {
      if (!requireAirtable(res)) return;
      const table = decodeURIComponent(recordMatch[1]);
      const recordId = decodeURIComponent(recordMatch[2]);
      const body = await readBody(req);
      const payload = await airtableRequest(table, { method: 'PATCH', recordId, body });
      return json(res, 200, payload);
    }

    const tableMatch = url.pathname.match(/^\/api\/airtable\/tables\/([^/]+)$/);
    if (tableMatch && req.method === 'GET') {
      if (!requireAirtable(res)) return;
      const table = decodeURIComponent(tableMatch[1]);
      const payload = await airtableRequest(table, {
        query: {
          maxRecords: url.searchParams.get('maxRecords') || 50,
          view: url.searchParams.get('view') || undefined,
          filterByFormula: url.searchParams.get('filterByFormula') || undefined
        }
      });
      return json(res, 200, payload);
    }

    if (tableMatch && req.method === 'POST') {
      if (!requireAirtable(res)) return;
      const table = decodeURIComponent(tableMatch[1]);
      const body = await readBody(req);
      const payload = await airtableRequest(table, { method: 'POST', body });
      return json(res, 201, payload);
    }

    return json(res, 404, { error: 'GCOS_ROUTE_NOT_FOUND' });
  } catch (error) {
    console.error('[GCOS]', error);
    return json(res, error.status || 500, { error: error.message || 'GCOS_INTERNAL_ERROR' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`GCOS Server started on http://${HOST}:${PORT}`);
  console.log(`Airtable: ${AIRTABLE_TOKEN ? 'configured' : 'not configured'}`);
});