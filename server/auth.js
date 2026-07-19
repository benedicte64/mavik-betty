'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const RECOVERY_WINDOW_MS = 15 * 60 * 1000;
const MAX_RECOVERY_ATTEMPTS = 5;
const sessions = new Map();
const recoveryAttempts = new Map();

const ROLE_PERMISSIONS = {
  admin: ['*'],
  associate: ['dashboard.read','clients.read','clients.write','vehicles.read','vehicles.write','interventions.read','interventions.write','observations.read','observations.write','communications.read','communications.write','tasks.read','tasks.write','stocks.read','stocks.write','quotes.read','quotes.write','documents.read','documents.write','photos.read','photos.write','jarvis.use'],
  technician: ['dashboard.read','clients.read','vehicles.read','interventions.read','interventions.write','observations.read','observations.write','tasks.read','tasks.write','documents.read','documents.write','photos.read','photos.write','jarvis.use'],
  commercial: ['dashboard.read','clients.read','clients.write','vehicles.read','vehicles.write','interventions.read','communications.read','communications.write','tasks.read','tasks.write','quotes.read','quotes.write','documents.read','documents.write','jarvis.use'],
  trainee: ['dashboard.read','vehicles.read','interventions.read','tasks.read','photos.read','photos.write','jarvis.use']
};

function ensureUsersFile() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]', 'utf8');
}

function readUsers() {
  ensureUsersFile();
  const parsed = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  return Array.isArray(parsed) ? parsed : [];
}

