'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(__dirname, 'data');
const UPDATE_DIR = path.join(DATA_DIR, 'updates');
const STATE_FILE = path.join(UPDATE_DIR, 'state.json');
const PENDING_FILE = path.join(UPDATE_DIR, 'pending-update.json');
const PACKAGE_FILE = path.join(__dirname, 'package.json');

function ensureDir() {
  fs.mkdirSync(UPDATE_DIR, { recursive: true });
}

function readJson(file, fallback = {}) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return fallback; }
}

function writeJson(file, value) {
  ensureDir();
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(value, null, 2), 'utf8');
  fs.renameSync(temp, file);
}

function currentVersion() {
  return readJson(PACKAGE_FILE, { version: '0.0.0' }).version || '0.0.0';
}

function parseVersion(input) {
  return String(input || '0.0.0').replace(/^v/i, '').split('-')[0].split('.').map((part) => Number(part) || 0);
}

function compareVersions(a, b) {
  const left = parseVersion(a);
  const right = parseVersion(b);
  for (let i = 0; i < Math.max(left.length, right.length, 3); i += 1) {
    const difference = (left[i] || 0) - (right[i] || 0);
    if (difference) return difference;
  }
  return 0;
}

function state() {
  const saved = readJson(STATE_FILE, {});
  return {
    enabled: process.env.GCOS_AUTO_UPDATE !== 'false',
    channel: process.env.GCOS_UPDATE_CHANNEL || 'stable',
    currentVersion: currentVersion(),
    checking: false,
    updateAvailable: false,
    pendingRestart: fs.existsSync(PENDING_FILE),
    ...saved
  };
}

function saveState(patch) {
  const next = { ...state(), ...patch, updatedAt: new Date().toISOString() };
  writeJson(STATE_FILE, next);
  return next;
}

function githubHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'GCOS-Updater',
    'X-GitHub-Api-Version': '2022-11-28'
  };
  if (process.env.GCOS_GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GCOS_GITHUB_TOKEN}`;
  return headers;
}

async function releaseMetadata() {
  const repository = process.env.GCOS_UPDATE_REPOSITORY || 'gentlecar64-ship-it/-jarvis-gentlecare';
  const channel = process.env.GCOS_UPDATE_CHANNEL || 'stable';
  const endpoint = channel === 'development'
    ? `https://api.github.com/repos/${repository}/releases`
    : `https://api.github.com/repos/${repository}/releases/latest`;
  const response = await fetch(endpoint, { headers: githubHeaders() });
  if (!response.ok) throw new Error(`UPDATE_METADATA_${response.status}`);
  const payload = await response.json();
  const release = Array.isArray(payload)
    ? payload.find((item) => channel === 'development' || !item.prerelease)
    : payload;
  if (!release) throw new Error('UPDATE_RELEASE_NOT_FOUND');
  const asset = (release.assets || []).find((item) => /gcos.*\.zip$/i.test(item.name)) || (release.assets || [])[0];
  if (!asset) throw new Error('UPDATE_ASSET_NOT_FOUND');
  return {
    version: String(release.tag_name || release.name || '').replace(/^v/i, ''),
    name: release.name || release.tag_name,
    notes: release.body || '',
    publishedAt: release.published_at,
    downloadUrl: asset.url,
    fileName: asset.name,
    size: asset.size,
    releaseUrl: release.html_url
  };
}

async function check() {
  if (process.env.GCOS_AUTO_UPDATE === 'false') return saveState({ enabled: false, checking: false });
  saveState({ enabled: true, checking: true, lastError: null });
  try {
    const release = await releaseMetadata();
    const available = compareVersions(release.version, currentVersion()) > 0;
    return saveState({ checking: false, updateAvailable: available, latest: release, lastCheckedAt: new Date().toISOString() });
  } catch (error) {
    return saveState({ checking: false, lastError: error.message, lastCheckedAt: new Date().toISOString() });
  }
}

async function sha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function download() {
  const checked = await check();
  if (!checked.updateAvailable || !checked.latest) return checked;
  ensureDir();
  const destination = path.join(UPDATE_DIR, checked.latest.fileName || `gcos-${checked.latest.version}.zip`);
  const response = await fetch(checked.latest.downloadUrl, {
    headers: { ...githubHeaders(), Accept: 'application/octet-stream' },
    redirect: 'follow'
  });
  if (!response.ok) throw Object.assign(new Error(`UPDATE_DOWNLOAD_${response.status}`), { status: 502 });
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(destination, buffer);
  const digest = await sha256(destination);
  const pending = {
    version: checked.latest.version,
    archive: destination,
    sha256: digest,
    rootDir: ROOT_DIR,
    createdAt: new Date().toISOString()
  };
  writeJson(PENDING_FILE, pending);
  return saveState({ updateAvailable: false, pendingRestart: true, downloaded: pending });
}

function clearPending() {
  if (fs.existsSync(PENDING_FILE)) fs.unlinkSync(PENDING_FILE);
  return saveState({ pendingRestart: false, downloaded: null });
}

function startAutomaticChecks() {
  if (process.env.GCOS_AUTO_UPDATE === 'false') return;
  const intervalHours = Math.max(1, Number(process.env.GCOS_UPDATE_INTERVAL_HOURS || 6));
  setTimeout(() => check().catch(() => {}), 15_000).unref();
  setInterval(() => check().catch(() => {}), intervalHours * 60 * 60 * 1000).unref();
}

module.exports = { state, check, download, clearPending, startAutomaticChecks, currentVersion };
