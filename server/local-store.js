'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'gcos-local.json');

const EMPTY_DB = {
  clients: [], vehicles: [], interventions: [], observations: [], communications: [], events: []
};

function ensureStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify(EMPTY_DB, null, 2), 'utf8');
}

function readStore() {
  ensureStore();
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return Object.fromEntries(Object.entries(EMPTY_DB).map(([key, value]) => [key, Array.isArray(parsed[key]) ? parsed[key] : value]));
  } catch (error) {
    const backup = `${DATA_FILE}.corrupt-${Date.now()}`;
    fs.copyFileSync(DATA_FILE, backup);
    fs.writeFileSync(DATA_FILE, JSON.stringify(EMPTY_DB, null, 2), 'utf8');
    throw Object.assign(new Error('GCOS_LOCAL_STORE_CORRUPT'), { cause: error, status: 500 });
  }
}

function writeStore(db) {
  ensureStore();
  const temp = `${DATA_FILE}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(temp, DATA_FILE);
}

function assertCollection(db, collection) {
  if (!Array.isArray(db[collection])) throw Object.assign(new Error('GCOS_COLLECTION_NOT_FOUND'), { status: 404 });
}

function normalize(collection, input = {}) {
  const clean = { ...input };
  if (collection === 'clients') {
    clean.mobile = String(input.mobile || input.phone || '').trim();
    clean.phone = clean.mobile;
    clean.email = String(input.email || '').trim().toLowerCase();
    clean.address = String(input.address || '').trim();
    clean.preferredChannel = input.preferredChannel || 'SMS';
    clean.smsAllowed = input.smsAllowed === true || input.smsAllowed === 'on';
    clean.emailAllowed = input.emailAllowed === true || input.emailAllowed === 'on';
  }
  if (collection === 'observations') {
    if (!input.interventionId) throw Object.assign(new Error('INTERVENTION_REQUIRED'), { status: 400 });
    clean.severity = input.severity || 'À surveiller';
    clean.clientNotified = Boolean(input.clientNotified);
    clean.decision = input.decision || 'En attente';
    clean.photoUrl = String(input.photoUrl || '').trim();
  }
  if (collection === 'communications') {
    if (!input.clientId) throw Object.assign(new Error('CLIENT_REQUIRED'), { status: 400 });
    clean.channel = input.channel || 'SMS';
    clean.status = input.status || 'Brouillon';
    clean.message = String(input.message || '').trim();
    clean.attachmentUrl = String(input.attachmentUrl || '').trim();
  }
  return clean;
}

function list(collection) {
  const db = readStore();
  assertCollection(db, collection);
  return db[collection];
}

function create(collection, input) {
  const db = readStore();
  assertCollection(db, collection);
  const now = new Date().toISOString();
  const record = { id: crypto.randomUUID(), ...normalize(collection, input), createdAt: now, updatedAt: now };
  db[collection].unshift(record);
  db.events.unshift({ id: crypto.randomUUID(), type: `${collection}.created`, recordId: record.id, createdAt: now });
  writeStore(db);
  return record;
}

function update(collection, id, input) {
  const db = readStore();
  assertCollection(db, collection);
  const index = db[collection].findIndex((item) => item.id === id);
  if (index < 0) throw Object.assign(new Error('GCOS_RECORD_NOT_FOUND'), { status: 404 });
  const now = new Date().toISOString();
  db[collection][index] = { ...db[collection][index], ...normalize(collection, input), id, updatedAt: now };
  db.events.unshift({ id: crypto.randomUUID(), type: `${collection}.updated`, recordId: id, createdAt: now });
  writeStore(db);
  return db[collection][index];
}

function summary() {
  const db = readStore();
  return {
    clients: db.clients.length,
    vehicles: db.vehicles.length,
    interventions: db.interventions.length,
    observations: db.observations.length,
    communications: db.communications.length,
    openInterventions: db.interventions.filter((item) => !['Terminée', 'Annulée'].includes(item.status)).length,
    pendingObservations: db.observations.filter((item) => item.decision === 'En attente').length,
    recentEvents: db.events.slice(0, 15)
  };
}

module.exports = { list, create, update, summary, DATA_FILE };