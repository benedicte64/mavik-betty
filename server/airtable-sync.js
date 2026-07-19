'use strict';

const { URL } = require('node:url');

function baseId() { return process.env.AIRTABLE_BASE_ID || 'app6i45G4WG2nmQff'; }
function token() { return process.env.AIRTABLE_TOKEN || ''; }

const MAP = {
  clients: { table: 'Clients', fields: { name: 'Nom complet', email: 'Email', phone: 'Téléphone', notes: 'Notes client', status: 'Statut client', source: 'Origine du contact', clientType: 'Type de client' } },
  vehicles: { table: 'Véhicules', fields: { label: 'Véhicule', brand: 'Marque', model: 'Modèle', year: 'Année', mileage: 'Kilométrage', registration: 'Immatriculation', vin: 'VIN', history: 'Historique / état' }, links: { clientId: 'Client' } },
  interventions: { table: 'Interventions', fields: { number: 'Intervention', scheduledDate: 'Date prévue', status: 'Statut', technician: 'Technicien', report: 'Compte rendu', dryIceKg: 'Glace réelle utilisée kg', dinitrolLiters: 'Dinitrol utilisé L' }, links: { clientId: 'Client', vehicleId: 'Véhicule', quoteId: 'Dossier / devis' } },
  tasks: { table: 'Tâches Jarvis', fields: { title: 'Tâche', status: 'Statut', priority: 'Priorité', assignee: 'Responsable', dueDate: 'Échéance', instructions: 'Instructions', result: 'Résultat / suivi' } },
  stockItems: { table: 'Stocks et consommables', fields: { name: 'Article', category: 'Catégorie', reference: 'Référence', quantity: 'Quantité en stock', unit: 'Unité', alertThreshold: 'Seuil d’alerte', unitPriceHt: 'Prix unitaire HT', location: 'Emplacement', notes: 'Notes' } },
  quotes: { table: 'Dossiers et devis', fields: { number: 'Dossier', status: 'Statut', totalTtc: 'Montant TTC', requestDate: 'Date de demande', quoteDate: 'Date du devis', nextAction: 'Prochaine action', followUpDate: 'Échéance de suivi', notes: 'Notes' }, links: { clientId: 'Client', vehicleId: 'Véhicule' } },
  documents: { table: 'Centre documentaire', fields: { title: 'Document', category: 'Catégorie', subcategory: 'Sous-catégorie', summary: 'Résumé Jarvis', addedDate: 'Date d’ajout' } }
};

let lastHealth = { checkedAt: null, ok: null, detail: 'Connexion non testée', latencyMs: null };

function configured() { return Boolean(token()); }

async function request(table, options = {}) {
  const currentToken = token();
  if (!currentToken) throw Object.assign(new Error('AIRTABLE_NOT_CONFIGURED'), { status: 503 });
  const suffix = options.recordId ? `/${encodeURIComponent(options.recordId)}` : '';
  const url = new URL(`https://api.airtable.com/v0/${baseId()}/${encodeURIComponent(table)}${suffix}`);
  for (const [key, value] of Object.entries(options.query || {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number(options.timeoutMs || 12000));
  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: { Authorization: `Bearer ${currentToken}`, 'Content-Type': 'application/json' },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(payload?.error?.message || `AIRTABLE_${response.status}`), { status: response.status });
    return payload;
  } finally {
    clearTimeout(timer);
  }
}

async function testConnection() {
  const checkedAt = new Date().toISOString();
  if (!configured()) {
    lastHealth = { checkedAt, ok: false, detail: 'AIRTABLE_TOKEN absent', latencyMs: null };
    return lastHealth;
  }
  const started = Date.now();
  try {
    const payload = await request(MAP.clients.table, { query: { maxRecords: 1 }, timeoutMs: 10000 });
    lastHealth = {
      checkedAt,
      ok: true,
      detail: `Base ${baseId()} accessible · table ${MAP.clients.table}`,
      latencyMs: Date.now() - started,
      sampleRecords: Array.isArray(payload.records) ? payload.records.length : 0
    };
  } catch (error) {
    lastHealth = {
      checkedAt,
      ok: false,
      detail: String(error.message || error),
      latencyMs: Date.now() - started,
      status: error.status || null
    };
  }
  return lastHealth;
}

function findLinkedAirtableId(store, localId) {
  if (!localId) return null;
  for (const collection of ['clients', 'vehicles', 'quotes', 'interventions']) {
    const match = store.list(collection).find((item) => item.id === localId);
    if (match?.airtableId) return match.airtableId;
  }
  return null;
}

function buildFields(collection, record, store) {
  const config = MAP[collection];
  if (!config) throw Object.assign(new Error('SYNC_COLLECTION_NOT_SUPPORTED'), { status: 400 });
  const fields = {};
  for (const [localName, airtableName] of Object.entries(config.fields || {})) {
    const value = record[localName];
    if (value !== undefined && value !== null && value !== '') fields[airtableName] = value;
  }
  if (collection === 'vehicles' && !fields.Véhicule) fields.Véhicule = [record.brand, record.model, record.registration].filter(Boolean).join(' ') || 'Véhicule';
  for (const [localName, airtableName] of Object.entries(config.links || {})) {
    const linkedId = findLinkedAirtableId(store, record[localName]);
    if (linkedId) fields[airtableName] = [linkedId];
  }
  return fields;
}

async function push(collection, record, store) {
  const config = MAP[collection];
  if (!config) throw Object.assign(new Error('SYNC_COLLECTION_NOT_SUPPORTED'), { status: 400 });
  const fields = buildFields(collection, record, store);
  const payload = record.airtableId
    ? await request(config.table, { method: 'PATCH', recordId: record.airtableId, body: { fields, typecast: true } })
    : await request(config.table, { method: 'POST', body: { fields, typecast: true } });
  const syncedAt = new Date().toISOString();
  if (record.id) store.update(collection, record.id, { airtableId: payload.id, airtableSyncedAt: syncedAt, airtableSyncError: '' });
  return { collection, localId: record.id, airtableId: payload.id, syncedAt, fields: payload.fields || fields };
}

async function pushAll(store, collections = Object.keys(MAP)) {
  const results = [];
  for (const collection of collections) {
    if (!MAP[collection]) continue;
    for (const record of store.list(collection)) {
      try { results.push({ ok: true, ...(await push(collection, record, store)) }); }
      catch (error) {
        if (record.id) store.update(collection, record.id, { airtableSyncError: error.message });
        results.push({ ok: false, collection, localId: record.id, error: error.message });
      }
    }
  }
  return { configured: configured(), total: results.length, succeeded: results.filter((item) => item.ok).length, failed: results.filter((item) => !item.ok).length, results };
}

function status() {
  return {
    configured: configured(),
    baseId: baseId(),
    supportedCollections: Object.keys(MAP),
    health: lastHealth
  };
}

module.exports = { MAP, configured, status, request, testConnection, push, pushAll };
