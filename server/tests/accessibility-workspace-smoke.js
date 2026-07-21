'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const PUBLIC = path.resolve(__dirname, '..', 'public');
const login = fs.readFileSync(path.join(PUBLIC, 'login.html'), 'utf8');
const company = fs.readFileSync(path.join(PUBLIC, 'company.html'), 'utf8');
const client = fs.readFileSync(path.join(PUBLIC, 'company-client.js'), 'utf8');

for (const source of [login, company]) {
  assert.match(source, /class="skip-link"/, 'every entry workspace must offer a keyboard bypass link');
  assert.match(source, /data-access-feature="typeToSpeak"/, 'type-to-speech must be offered as an explicit profile choice');
  assert.match(source, /data-access-feature="textOnly"/, 'written-only interaction must be offered as an explicit profile choice');
  assert.match(source, /data-access-feature="reducedMotion"/, 'motion reduction must be offered as an explicit profile choice');
  assert.match(source, /data-access-feature="screenReaderHints"/, 'screen-reader prioritization must be offered as an explicit profile choice');
}

assert.match(login, /aria-live="polite"/, 'Betty login messages must remain available as live text');
assert.match(company, /id="communicationDialog"/, 'the workspace must include the personal voice dialog');
assert.match(company, /id="voiceText"/, 'the personal voice dialog must use a labelled text input');
assert.match(client, /SpeechSynthesisUtterance/, 'the personal voice must use local browser speech synthesis');
assert.match(client, /DEFAULT_ACCESSIBILITY/, 'assistive options must have explicit disabled defaults');

process.stdout.write('Accessibility-first profile and assistive communication smoke test passed.\n');
