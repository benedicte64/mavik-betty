'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const net = require('node:net');

const CONFIG_FILE = path.join(__dirname, 'data', 'calendar-config.json');
const PROVIDERS = Object.freeze(['google', 'outlook', 'ical']);

function defaultConfig() {
  return { feedToken: crypto.randomBytes(24).toString('hex'), calendars: [], lastSyncAt: '', lastSyncError: '' };
}
function ensure() {
  fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
  if (!fs.existsSync(CONFIG_FILE)) fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig(), null, 2), 'utf8');
}
function read() {
  ensure();
  try {
    const parsed = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    const calendars = Array.isArray(parsed.calendars) ? parsed.calendars.map(normalizeCalendar) : [];
    if (!calendars.length && parsed.googlePrivateIcalUrl) calendars.push(normalizeCalendar({
      id: 'google-legacy', name: 'Google Agenda', provider: 'google', iCalUrl: parsed.googlePrivateIcalUrl,
      blocksOperations: parsed.blockWorkshopFromGoogle === true, enabled: true
    }));
    return { ...defaultConfig(), ...parsed, calendars };
  }
  catch { const value = defaultConfig(); write(value); return value; }
}
function write(value) {
  ensure();
  const temp = `${CONFIG_FILE}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(value, null, 2), 'utf8');
  fs.renameSync(temp, CONFIG_FILE);
}
function normalizeCalendar(input = {}, index = 0) {
  const provider = PROVIDERS.includes(String(input.provider || '').toLowerCase()) ? String(input.provider).toLowerCase() : 'ical';
  const name = String(input.name || `${provider === 'google' ? 'Google Agenda' : provider === 'outlook' ? 'Outlook' : 'Calendrier iCal'} ${index + 1}`).trim().slice(0, 80);
  const id = String(input.id || `${provider}-${crypto.createHash('sha1').update(`${name}|${input.iCalUrl || index}`).digest('hex').slice(0, 10)}`).trim().replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 80);
  const color = /^#[0-9a-f]{6}$/i.test(String(input.color || '')) ? String(input.color) : provider === 'google' ? '#4285f4' : provider === 'outlook' ? '#0078d4' : '#6d38f0';
  return {
    id, name, provider, color,
    account: String(input.account || '').trim().slice(0, 160),
    iCalUrl: String(input.iCalUrl || '').trim(),
    enabled: input.enabled !== false,
    blocksOperations: input.blocksOperations === true || input.blocksWorkshop === true,
    lastSyncAt: String(input.lastSyncAt || ''), lastSyncError: String(input.lastSyncError || '')
  };
}
function safeCalendarUrl(value) {
  let parsed;
  try { parsed = new URL(String(value || '')); } catch { throw Object.assign(new Error('CALENDAR_ICAL_URL_INVALID'), { status: 400 }); }
  const hostname = parsed.hostname.toLowerCase();
  const privateIpv4 = /^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname);
  const privateIpv6 = hostname === '::1' || hostname.startsWith('fe80:') || hostname.startsWith('fc') || hostname.startsWith('fd');
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || hostname === 'localhost' || hostname.endsWith('.local') || hostname.endsWith('.internal') || (net.isIP(hostname) === 4 && privateIpv4) || (net.isIP(hostname) === 6 && privateIpv6)) {
    throw Object.assign(new Error('CALENDAR_ICAL_URL_INVALID'), { status: 400 });
  }
  return parsed.toString();
}
function maskedCalendarUrl(value) {
  if (!value) return '';
  try { const parsed = new URL(value); return `${parsed.protocol}//${parsed.host}/••••`; } catch { return '••••'; }
}
function publicCalendar(calendar) {
  return {
    id: calendar.id, name: calendar.name, provider: calendar.provider, color: calendar.color, account: calendar.account,
    configured: Boolean(calendar.iCalUrl), enabled: calendar.enabled !== false, blocksOperations: calendar.blocksOperations === true,
    iCalUrlMasked: maskedCalendarUrl(calendar.iCalUrl), lastSyncAt: calendar.lastSyncAt || '', lastSyncError: calendar.lastSyncError || ''
  };
}
function settings(origin = '', user = {}) {
  const config = read();
  const calendars = config.calendars.map(publicCalendar);
  const legacyGoogle = config.calendars.find((calendar) => calendar.provider === 'google');
  return {
    configured: calendars.some((calendar) => calendar.configured && calendar.enabled),
    calendars,
    providers: [...PROVIDERS],
    googlePrivateIcalUrlMasked: maskedCalendarUrl(legacyGoogle?.iCalUrl),
    blockWorkshopFromGoogle: legacyGoogle?.blocksOperations === true,
    lastSyncAt: config.lastSyncAt || '',
    lastSyncError: config.lastSyncError || '',
    feedUrl: ['admin', 'associate'].includes(user.role) ? `${String(origin || '').replace(/\/$/, '')}/calendar/mavik.ics?token=${encodeURIComponent(config.feedToken)}` : '',
    automaticGoogleApiConfigured: Boolean(process.env.GCOS_GOOGLE_CALENDAR_ACCESS_TOKEN && process.env.GCOS_GOOGLE_CALENDAR_ID)
  };
}
function configure(input = {}, user = {}) {
  if (!['admin', 'associate'].includes(user.role)) throw Object.assign(new Error('CALENDAR_DIRECTION_REQUIRED'), { status: 403 });
  const current = read();
  let calendars = [...current.calendars];
  if (Array.isArray(input.calendars)) calendars = input.calendars.map((item, index) => {
    const existing = current.calendars.find((calendar) => calendar.id === item.id) || {};
    return normalizeCalendar({ ...existing, ...item, iCalUrl: item.iCalUrl === undefined ? existing.iCalUrl : item.iCalUrl }, index);
  });
  if (input.calendar && typeof input.calendar === 'object') {
    const existingIndex = calendars.findIndex((calendar) => calendar.id === input.calendar.id);
    const existing = existingIndex >= 0 ? calendars[existingIndex] : {};
    const normalized = normalizeCalendar({ ...existing, ...input.calendar, iCalUrl: input.calendar.iCalUrl === undefined ? existing.iCalUrl : input.calendar.iCalUrl }, Math.max(existingIndex, 0));
    if (existingIndex >= 0) calendars[existingIndex] = normalized; else calendars.push(normalized);
  }
  if (input.removeCalendarId) calendars = calendars.filter((calendar) => calendar.id !== String(input.removeCalendarId));
  if (input.googlePrivateIcalUrl !== undefined) {
    const existingIndex = calendars.findIndex((calendar) => calendar.provider === 'google');
    const existing = existingIndex >= 0 ? calendars[existingIndex] : {};
    const normalized = normalizeCalendar({ ...existing, id: existing.id || 'google-primary', name: existing.name || 'Google Agenda', provider: 'google', iCalUrl: input.googlePrivateIcalUrl, blocksOperations: input.blockWorkshopFromGoogle === true });
    if (existingIndex >= 0) calendars[existingIndex] = normalized; else calendars.push(normalized);
  }
  if (calendars.length > 20) throw Object.assign(new Error('CALENDAR_LIMIT_REACHED'), { status: 400 });
  calendars = calendars.map((calendar) => ({ ...calendar, iCalUrl: calendar.iCalUrl ? safeCalendarUrl(calendar.iCalUrl) : '' }));
  const next = { ...current, calendars, updatedAt: new Date().toISOString(), updatedBy: user.name || user.id || '' };
  write(next);
  return settings(input.origin || '', user);
}
function unfold(value) { return String(value || '').replace(/\r?\n[ \t]/g, ''); }
function parseDateValue(raw) {
  const value = String(raw || '').trim();
  if (/^\d{8}$/.test(value)) return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  if (/^\d{8}T\d{6}Z?$/.test(value)) {
    const iso = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(9, 11)}:${value.slice(11, 13)}:${value.slice(13, 15)}${value.endsWith('Z') ? 'Z' : ''}`;
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString();
  }
  return '';
}
function parseIcs(content) {
  const text = unfold(content);
  return [...text.matchAll(/BEGIN:VEVENT\r?\n([\s\S]*?)\r?\nEND:VEVENT/g)].map((match) => {
    const lines = match[1].split(/\r?\n/);
    const field = (name) => {
      const line = lines.find((item) => item.startsWith(`${name}:`) || item.startsWith(`${name};`));
      return line ? line.slice(line.indexOf(':') + 1).replace(/\\n/g, ' ').replace(/\\,/g, ',').trim() : '';
    };
    return {
      uid: field('UID') || crypto.randomUUID(),
      title: field('SUMMARY') || 'Événement agenda',
      description: field('DESCRIPTION'),
      location: field('LOCATION'),
      start: parseDateValue(field('DTSTART')),
      end: parseDateValue(field('DTEND')),
      status: field('STATUS') || 'CONFIRMED'
    };
  }).filter((event) => event.start && !/CANCELLED/i.test(event.status));
}
function dateOnly(value) { return String(value || '').slice(0, 10); }
async function sync(store, user = {}) {
  const config = read();
  const calendars = config.calendars.filter((calendar) => calendar.enabled !== false && calendar.iCalUrl);
  if (!calendars.length) throw Object.assign(new Error('CALENDAR_NOT_CONFIGURED'), { status: 409 });
  const existing = store.list('externalCalendarEvents') || [];
  const results = [];
  for (let index = 0; index < config.calendars.length; index += 1) {
    const calendar = config.calendars[index];
    if (calendar.enabled === false || !calendar.iCalUrl) continue;
    try {
      const response = await fetch(calendar.iCalUrl, { headers: { 'User-Agent': 'MAVIK-Calendar/2.0' }, signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`CALENDAR_FETCH_${response.status}`);
      const events = parseIcs(await response.text());
      const received = new Set();
      for (const event of events) {
        const uid = `${calendar.id}:${event.uid}`;
        received.add(uid);
        const current = existing.find((item) => item.uid === uid);
        const patch = { ...event, uid, sourceUid: event.uid, calendarId: calendar.id, calendarName: calendar.name, provider: calendar.provider, color: calendar.color, source: `${calendar.name} · iCal`, startDate: dateOnly(event.start), endDate: dateOnly(event.end || event.start), blocksWorkshop: calendar.blocksOperations === true, syncedAt: new Date().toISOString() };
        if (current) store.update('externalCalendarEvents', current.id, patch); else store.create('externalCalendarEvents', patch);
      }
      for (const old of existing.filter((item) => item.calendarId === calendar.id)) if (!received.has(old.uid)) store.update('externalCalendarEvents', old.id, { status: 'Supprimé du calendrier source', blocksWorkshop: false, removedAt: new Date().toISOString() });
      config.calendars[index] = { ...calendar, lastSyncAt: new Date().toISOString(), lastSyncError: '' };
      results.push({ calendarId: calendar.id, name: calendar.name, imported: events.length, ok: true });
    } catch (error) {
      config.calendars[index] = { ...calendar, lastSyncAt: new Date().toISOString(), lastSyncError: String(error.message || error) };
      results.push({ calendarId: calendar.id, name: calendar.name, imported: 0, ok: false, error: String(error.message || error) });
    }
  }
  const imported = results.reduce((total, result) => total + result.imported, 0);
  const failed = results.filter((result) => !result.ok);
  write({ ...config, lastSyncAt: new Date().toISOString(), lastSyncError: failed.map((item) => `${item.name}: ${item.error}`).join(' · ') });
  if (failed.length === results.length) throw Object.assign(new Error('CALENDAR_SYNC_FAILED'), { status: 502, failures: failed });
  return { imported, failed: failed.length, results, settings: settings('', user) };
}
function esc(value) { return String(value || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;'); }
function icsDate(value, endOfDay = false) {
  const raw = String(value || '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw.replace(/-/g, '');
  const date = new Date(raw || Date.now());
  if (Number.isNaN(date.getTime())) return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  if (endOfDay) date.setHours(17, 0, 0, 0);
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}
function icsProperty(name, value) {
  const raw = String(value || '');
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${name};VALUE=DATE:${icsDate(raw)}` : `${name}:${icsDate(raw)}`;
}
function collectPlanningEvents(store) {
  const out = [];
  for (const item of store.list('interventions') || []) {
    const start = item.scheduledDate || item.estimatedStartDate;
    if (!start || /annul|archiv/i.test(String(item.status || ''))) continue;
    out.push({ uid: `intervention-${item.id}@mavik`, title: item.service || item.number || 'Intervention GentleCarE', start, end: item.estimatedEndDate || start, description: `${item.number || ''} · ${item.status || ''}` });
  }
  for (const item of store.list('planningBlocks') || []) {
    if (!item.startDate || /annul|inactif/i.test(String(item.status || ''))) continue;
    out.push({ uid: `block-${item.id}@mavik`, title: item.title || item.type || 'Planning GentleCarE', start: item.startDate, end: item.endDate || item.startDate, description: item.notes || '' });
  }
  for (const item of store.list('tasks') || []) {
    if (!item.dueDate || /termin|annul/i.test(String(item.status || ''))) continue;
    out.push({ uid: `task-${item.id}@mavik`, title: `Tâche — ${item.title || ''}`, start: item.dueDate, end: item.dueDate, description: item.assignee || '' });
  }
  for (const item of store.list('meetings') || []) {
    if (!item.start || /annul/i.test(String(item.status || ''))) continue;
    out.push({ uid: `meeting-${item.id}@mavik`, title: item.title || 'Réunion', start: item.start, end: item.end || item.start, description: `${item.department || ''} · ${(item.attendees || []).join(', ')}` });
  }
  for (const item of store.list('softwareProjects') || []) {
    if (!item.targetDate || /termin|annul/i.test(String(item.status || ''))) continue;
    out.push({ uid: `software-project-${item.id}@mavik`, title: `Échéance produit — ${item.name || item.product || ''}`, start: item.targetDate, end: item.targetDate, description: `${item.status || ''} · ${item.owner || ''}` });
  }
  return out;
}
function buildIcs(store) {
  const now = icsDate(new Date().toISOString());
  const events = collectPlanningEvents(store).map((event) => `BEGIN:VEVENT\r\nUID:${esc(event.uid)}\r\nDTSTAMP:${now}\r\n${icsProperty('DTSTART', event.start)}\r\n${icsProperty('DTEND', event.end)}\r\nSUMMARY:${esc(event.title)}\r\nDESCRIPTION:${esc(event.description)}\r\nEND:VEVENT`).join('\r\n');
  return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Avenor//MAVIK//FR\r\nCALSCALE:GREGORIAN\r\nX-WR-CALNAME:MAVIK — Agenda unifié\r\n${events}\r\nEND:VCALENDAR\r\n`;
}
function tokenValid(token) {
  if (!token) return false;
  const supplied = Buffer.from(String(token));
  const expected = Buffer.from(String(read().feedToken || ''));
  return supplied.length === expected.length && supplied.length > 0 && crypto.timingSafeEqual(supplied, expected);
}

module.exports = { CONFIG_FILE, PROVIDERS, settings, configure, sync, buildIcs, tokenValid, parseIcs, normalizeCalendar, safeCalendarUrl, maskedCalendarUrl };
