'use strict';

const SOURCE_CATALOG = Object.freeze([
  { id:'gmail', label:'E-mails' },
  { id:'calendar', label:'Agenda' },
  { id:'crm', label:'CRM' },
  { id:'stock', label:'Stock' },
  { id:'accounting', label:'Comptabilité' },
  { id:'telephony', label:'Téléphonie' },
  { id:'documents', label:'Documents' },
  { id:'workshop', label:'Opérations' },
  { id:'ai', label:'Analyses IA' },
  { id:'mavik', label:'MAVIK' }
]);

const SOURCE_IDS = new Set(SOURCE_CATALOG.map((source) => source.id));
const ROLE_DEPARTMENT = Object.freeze({
  admin:'direction', associate:'direction', commercial:'commercial', secretary:'secretariat',
  accountant:'accounting', developer:'product', support:'product', technician:'operations', trainee:'discovery'
});
const INTERNAL_SOURCES = Object.freeze({
  clients:'crm', opportunities:'crm', subscriptions:'crm', communications:'gmail',
  meetings:'calendar', externalCalendarEvents:'calendar', stockItems:'stock',
  invoices:'accounting', expenses:'accounting', contracts:'documents', documents:'documents', photos:'documents',
  interventions:'workshop', vehicles:'workshop', observations:'workshop', quotes:'crm', quoteRequests:'crm',
  supportTickets:'mavik', softwareProducts:'mavik', softwareProjects:'mavik', tasks:'mavik'
});
const PRIVATE_KEYS = /^(password|motdepasse|mot_de_passe|pin|token|secret|authorization|cookie|api[_-]?key|icalurl|privateurl|access[_-]?token|refresh[_-]?token)$/i;

function text(value, max = 500) { return String(value ?? '').trim().slice(0, max); }
function safeList(store, collection) { try { return store.list(collection) || []; } catch { return []; } }
function sourceId(value) { const source = text(value, 40).toLowerCase().replace(/[^a-z0-9_-]/g, ''); if (!source) return 'mavik'; if (!SOURCE_IDS.has(source)) throw Object.assign(new Error('OPERATIONAL_EVENT_SOURCE_INVALID'), { status:400 }); return source; }
function eventType(value) { const type = text(value, 120).toLowerCase().replace(/[^a-z0-9_.-]/g, '-'); if (!type || !type.includes('.')) throw Object.assign(new Error('OPERATIONAL_EVENT_TYPE_REQUIRED'), { status:400 }); return type; }
function tenantId(input = {}, user = {}) { return text(input.tenantId || user.tenantId || user.companyId || 'avenor', 80).toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'avenor'; }
function importance(value) { return ['info','normal','warning','urgent','critical'].includes(value) ? value : 'normal'; }

function redact(value, depth = 0) {
  if (depth > 6) return '[profondeur limitée]';
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => redact(item, depth + 1));
  if (!value || typeof value !== 'object') return typeof value === 'string' ? value.slice(0, 4000) : value;
  const output = {};
  for (const [key, item] of Object.entries(value).slice(0, 100)) output[key] = PRIVATE_KEYS.test(key) ? '[masqué]' : redact(item, depth + 1);
  return output;
}

function departmentFor(source, type, requested = '') {
  if (requested) return text(requested, 40).toLowerCase();
  if (source === 'accounting') return 'accounting';
  if (source === 'crm' || /quote|devis|customer|client|prospect/.test(type)) return 'commercial';
  if (source === 'stock' || source === 'workshop') return 'operations';
  if (source === 'documents' || source === 'gmail' || source === 'telephony') return 'secretariat';
  if (source === 'ai') return 'direction';
  if (/support|software|project|product/.test(type)) return 'product';
  return 'general';
}

function visibleTo(event, user = {}) {
  if (event.tenantId !== tenantId({}, user)) return false;
  if (['admin','associate'].includes(user.role)) return true;
  if (Array.isArray(event.visibleRoles) && event.visibleRoles.length) return event.visibleRoles.includes(user.role);
  return ['general', ROLE_DEPARTMENT[user.role]].includes(event.department);
}

