'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const softwareCompany = require('../software-company');
const calendar = require('../calendar-bridge');
const auth = require('../auth');

const configBackup = fs.existsSync(calendar.CONFIG_FILE) ? fs.readFileSync(calendar.CONFIG_FILE) : null;
const originalFetch = global.fetch;

function memoryStore() {
  const collections = {
    opportunities: [], softwareProducts: [], softwareProjects: [], subscriptions: [], invoices: [], expenses: [], contracts: [], supportTickets: [], meetings: [], tasks: [], externalCalendarEvents: [], interventions: [], planningBlocks: []
  };
  let sequence = 0;
  return {
    collections,
    list(name) { if (!collections[name]) collections[name] = []; return collections[name]; },
    create(name, input) { const record = { id: `record-${++sequence}`, ...input }; this.list(name).unshift(record); return record; },
    update(name, id, input) { const index = this.list(name).findIndex((item) => item.id === id); if (index < 0) throw new Error('NOT_FOUND'); this.list(name)[index] = { ...this.list(name)[index], ...input }; return this.list(name)[index]; }
  };
}

(async () => {
  const store = memoryStore();
  const admin = { id: 'direction-1', name: 'Direction Test', role: 'admin' };
  const created = softwareCompany.seedDemo(store, admin);
  assert.ok(created.overview.metrics.pipeline > 0);
  assert.ok(created.overview.metrics.mrr > 0);
  assert.equal(created.overview.profile.assistant, 'Betty');
  assert.throws(() => softwareCompany.seedDemo(store, { id: 'commercial-1', role: 'commercial' }), /SOFTWARE_COMPANY_DIRECTION_REQUIRED/);
  assert.ok(auth.ROLE_PERMISSIONS.secretary.includes('contracts.write'));
  assert.ok(auth.ROLE_PERMISSIONS.accountant.includes('invoices.write'));
  assert.ok(auth.ROLE_PERMISSIONS.developer.includes('softwareProjects.write'));
  const mascotPath = path.join(__dirname, '..', 'public', 'betty-mascot.webp');
  assert.ok(fs.existsSync(mascotPath));
  assert.ok(fs.statSync(mascotPath).size < 100_000);
  const commercialView = softwareCompany.overview(store, { id: 'commercial-1', role: 'commercial' }, auth.can);
  assert.ok(commercialView.opportunities.length > 0);
  assert.ok(commercialView.invoices.length > 0);
  assert.equal(commercialView.expenses.length, 0);

  calendar.configure({ calendars: [
    { id: 'team-google', name: 'Équipe', provider: 'google', iCalUrl: 'https://calendar.test/team.ics', color: '#4285f4' },
    { id: 'direction-outlook', name: 'Direction', provider: 'outlook', iCalUrl: 'https://calendar.test/direction.ics', color: '#0078d4' }
  ] }, admin);
  const settings = calendar.settings('http://localhost:4782', admin);
  assert.equal(settings.calendars.length, 2);
  assert.equal(settings.calendars.every((item) => !('iCalUrl' in item)), true);
  assert.equal(settings.calendars.every((item) => !item.iCalUrlMasked.includes('/team.ics') && !item.iCalUrlMasked.includes('/direction.ics')), true);
  assert.equal(calendar.settings('http://localhost:4782', { role: 'commercial' }).feedUrl, '');
  assert.throws(() => calendar.safeCalendarUrl('https://127.0.0.1/private.ics'), /CALENDAR_ICAL_URL_INVALID/);
  assert.match(settings.feedUrl, /calendar\/mavik\.ics\?token=/);

  global.fetch = async (url) => new Response(`BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:${String(url).includes('team') ? 'team-event' : 'direction-event'}\r\nDTSTART:20260907T090000Z\r\nDTEND:20260907T100000Z\r\nSUMMARY:Réunion MAVIK\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`, { status: 200 });
  const synced = await calendar.sync(store, admin);
  assert.equal(synced.imported, 2);
  assert.equal(store.list('externalCalendarEvents').length, 2);
  assert.ok(store.list('externalCalendarEvents').some((item) => item.uid === 'team-google:team-event'));
  assert.ok(store.list('externalCalendarEvents').some((item) => item.uid === 'direction-outlook:direction-event'));
  const feed = calendar.buildIcs(store);
  assert.match(feed, /MAVIK — Agenda unifié/);
  assert.match(feed, /Point commercial hebdomadaire|Revue produit MAVIK/);
  assert.match(feed, /DTSTART:\d{8}T\d{6}/);
  console.log('Software company operations and multi-calendar smoke test passed.');
})().finally(() => {
  global.fetch = originalFetch;
  if (configBackup) fs.writeFileSync(calendar.CONFIG_FILE, configBackup); else { try { fs.unlinkSync(calendar.CONFIG_FILE); } catch {} }
}).catch((error) => { console.error(error); process.exitCode = 1; });
