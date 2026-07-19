'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const designInstaller = require('./design-installer');

const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(__dirname, 'data');
const BACKUP_DIR = path.join(__dirname, 'backups');
const PUBLIC_DIR = path.join(__dirname, 'public');
const REPORT_FILE = path.join(DATA_DIR, 'diagnostics-last.json');
const CRASH_FILE = path.join(DATA_DIR, 'mavik-crash.log');
let lastReport = null;
let running = false;

function safeMessage(error) { return String(error?.message || error || 'Erreur inconnue').replace(/[\r\n]+/g, ' ').slice(0, 500); }
function writeJson(file, value) { fs.mkdirSync(path.dirname(file), { recursive: true }); const temp = `${file}.tmp`; fs.writeFileSync(temp, JSON.stringify(value, null, 2), 'utf8'); fs.renameSync(temp, file); }
function readLastReport() { if (lastReport) return lastReport; try { lastReport = JSON.parse(fs.readFileSync(REPORT_FILE, 'utf8')); } catch { lastReport = null; } return lastReport; }
function item(id, label, status, detail, options = {}) { return { id, label, status, ok: status === 'ok', detail, critical: Boolean(options.critical), repairable: Boolean(options.repairable), humanAction: options.humanAction || '' }; }
function writable(dir, name) { fs.mkdirSync(dir, { recursive: true }); const probe = path.join(dir, `.${name}-${process.pid}-${Date.now()}.tmp`); fs.writeFileSync(probe, 'ok'); fs.unlinkSync(probe); }
function cleanup(dir) { if (!fs.existsSync(dir)) return 0; let count = 0; for (const name of fs.readdirSync(dir)) { if (!name.endsWith('.tmp')) continue; const file = path.join(dir, name); try { if (Date.now() - fs.statSync(file).mtimeMs > 1800000) { fs.unlinkSync(file); count += 1; } } catch {} } return count; }
function gitProbe() { return { version: execFileSync('git', ['--version'], { cwd: ROOT_DIR, encoding: 'utf8', windowsHide: true, timeout: 8000 }).trim(), commit: execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT_DIR, encoding: 'utf8', windowsHide: true, timeout: 8000 }).trim(), branch: execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: ROOT_DIR, encoding: 'utf8', windowsHide: true, timeout: 8000 }).trim() }; }

function installDesign() {
  const result = designInstaller.install();
  const alpha = fs.readFileSync(result.target, 'utf8');
  if (!alpha.includes('gce-official-logo') || !alpha.includes('data:image/png;base64,')) throw new Error('OFFICIAL_DESIGN_NOT_INSTALLED');
  return result;
}

try { installDesign(); } catch (error) { console.error('[MAVIK DESIGN]', safeMessage(error)); }