function ingest(store, input = {}, user = {}) {
  const source = sourceId(input.source);
  const type = eventType(input.type);
  const externalId = text(input.externalId || input.eventId, 180);
  const tenant = tenantId(input, user);
  if (externalId) {
    const existing = safeList(store, 'operationalEvents').find((event) => event.tenantId === tenant && event.source === source && event.externalId === externalId);
    if (existing) return { event:existing, duplicate:true };
  }
  const data = redact(input.data || input.payload || {});
  const serialized = JSON.stringify(data);
  if (Buffer.byteLength(serialized, 'utf8') > 64 * 1024) throw Object.assign(new Error('OPERATIONAL_EVENT_TOO_LARGE'), { status:413 });
  const receivedAt = new Date().toISOString();
  const event = store.create('operationalEvents', {
    tenantId:tenant, source, type, externalId,
    title:text(input.title || type.replace(/[._-]+/g, ' '), 180),
    summary:text(input.summary || input.explanation || 'Événement reçu par MAVIK.', 1000),
    entity:{ type:text(input.entity?.type || input.entityType, 80), id:text(input.entity?.id || input.entityId || input.recordId, 180) },
    data, department:departmentFor(source, type, input.department),
    visibleRoles:Array.isArray(input.visibleRoles) ? [...new Set(input.visibleRoles.map((role) => text(role, 30)).filter(Boolean))] : [],
    importance:importance(input.importance), requiresValidation:input.requiresValidation === true,
    status:'received', occurredAt:text(input.occurredAt, 40) || receivedAt, receivedAt,
    originEventId:text(input.originEventId, 180),
    receivedBy:{ id:text(user.id, 100), name:text(user.name || user.username, 120), role:text(user.role, 40) },
    disclosure:{ visible:true, protectedFieldsMasked:true, dataKeys:Object.keys(data) }
  });
  return { event, duplicate:false };
}

function recordSummary(record = {}, collection = '') {
  const label = record.title || record.name || record.company || record.customer || record.number || record.subject || record.registration || record.id;
  return label ? `${collection} · ${label}` : `${collection} modifié dans MAVIK`;
}

function syncStoreEvents(store, limit = 300) {
  const mirrored = new Set(safeList(store, 'operationalEvents').map((event) => event.originEventId).filter(Boolean));
  const raw = safeList(store, 'events').slice(0, Math.max(1, Math.min(1000, Number(limit) || 300))).filter((event) => !mirrored.has(event.id));
  let imported = 0;
  for (const event of [...raw].reverse()) {
    const [collection, action] = text(event.type, 160).split('.');
    const source = INTERNAL_SOURCES[collection];
    if (!source || !action) continue;
    const record = safeList(store, collection).find((item) => item.id === event.recordId) || {};
    ingest(store, {
      source, type:`${collection}.${action}`, externalId:`mavik:${event.id}`, originEventId:event.id,
      title:recordSummary(record, collection), summary:`MAVIK a enregistré l’action « ${action} » dans ${collection}.`,
      entity:{ type:collection, id:event.recordId }, data:{ record }, occurredAt:event.createdAt,
      department:record.department || '', importance:/urgent|haute/i.test(String(record.priority || '')) ? 'urgent' : 'normal'
    }, { id:'mavik-system', name:'MAVIK', role:'system', tenantId:'avenor' });
    imported += 1;
  }
  return imported;
}

function list(store, user = {}, options = {}) {
  syncStoreEvents(store);
  const limit = Math.max(1, Math.min(200, Number(options.limit) || 50));
  const requestedSource = text(options.source, 40);
  return safeList(store, 'operationalEvents')
    .filter((event) => visibleTo(event, user))
    .filter((event) => !requestedSource || event.source === requestedSource)
    .slice(0, limit);
}

function status(store, user = {}) {
  syncStoreEvents(store);
  const events = safeList(store, 'operationalEvents').filter((event) => visibleTo(event, user));
  const now = Date.now();
  const sources = SOURCE_CATALOG.map((source) => {
    const matching = events.filter((event) => event.source === source.id);
    const lastEventAt = matching[0]?.receivedAt || '';
    const recent = lastEventAt && now - new Date(lastEventAt).getTime() < 24 * 60 * 60 * 1000;
    return { ...source, connected:matching.length > 0, state:recent ? 'active' : matching.length ? 'inactive' : 'waiting', eventCount:matching.length, lastEventAt };
  });
  const connectedSources = sources.filter((source) => source.connected).length;
  const activeSources = sources.filter((source) => source.state === 'active').length;
  return {
    ready:true, realtimeActive:activeSources > 0, connectedSources, activeSources, receivedEvents:events.length,
    lastEventAt:events[0]?.receivedAt || '', sources,
    statement:activeSources
      ? `Betty analyse les événements récents réellement reçus de ${activeSources} source(s).`
      : connectedSources
        ? 'Des sources ont déjà transmis des données, mais aucun événement récent ne permet d’annoncer une surveillance active.'
        : 'Betty est prête, mais aucun connecteur ne lui transmet encore d’événement en continu.'
  };
}

module.exports = { SOURCE_CATALOG, ingest, syncStoreEvents, list, status, visibleTo, redact };
