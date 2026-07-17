'use strict';

const fs = require('node:fs');
const path = require('node:path');

const DATA_FILE = path.join(__dirname, 'data', 'gcos-local.json');
const BACKUP_DIR = path.join(__dirname, 'backups');

function backupName(date = new Date()) {
  const stamp = date.toISOString().replace(/[:.]/g, '-');
  return `gcos-${stamp}.json`;
}

function cleanup(maxBackups = 30) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const files = fs.readdirSync(BACKUP_DIR)
    .filter((name) => name.startsWith('gcos-') && name.endsWith('.json'))
    .map((name) => ({ name, time: fs.statSync(path.join(BACKUP_DIR, name)).mtimeMs }))
    .sort((a, b) => b.time - a.time);
  for (const file of files.slice(maxBackups)) fs.unlinkSync(path.join(BACKUP_DIR, file.name));
}

function createBackup() {
  if (!fs.existsSync(DATA_FILE)) return null;
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const target = path.join(BACKUP_DIR, backupName());
  fs.copyFileSync(DATA_FILE, target);
  cleanup(Number(process.env.GCOS_BACKUP_RETENTION || 30));
  return target;
}

function startAutomaticBackups() {
  const intervalMinutes = Number(process.env.GCOS_BACKUP_INTERVAL_MINUTES || 360);
  const interval = Math.max(15, intervalMinutes) * 60 * 1000;
  createBackup();
  const timer = setInterval(() => {
    try { createBackup(); }
    catch (error) { console.error('[GCOS BACKUP]', error); }
  }, interval);
  timer.unref();
  return timer;
}

module.exports = { createBackup, startAutomaticBackups, BACKUP_DIR };
