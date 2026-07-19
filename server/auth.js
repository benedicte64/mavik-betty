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

function publicUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

function setupRequired() { return readUsers().length === 0; }

function createInitialAdmin(input = {}) {
  if (!setupRequired()) throw Object.assign(new Error('GCOS_SETUP_ALREADY_COMPLETED'), { status: 409 });
  const name = String(input.name || 'David').trim();
  const username = String(input.username || 'david').trim().toLowerCase();
  const email = normalizeEmail(input.email);
  const password = String(input.password || '');
  if (!name || !username) throw Object.assign(new Error('USER_NAME_REQUIRED'), { status: 400 });
  if (!validEmail(email)) throw Object.assign(new Error('INVALID_EMAIL'), { status: 400 });
  if (!validPin(password)) throw Object.assign(new Error('PIN_MUST_BE_4_DIGITS'), { status: 400 });
  const now = new Date().toISOString();
  const user = { id: crypto.randomUUID(), name, username, email, role: 'admin', active: true, passwordHash: hashPassword(password), createdAt: now, updatedAt: now };
  writeUsers([user]);
  return publicUser(user);
}

function createUser(actor, input = {}) {
  requirePermission(actor, 'users.manage');
  const users = readUsers();
  const username = String(input.username || '').trim().toLowerCase();
  const name = String(input.name || '').trim();
  const email = normalizeEmail(input.email);
  const password = String(input.password || '');
  const role = String(input.role || 'trainee');
  if (!username || !name) throw Object.assign(new Error('USER_NAME_REQUIRED'), { status: 400 });
  if (!validEmail(email)) throw Object.assign(new Error('INVALID_EMAIL'), { status: 400 });
  if (!validPin(password)) throw Object.assign(new Error('PIN_MUST_BE_4_DIGITS'), { status: 400 });
  if (!ROLE_PERMISSIONS[role]) throw Object.assign(new Error('INVALID_ROLE'), { status: 400 });
  if (users.some((user) => user.username === username)) throw Object.assign(new Error('USERNAME_ALREADY_EXISTS'), { status: 409 });
  if (users.some((user) => normalizeEmail(user.email) === email)) throw Object.assign(new Error('EMAIL_ALREADY_EXISTS'), { status: 409 });
  const now = new Date().toISOString();
  const user = { id: crypto.randomUUID(), name, username, email, role, active: true, passwordHash: hashPassword(password), createdAt: now, updatedAt: now };
  users.push(user);
  writeUsers(users);
  return publicUser(user);
}

function listUsers(actor) {
  requirePermission(actor, 'users.manage');
  return readUsers().map(publicUser);
}

function login(username, password) {
  const user = readUsers().find((item) => item.username === String(username || '').trim().toLowerCase() && item.active !== false);
  if (!user || !verifyPassword(password, user.passwordHash)) throw Object.assign(new Error('INVALID_CREDENTIALS'), { status: 401 });
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { userId: user.id, expiresAt: Date.now() + SESSION_TTL_MS });
  return { token, user: publicUser(user), expiresInSeconds: SESSION_TTL_MS / 1000 };
}

function recoveryKey(input = {}) {
  return `${String(input.username || '').trim().toLowerCase()}|${normalizeEmail(input.email)}`;
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

function resetPassword(input = {}) {
  const username = String(input.username || '').trim().toLowerCase();
  const name = String(input.name || '').trim().toLowerCase();
  const email = normalizeEmail(input.email);
  const password = String(input.password || '');
  const key = recoveryKey(input);
  enforceRecoveryRateLimit(key);
  if (!username || !name) throw Object.assign(new Error('USER_NAME_REQUIRED'), { status: 400 });
  if (!validEmail(email)) throw Object.assign(new Error('INVALID_EMAIL'), { status: 400 });
  if (!validPin(password)) throw Object.assign(new Error('PIN_MUST_BE_4_DIGITS'), { status: 400 });
  const users = readUsers();
  const index = users.findIndex((item) => item.username === username && String(item.name || '').trim().toLowerCase() === name && item.active !== false);
  if (index < 0) throw Object.assign(new Error('RECOVERY_IDENTITY_MISMATCH'), { status: 401 });
  const storedEmail = normalizeEmail(users[index].email);
  if (storedEmail && storedEmail !== email) throw Object.assign(new Error('RECOVERY_IDENTITY_MISMATCH'), { status: 401 });
  if (!storedEmail && users.some((item, itemIndex) => itemIndex !== index && normalizeEmail(item.email) === email)) throw Object.assign(new Error('EMAIL_ALREADY_EXISTS'), { status: 409 });
  users[index] = { ...users[index], email, passwordHash: hashPassword(password), updatedAt: new Date().toISOString(), passwordResetAt: new Date().toISOString() };
  writeUsers(users);
  for (const [token, session] of sessions.entries()) if (session.userId === users[index].id) sessions.delete(token);
  recoveryAttempts.delete(key);
  return publicUser(users[index]);
}

function logout(token) { if (token) sessions.delete(token); }

function tokenFromRequest(req) {
  const authorization = String(req.headers.authorization || '');
  if (authorization.startsWith('Bearer ')) return authorization.slice(7).trim();
  return String(req.headers['x-gcos-session'] || '').trim();
}

function authenticate(req) {
  const token = tokenFromRequest(req);
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (token) sessions.delete(token);
    return null;
  }
  const user = readUsers().find((item) => item.id === session.userId && item.active !== false);
  if (!user) return null;
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  return publicUser(user);
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
  logout,
  tokenFromRequest,
  authenticate,
  can,
  requirePermission,
  collectionPermission
};