'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function isValidSiret(value) {
  return /^\d{14}$/.test(value || '');
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || '');
}

function activateTemplate(identity, selectedCapabilities = []) {
  const companyName = String(identity.companyName || '').trim();
  const assistantName = String(identity.assistantName || '').trim();
  const siret = String(identity.siret || '').replace(/\s/g, '');
  const adminEmail = String(identity.adminEmail || '').trim().toLowerCase();

  if (!companyName) throw new Error('Le nom de la société est obligatoire.');
  if (!assistantName) throw new Error("Le nom de l'IA est obligatoire.");
  if (!isValidSiret(siret)) throw new Error('Le SIRET doit contenir 14 chiffres.');
  if (!isValidEmail(adminEmail)) throw new Error("L'e-mail administrateur est invalide.");

  const catalog = readJson('catalog/capabilities.json').capabilities;
  const knownIds = new Set(catalog.map((capability) => capability.id));
  const uniqueSelections = [...new Set(selectedCapabilities)];
  const unknown = uniqueSelections.filter((id) => !knownIds.has(id));
  if (unknown.length) {
    throw new Error(`Capacités inconnues : ${unknown.join(', ')}`);
  }

  const config = readJson('config/client.template.json');
  return {
    ...config,
    status: 'READY_FOR_CONFIGURATION_REVIEW',
    company: {
      ...config.company,
      name: companyName,
      siret,
      adminEmail
    },
    assistant: {
      ...config.assistant,
      name: assistantName,
      displayName: assistantName
    },
    selectedCapabilities: uniqueSelections,
    generatedAt: new Date().toISOString(),
    requiresHumanValidation: true
  };
}

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || value === undefined) {
      throw new Error('Arguments attendus : --company, --siret, --admin, --assistant et éventuellement --capabilities.');
    }
    values[key.slice(2)] = value;
  }
  return values;
}

if (require.main === module) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const selected = args.capabilities
      ? args.capabilities.split(',').map((value) => value.trim()).filter(Boolean)
      : [];
    const result = activateTemplate({
      companyName: args.company,
      siret: args.siret,
      adminEmail: args.admin,
      assistantName: args.assistant
    }, selected);

    const buildDir = path.join(ROOT, 'build');
    fs.mkdirSync(buildDir, { recursive: true });
    const output = path.join(buildDir, 'client.config.json');
    fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
    process.stdout.write(`Configuration préparée : ${output}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { activateTemplate, isValidEmail, isValidSiret };