function writeUsers(users) {
  ensureUsersFile();
  const tmp = `${USERS_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(users, null, 2), 'utf8');
  fs.renameSync(tmp, USERS_FILE);
}

function normalizeEmail(email) { return String(email || '').trim().toLowerCase(); }
function validEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email)); }
function validPin(pin) { return /^\d{4}$/.test(String(pin || '')); }
function normalizeDevice(value) {
  const input = String(value || '').toLowerCase();
  return /(iphone|ipad|ipod|ios|mobile-safari)/.test(input) ? 'iphone' : 'pc';
}
function deviceFromRequest(req) {
  return normalizeDevice(req?.headers?.['x-gcos-client'] || req?.headers?.['user-agent'] || 'pc');
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, expected] = String(stored || '').split(':');
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(String(password), salt, 64);
  const expectedBuffer = Buffer.from(expected, 'hex');
  return expectedBuffer.length === actual.length && crypto.timingSafeEqual(expectedBuffer, actual);
}

function deviceHashes(user) {
  return user && typeof user.devicePinHashes === 'object' && user.devicePinHashes ? user.devicePinHashes : {};
}

function publicUser(user, currentDevice = '') {
  if (!user) return null;
  const { passwordHash, devicePinHashes, ...safe } = user;
  const hashes = deviceHashes(user);
  return {
    ...safe,
    currentDevice: currentDevice || undefined,
    deviceAccess: {
      pc: Boolean(hashes.pc),
      iphone: Boolean(hashes.iphone)
    }
  };
}

function setupRequired() { return readUsers().length === 0; }

function createInitialAdmin(input = {}, context = {}) {
  if (!setupRequired()) throw Object.assign(new Error('GCOS_SETUP_ALREADY_COMPLETED'), { status: 409 });
  const name = String(input.name || 'David').trim();
  const username = String(input.username || 'david').trim().toLowerCase();
  const email = normalizeEmail(input.email);
  const password = String(input.password || '');
  const device = normalizeDevice(input.device || context.device);
  if (!name || !username) throw Object.assign(new Error('USER_NAME_REQUIRED'), { status: 400 });
  if (!validEmail(email)) throw Object.assign(new Error('INVALID_EMAIL'), { status: 400 });
  if (!validPin(password)) throw Object.assign(new Error('PIN_MUST_BE_4_DIGITS'), { status: 400 });
  const now = new Date().toISOString();
  const hash = hashPassword(password);
  const user = {
    id: crypto.randomUUID(), name, username, email, role: 'admin', active: true,
    passwordHash: hash,
    devicePinHashes: { [device]: hash },
    createdAt: now, updatedAt: now
  };
  writeUsers([user]);
  return publicUser(user, device);
}

function createUser(actor, input = {}) {
  requirePermission(actor, 'users.manage');
  const users = readUsers();
  const username = String(input.username || '').trim().toLowerCase();
  const name = String(input.name || '').trim();
  const email = normalizeEmail(input.email);
  const password = String(input.password || '');
  const role = String(input.role || 'trainee');
  const device = normalizeDevice(input.device || 'pc');
  if (!username || !name) throw Object.assign(new Error('USER_NAME_REQUIRED'), { status: 400 });
  if (!validEmail(email)) throw Object.assign(new Error('INVALID_EMAIL'), { status: 400 });
  if (!validPin(password)) throw Object.assign(new Error('PIN_MUST_BE_4_DIGITS'), { status: 400 });
  if (!ROLE_PERMISSIONS[role]) throw Object.assign(new Error('INVALID_ROLE'), { status: 400 });
  if (users.some((user) => user.username === username)) throw Object.assign(new Error('USERNAME_ALREADY_EXISTS'), { status: 409 });
  if (users.some((user) => normalizeEmail(user.email) === email)) throw Object.assign(new Error('EMAIL_ALREADY_EXISTS'), { status: 409 });
  const now = new Date().toISOString();
  const hash = hashPassword(password);
  const user = {
    id: crypto.randomUUID(), name, username, email, role, active: true,
    passwordHash: hash,
    devicePinHashes: { [device]: hash },
    createdAt: now, updatedAt: now
  };
  users.push(user);
  writeUsers(users);
  return publicUser(user, device);
}

function listUsers(actor) {
  requirePermission(actor, 'users.manage');
  return readUsers().map((user) => publicUser(user));
}

function recoveryKey(input = {}) {
  return `${String(input.username || '').trim().toLowerCase()}|${normalizeEmail(input.email)}|${normalizeDevice(input.device)}`;
}

function enforceRecoveryRateLimit(key) {
  const now = Date.now();
  const entry = recoveryAttempts.get(key);
  if (!entry || now - entry.startedAt > RECOVERY_WINDOW_MS) {
    recoveryAttempts.set(key, { count: 1, startedAt: now });
    return;
  }
  if (entry.count >= MAX_RECOVERY_ATTEMPTS) throw Object.assign(new Error('RECOVERY_RATE_LIMITED'), { status: 429 });
  entry.count += 1;
}

function resetPassword(input = {}, context = {}) {
  const username = String(input.username || '').trim().toLowerCase();
  const email = normalizeEmail(input.email);
  const password = String(input.password || '');
  const device = normalizeDevice(input.device || context.device);
  const key = recoveryKey({ ...input, device });
  enforceRecoveryRateLimit(key);
  if (!username) throw Object.assign(new Error('USERNAME_REQUIRED'), { status: 400 });
  if (!validEmail(email)) throw Object.assign(new Error('INVALID_EMAIL'), { status: 400 });
  if (!validPin(password)) throw Object.assign(new Error('PIN_MUST_BE_4_DIGITS'), { status: 400 });
  const users = readUsers();
  const index = users.findIndex((item) => item.username === username && item.active !== false);
  if (index < 0) throw Object.assign(new Error('RECOVERY_IDENTITY_MISMATCH'), { status: 401 });
  const storedEmail = normalizeEmail(users[index].email);
  if (storedEmail && storedEmail !== email) throw Object.assign(new Error('RECOVERY_IDENTITY_MISMATCH'), { status: 401 });
  if (!storedEmail && users.some((item, itemIndex) => itemIndex !== index && normalizeEmail(item.email) === email)) throw Object.assign(new Error('EMAIL_ALREADY_EXISTS'), { status: 409 });
  const hashes = deviceHashes(users[index]);
  users[index] = {
    ...users[index],
    email,
    devicePinHashes: { ...hashes, [device]: hashPassword(password) },
    updatedAt: new Date().toISOString(),
    passwordResetAt: new Date().toISOString(),
    passwordResetDevice: device
  };
  writeUsers(users);
  for (const [token, session] of sessions.entries()) {
    if (session.userId === users[index].id && session.device === device) sessions.delete(token);
  }
  recoveryAttempts.delete(key);
  return publicUser(users[index], device);
}

function setCurrentDevicePin(actor, input = {}, device = 'pc') {
  if (!actor) throw Object.assign(new Error('AUTH_REQUIRED'), { status: 401 });
  const password = String(input.password || input.pin || '');
  const normalizedDevice = normalizeDevice(device);
  if (!validPin(password)) throw Object.assign(new Error('PIN_MUST_BE_4_DIGITS'), { status: 400 });
  const users = readUsers();
  const index = users.findIndex((item) => item.id === actor.id && item.active !== false);
  if (index < 0) throw Object.assign(new Error('AUTH_REQUIRED'), { status: 401 });
  users[index] = {
    ...users[index],
    devicePinHashes: { ...deviceHashes(users[index]), [normalizedDevice]: hashPassword(password) },
    updatedAt: new Date().toISOString(),
    devicePinUpdatedAt: new Date().toISOString(),
    devicePinUpdatedDevice: normalizedDevice
  };
  writeUsers(users);
  return publicUser(users[index], normalizedDevice);
}

function issueSession(user, device = 'pc') {
  const normalizedDevice = normalizeDevice(device);
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { userId: user.id, device: normalizedDevice, expiresAt: Date.now() + SESSION_TTL_MS });
  return { token, user: publicUser(user, normalizedDevice), device: normalizedDevice, expiresInSeconds: SESSION_TTL_MS / 1000 };
}

function login(username, password, context = {}) {
  const normalizedUsername = String(username || '').trim().toLowerCase();
  const device = normalizeDevice(context.device);
  if (normalizedUsername === '__recover__') {
    let payload;
    try { payload = JSON.parse(String(password || '')); }
    catch { throw Object.assign(new Error('RECOVERY_INVALID_REQUEST'), { status: 400 }); }
    payload.device = normalizeDevice(payload.device || device);
    resetPassword(payload, { device: payload.device });
    const recoveredUser = readUsers().find((item) => item.username === String(payload.username || '').trim().toLowerCase() && item.active !== false);
    if (!recoveredUser) throw Object.assign(new Error('RECOVERY_IDENTITY_MISMATCH'), { status: 401 });
    return issueSession(recoveredUser, payload.device);
  }
  const users = readUsers();
  const index = users.findIndex((item) => item.username === normalizedUsername && item.active !== false);
  if (index < 0) throw Object.assign(new Error('INVALID_CREDENTIALS'), { status: 401 });
  const user = users[index];
  const hashes = deviceHashes(user);
  const deviceHash = hashes[device];
  let valid = deviceHash ? verifyPassword(password, deviceHash) : verifyPassword(password, user.passwordHash);
  if (!valid) throw Object.assign(new Error('INVALID_CREDENTIALS'), { status: 401 });
  if (!deviceHash) {
    users[index] = {
      ...user,
      devicePinHashes: { ...hashes, [device]: hashPassword(password) },
      updatedAt: new Date().toISOString(),
      deviceBoundAt: new Date().toISOString()
    };
    writeUsers(users);
  }
  return issueSession(users[index], device);
}

function logout(token) { if (token) sessions.delete(token); }

function tokenFromRequest(req) {
  const authorization = String(req.headers.authorization || '');
  if (authorization.startsWith('Bearer ')) return authorization.slice(7).trim();
  const headerToken = String(req.headers['x-gcos-session'] || '').trim();
  if (headerToken) return headerToken;
  try {
    const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
    return String(url.searchParams.get('session') || '').trim();
  } catch {
    return '';
  }
}

function authenticate(req) {
  const token = tokenFromRequest(req);
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (token) sessions.delete(token);
    return null;
  }
  const requestDevice = deviceFromRequest(req);
  if (session.device && session.device !== requestDevice) return null;
  const user = readUsers().find((item) => item.id === session.userId && item.active !== false);
  if (!user) return null;
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  return publicUser(user, requestDevice);
}

function can(user, permission) {
  if (!user) return false;
  const permissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.includes('*') || permissions.includes(permission) || (permission === 'users.manage' && user.role === 'admin');
}

function requirePermission(user, permission) {
  if (!user) throw Object.assign(new Error('AUTH_REQUIRED'), { status: 401 });
  if (!can(user, permission)) throw Object.assign(new Error('FORBIDDEN'), { status: 403 });
  return true;
}

function collectionPermission(collection, method) { return `${collection}.${method === 'GET' ? 'read' : 'write'}`; }

module.exports = {
  USERS_FILE,
  ROLE_PERMISSIONS,
  setupRequired,
  createInitialAdmin,
  createUser,
  listUsers,
  login,
  resetPassword,
  setCurrentDevicePin,
  logout,
  tokenFromRequest,
  authenticate,
  deviceFromRequest,
  normalizeDevice,
  can,
  requirePermission,
  collectionPermission
};