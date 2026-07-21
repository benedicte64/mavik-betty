'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const PUBLIC = path.resolve(__dirname, '..', 'public');
const login = fs.readFileSync(path.join(PUBLIC, 'login.html'), 'utf8');
const company = fs.readFileSync(path.join(PUBLIC, 'company.html'), 'utf8');
const client = fs.readFileSync(path.join(PUBLIC, 'company-client.js'), 'utf8');
const voice = fs.readFileSync(path.join(PUBLIC, 'voice-access.js'), 'utf8');

for (const source of [login, company]) {
  assert.match(source, /class="skip-link"/, 'every entry workspace must offer a keyboard bypass link');
  assert.match(source, /data-access-feature="typeToSpeak"/, 'type-to-speech must be offered as an explicit profile choice');
  assert.match(source, /data-access-feature="textOnly"/, 'written-only interaction must be offered as an explicit profile choice');
  assert.match(source, /data-access-feature="reducedMotion"/, 'motion reduction must be offered as an explicit profile choice');
  assert.match(source, /data-access-feature="screenReaderHints"/, 'screen-reader prioritization must be offered as an explicit profile choice');
  assert.match(source, /data-access-feature="voiceFirst"/, 'voice-first work must be an explicit profile choice');
  assert.match(source, /data-access-feature="dailyBriefing"/, 'the proactive briefing must be an explicit profile choice');
}

assert.match(login, /aria-live="polite"/, 'Betty login messages must remain available as live text');
assert.match(login, /id="voiceProfile"/, 'a user must be able to identify their profile by voice');
assert.match(login, /id="speakPin"/, 'spoken PIN entry must be explicitly initiated');
assert.match(login, /Je ne les répéterai pas/, 'Betty must explicitly promise not to repeat a spoken PIN');
assert.match(company, /id="communicationDialog"/, 'the workspace must include the personal voice dialog');
assert.match(company, /id="voiceText"/, 'the personal voice dialog must use a labelled text input');
assert.match(company, /id="commandVoiceButton"/, 'the workspace must expose a permanent talk-to-Betty control');
assert.match(voice, /SpeechSynthesisUtterance/, 'the shared voice layer must use browser speech synthesis');
assert.match(voice, /SpeechRecognition|webkitSpeechRecognition/, 'the shared voice layer must detect browser speech recognition');
assert.match(client, /DEFAULT_ACCESSIBILITY/, 'assistive options must have explicit disabled defaults');
assert.match(client, /listenForConfirmation/, 'a material voice action must ask for an explicit spoken confirmation');

require(path.join(PUBLIC, 'voice-access.js'));
assert.equal(globalThis.BettyVoice.parseSpokenPin('un deux trois quatre'), '1234');
assert.equal(globalThis.BettyVoice.parseSpokenPin('12 34'), '1234');
assert.equal(globalThis.BettyVoice.parseSpokenPin('un deux trois'), '', 'an incomplete spoken PIN must be rejected');

process.stdout.write('Voice-first accessibility profile, oral PIN and assistive communication smoke test passed.\n');
