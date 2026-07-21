'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { activateTemplate } = require('../src/activate-template');

const ROOT = path.resolve(__dirname, '..');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function testBlankIdentity() {
  const manifest = readJson('template.manifest.json');
  const config = readJson('config/client.template.json');
  assert.equal(manifest.status, 'WAITING_FOR_IDENTITY');
  assert.equal(manifest.identity.companyName, null);
  assert.equal(manifest.identity.assistantName, null);
  assert.equal(config.company.name, null);
  assert.equal(config.company.siret, null);
  assert.equal(config.company.adminEmail, null);
  assert.equal(config.assistant.name, null);
  assert.deepEqual(config.users, []);
}

function testNeutralRuntimeConfiguration() {
  const raw = [
    fs.readFileSync(path.join(ROOT, 'config/client.template.json'), 'utf8'),
    fs.readFileSync(path.join(ROOT, 'config/roles.template.json'), 'utf8')
  ].join('\n').toLowerCase();
  for (const forbidden of ['betty', 'jarvis', 'gentlecare', 'gcos']) {
    assert.equal(raw.includes(forbidden), false, `Identité source interdite dans la configuration : ${forbidden}`);
  }
}

function testCapabilities() {
  const capabilities = readJson('catalog/capabilities.json').capabilities;
  const ids = capabilities.map((capability) => capability.id);
  assert.equal(new Set(ids).size, ids.length, 'Chaque capacité doit avoir un identifiant unique.');
  assert.ok(capabilities.length >= 20, 'Le modèle doit conserver un catalogue utile.');
  for (const capability of capabilities) {
    assert.equal(capability.enabledByDefault, false, `${capability.id} ne doit pas être activée par défaut.`);
    assert.ok(capability.sourceLineages.length > 0, `${capability.id} doit avoir une provenance.`);
    assert.ok(capability.humanValidation, `${capability.id} doit définir une validation.`);
  }
}

function testSourcesRemainSeparated() {
  const watch = readJson('governance/source-watch.json');
  assert.deepEqual(watch.sources.map((source) => source.id).sort(), ['betty', 'jarvis']);
  assert.equal(watch.reviewRules.automaticActivation, false);
  assert.equal(watch.reviewRules.automaticClientDataCopy, false);
}

function testActivationDoesNotMutateTemplate() {
  const before = fs.readFileSync(path.join(ROOT, 'config/client.template.json'), 'utf8');
  const activated = activateTemplate({
    companyName: 'Société Exemple',
    siret: '12345678901234',
    adminEmail: 'admin@example.fr',
    assistantName: 'Nova'
  }, ['voice-text-conversation']);
  const after = fs.readFileSync(path.join(ROOT, 'config/client.template.json'), 'utf8');

  assert.equal(activated.company.name, 'Société Exemple');
  assert.equal(activated.assistant.name, 'Nova');
  assert.deepEqual(activated.selectedCapabilities, ['voice-text-conversation']);
  assert.equal(activated.requiresHumanValidation, true);
  assert.equal(after, before, 'L’activation ne doit pas modifier le modèle vierge.');
}

function testInvalidActivationIsRejected() {
  assert.throws(() => activateTemplate({
    companyName: '',
    siret: '123',
    adminEmail: 'incorrect',
    assistantName: ''
  }), /nom de la société/);
}

testBlankIdentity();
testNeutralRuntimeConfiguration();
testCapabilities();
testSourcesRemainSeparated();
testActivationDoesNotMutateTemplate();
testInvalidActivationIsRejected();

process.stdout.write('Modèle MAVIK vierge validé.\n');