async function run(dependencies, options = {}) {
  if (running) return readLastReport() || { overall: 'checking', score: 0, checks: [], checkedAt: new Date().toISOString() };
  running = true;
  const started = Date.now();
  const repair = Boolean(options.repair);
  const checks = [];
  const repairs = [];
  const { localStore, airtableSync, updater, backup } = dependencies;
  try {
    try {
      if (repair) { const removed = cleanup(DATA_DIR) + cleanup(path.join(DATA_DIR, 'updates')); if (removed) repairs.push(`${removed} fichier(s) temporaire(s) supprimé(s)`); }
      writable(DATA_DIR, 'data');
      const summary = localStore.summary();
      checks.push(item('local-data', 'Données locales', 'ok', `${summary.clients} client(s), ${summary.vehicles} véhicule(s), ${summary.interventions} intervention(s)`));
    } catch (error) {
      checks.push(item('local-data', 'Données locales', 'error', safeMessage(error), { critical: true, repairable: true, humanAction: 'Fermez MAVIK puis double-cliquez sur C:\\Mavik-GCOS\\REPARER-MAVIK.cmd.' }));
    }

    try {
      writable(BACKUP_DIR, 'backup');
      if (repair) { const saved = backup.createBackup(); if (saved) repairs.push('Sauvegarde locale vérifiée'); }
      checks.push(item('backup', 'Sauvegardes', 'ok', 'Dossier accessible et écriture opérationnelle'));
    } catch (error) {
      checks.push(item('backup', 'Sauvegardes', 'error', safeMessage(error), { critical: true, repairable: true, humanAction: 'Vérifiez que le disque C: n’est pas plein puis lancez REPARER-MAVIK.cmd.' }));
    }

    try {
      if (repair) { const installed = installDesign(); repairs.push(`Design GentleCarE réinstallé (${installed.parts} parties du logo vérifiées)`); }
      const alpha = fs.readFileSync(path.join(PUBLIC_DIR, 'alpha.html'), 'utf8');
      const official = alpha.includes('gce-official-logo') && alpha.includes('data:image/png;base64,') && !alpha.includes('__OFFICIAL_LOGO__');
      checks.push(item('interface', 'Interface et logo GentleCarE', official ? 'ok' : 'error', official ? 'Logo officiel et interface premium chargés' : 'Le logo officiel n’est pas correctement installé', { critical: true, repairable: true, humanAction: 'Double-cliquez sur C:\\Mavik-GCOS\\REPARER-MAVIK.cmd.' }));
    } catch (error) {
      checks.push(item('interface', 'Interface et logo GentleCarE', 'error', safeMessage(error), { critical: true, repairable: true, humanAction: 'Double-cliquez sur C:\\Mavik-GCOS\\REPARER-MAVIK.cmd.' }));
    }

    try {
      const git = gitProbe();
      checks.push(item('git', 'Moteur de mise à jour', 'ok', `${git.version} · ${git.branch}@${git.commit}`));
    } catch (error) {
      checks.push(item('git', 'Moteur de mise à jour', 'error', safeMessage(error), { humanAction: 'Réparez Git pour Windows puis relancez MAVIK.' }));
    }

    try {
      const state = repair ? await updater.check() : updater.state();
      const failed = Boolean(state.lastError);
      checks.push(item('updates', 'Mises à jour automatiques', failed ? 'warning' : 'ok', failed ? `Dernière erreur : ${state.lastError}` : state.updateAvailable ? 'Mise à jour disponible, installation automatique programmée' : 'À jour ou vérification automatique programmée', { repairable: true, humanAction: failed ? 'Vérifiez Internet puis cliquez sur Réparer maintenant. Si cela persiste, lancez REPARER-MAVIK.cmd.' : '' }));
    } catch (error) {
      checks.push(item('updates', 'Mises à jour automatiques', 'warning', safeMessage(error), { repairable: true, humanAction: 'Vérifiez Internet puis relancez le diagnostic.' }));
    }

    try {
      if (!airtableSync.configured()) {
        checks.push(item('airtable', 'Connexion Airtable', 'warning', 'Clé Airtable absente de server/.env', { humanAction: 'Ajoutez AIRTABLE_TOKEN dans C:\\Mavik-GCOS\\server\\.env puis redémarrez MAVIK.' }));
      } else {
        const result = await airtableSync.testConnection();
        checks.push(item('airtable', 'Connexion Airtable', result.ok ? 'ok' : 'warning', result.detail || 'Connexion testée', { repairable: true, humanAction: result.ok ? '' : 'Vérifiez Internet et la clé Airtable puis cliquez sur Réparer maintenant.' }));
      }
    } catch (error) {
      checks.push(item('airtable', 'Connexion Airtable', 'warning', safeMessage(error), { repairable: true, humanAction: 'Vérifiez Internet et AIRTABLE_TOKEN puis relancez le diagnostic.' }));
    }

    const errors = checks.filter((check) => check.status === 'error');
    const warnings = checks.filter((check) => check.status === 'warning');
    const overall = errors.some((check) => check.critical) ? 'critical' : errors.length || warnings.length ? 'degraded' : 'healthy';
    const humanHelp = checks.filter((check) => check.status !== 'ok' && check.humanAction).map((check, index) => ({ step: index + 1, title: check.label, instruction: check.humanAction }));
    lastReport = { service: 'MAVIK Autodiagnostic', overall, score: Math.round(checks.filter((check) => check.ok).length / Math.max(checks.length, 1) * 100), checks, repairs, humanHelp, automaticRepair: true, hotline: { active: false, label: 'Hotline MAVIK', message: 'Hotline prochainement disponible. Les étapes de dépannage sont affichées dans MAVIK.' }, checkedAt: new Date().toISOString(), durationMs: Date.now() - started };
    writeJson(REPORT_FILE, lastReport);
    return lastReport;
  } finally { running = false; }
}

function recordCrash(error, type = 'CRASH') { try { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.appendFileSync(CRASH_FILE, `[${new Date().toISOString()}] ${type}: ${safeMessage(error)}\n${String(error?.stack || '')}\n\n`, 'utf8'); } catch {} }
function startAutomaticChecks(dependencies) { const execute = () => run(dependencies, { repair: true }).then((report) => { if (report.overall !== 'healthy') { console.warn(`[MAVIK DIAGNOSTIC] ${report.overall} · score ${report.score}%`); report.humanHelp.forEach((step) => console.warn(`[MAVIK AIDE] ${step.title}: ${step.instruction}`)); } }).catch((error) => { recordCrash(error, 'DIAGNOSTIC'); console.error('[MAVIK DIAGNOSTIC]', error); }); setTimeout(execute, 8000).unref(); setInterval(execute, Math.max(2, Number(process.env.GCOS_DIAGNOSTIC_INTERVAL_MINUTES || 5)) * 60000).unref(); }

module.exports = { run, readLastReport, recordCrash, startAutomaticChecks, REPORT_FILE, CRASH_FILE };
