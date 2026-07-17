'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'gcos-local.json');
const EMPTY_DB = { clients: [], vehicles: [], interventions: [], observations: [], communications: [], events: [] };
const DEFAULT_CHECKLIST = {
  receptionPhotos: false,
  mileageRecorded: false,
  clientApproval: false,
  beforePhotos: false,
  afterPhotos: false,
  finalControl: false,
  reportGenerated: false,
  clientSignature: false
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

function interventionNumber(db, date = new Date()) {
  const year = date.getFullYear();
  const prefix = `GC-${year}-`;
  const highest = db.interventions.reduce((max, item) => {
    if (!String(item.number || '').startsWith(prefix)) return max;
    const value = Number(String(item.number).slice(prefix.length));
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `${prefix}${String(highest + 1).padStart(4, '0')}`;
}

function normalize(collection, input = {}, current = {}) {
  const clean = { ...input };
  if (collection === 'clients') {
    clean.name = String(input.name ?? current.name ?? '').trim();
    clean.mobile = String(input.mobile ?? input.phone ?? current.mobile ?? '').trim();
    clean.phone = clean.mobile;
    clean.email = String(input.email ?? current.email ?? '').trim().toLowerCase();
    clean.address = String(input.address ?? current.address ?? '').trim();
    clean.preferredChannel = input.preferredChannel ?? current.preferredChannel ?? 'SMS';
    clean.smsAllowed = input.smsAllowed === true || input.smsAllowed === 'on';
    clean.emailAllowed = input.emailAllowed === true || input.emailAllowed === 'on';
  }
  if (collection === 'vehicles') {
    if (!(input.clientId ?? current.clientId)) throw Object.assign(new Error('CLIENT_REQUIRED'), { status: 400 });
    clean.registration = String(input.registration ?? current.registration ?? '').trim().toUpperCase();
    clean.vin = String(input.vin ?? current.vin ?? '').trim().toUpperCase();
    clean.mileage = Number(input.mileage ?? current.mileage ?? 0) || 0;
  }
  if (collection === 'interventions') {
    if (!(input.vehicleId ?? current.vehicleId)) throw Object.assign(new Error('VEHICLE_REQUIRED'), { status: 400 });
    clean.status = input.status ?? current.status ?? 'Prévue';
    clean.technician = String(input.technician ?? current.technician ?? '').trim();
    clean.arrivalTime = String(input.arrivalTime ?? current.arrivalTime ?? '').trim();
    clean.departureTime = String(input.departureTime ?? current.departureTime ?? '').trim();
    clean.mileage = Number(input.mileage ?? current.mileage ?? 0) || 0;
    clean.checklist = { ...DEFAULT_CHECKLIST, ...(current.checklist || {}), ...(input.checklist || {}) };
  }
  if (collection === 'observations') {
    if (!(input.interventionId ?? current.interventionId)) throw Object.assign(new Error('INTERVENTION_REQUIRED'), { status: 400 });
    clean.severity = input.severity ?? current.severity ?? 'À surveiller';
    clean.clientNotified = input.clientNotified === true || input.clientNotified === 'on';
    clean.decision = input.decision ?? current.decision ?? 'En attente';
    clean.photoUrl = String(input.photoUrl ?? current.photoUrl ?? '').trim();
  }
  if (collection === 'communications') {
    if (!(input.clientId ?? current.clientId)) throw Object.assign(new Error('CLIENT_REQUIRED'), { status: 400 });
    clean.channel = input.channel ?? current.channel ?? 'SMS';
    clean.status = input.status ?? current.status ?? 'Brouillon';
    clean.message = String(input.message ?? current.message ?? '').trim();
    clean.attachmentUrl = String(input.attachmentUrl ?? current.attachmentUrl ?? '').trim();
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
  const normalized = normalize(collection, input);
  if (collection === 'interventions') normalized.number = interventionNumber(db);
  const record = { id: crypto.randomUUID(), ...normalized, createdAt: now, updatedAt: now };
  db[collection].unshift(record);
  db.events.unshift({ id: crypto.randomUUID(), type: `${collection}.created`, recordId: record.id, interventionId: collection === 'interventions' ? record.id : record.interventionId || '', createdAt: now });
  writeStore(db);
  return record;
}

function update(collection, id, input) {
  const db = readStore();
  assertCollection(db, collection);
  const index = db[collection].findIndex((item) => item.id === id);
  if (index < 0) throw Object.assign(new Error('GCOS_RECORD_NOT_FOUND'), { status: 404 });
  const now = new Date().toISOString();
  const current = db[collection][index];
  db[collection][index] = { ...current, ...normalize(collection, input, current), id, updatedAt: now };
  db.events.unshift({ id: crypto.randomUUID(), type: `${collection}.updated`, recordId: id, interventionId: collection === 'interventions' ? id : db[collection][index].interventionId || '', createdAt: now });
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
    openInterventions: db.interventions.filter((item) => !['Terminée', 'Livrée', 'Annulée'].includes(item.status)).length,
    pendingObservations: db.observations.filter((item) => item.decision === 'En attente').length,
    recentEvents: db.events.slice(0, 20)
  };
}

module.exports = { list, create, update, summary, DATA_FILE };