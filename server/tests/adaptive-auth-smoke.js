'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const authPath = require.resolve('../auth');
const usersFile = path.resolve(__dirname, '..', 'data', 'users.json');
const sessionsFile = path.resolve(__dirname, '..', 'data', 'sessions.json');
const usersBackup = fs.existsSync(usersFile) ? fs.readFileSync(usersFile) : null;
const sessionsBackup = fs.existsSync(sessionsFile) ? fs.readFileSync(sessionsFile) : null;
let auth = require('../auth');

try {
  fs.writeFileSync(usersFile, '[]');
  fs.writeFileSync(sessionsFile, '[]');
  delete require.cache[authPath];
  auth = require('../auth');

  const adminContext = { id:'adaptive-admin', type:'pc', label:'PC direction' };
  const admin = auth.createInitialAdmin({ name:'Direction Test', username:'direction', email:'direction@example.com', password:'1234' }, adminContext);
  const employee = auth.createUser(admin, { name:'Lina Test', username:'lina', email:'lina@example.com', password:'2468', role:'commercial' });
  assert.equal(employee.mustChoosePin, true, 'a new employee must choose a personal PIN after identity confirmation');

  const profiles = auth.publicProfiles();
  assert.deepEqual(profiles.map((profile) => profile.username).sort(), ['direction','lina']);
  assert.equal(profiles.some((profile) => 'email' in profile || 'passwordHash' in profile), false, 'the public selector must not expose secrets or email addresses');

  const firstLogin = auth.login('lina', '2468', { id:'adaptive-user', type:'pc', label:'Clavier adapté' });
  assert.equal(firstLogin.user.mustChoosePin, true);
  const adapted = auth.updateMyProfile(firstLogin.user, { preferences:{ accessMode:'large', accessibility:{ typeToSpeak:true, voiceFirst:true, dailyBriefing:true, voiceGender:'female', voiceRate:0.8, reducedMotion:true } } }, { id:'adaptive-user', type:'pc', label:'Clavier adapté' });
  assert.equal(adapted.preferences.accessibility.typeToSpeak, true, 'type-to-speech must be persisted per user');
  assert.equal(adapted.preferences.accessibility.voiceFirst, true, 'voice-first answers must be available per user');
  assert.equal(adapted.preferences.accessibility.dailyBriefing, true, 'the startup briefing must remain opt-in');
  assert.equal(adapted.preferences.accessibility.voiceGender, 'female');
  assert.equal(adapted.preferences.accessibility.voiceRate, 0.8);
  assert.equal(adapted.preferences.accessibility.reducedMotion, true, 'reduced motion must be persisted per user');
  assert.equal(adapted.preferences.accessibility.visualAlerts, false, 'unselected assistive options must stay disabled');
  const mergedAdaptation = auth.updateMyProfile(adapted, { preferences:{ accessibility:{ largeTargets:true } } }, { id:'adaptive-user', type:'pc', label:'Clavier adapté' });
  assert.equal(mergedAdaptation.preferences.accessibility.typeToSpeak, true, 'partial updates must preserve previous assistive choices');
  assert.equal(mergedAdaptation.preferences.accessibility.largeTargets, true);
  assert.equal(Object.hasOwn(mergedAdaptation.preferences.accessibility, 'untrustedOption'), false, 'unknown assistive settings must be discarded');
  const textOnly = auth.updateMyProfile(mergedAdaptation, { preferences:{ accessibility:{ textOnly:true, voiceFirst:true, voiceGender:'unknown', voiceRate:9 } } }, { id:'adaptive-user', type:'pc', label:'Clavier adapté' });
  assert.equal(textOnly.preferences.accessibility.textOnly, true);
  assert.equal(textOnly.preferences.accessibility.voiceFirst, false, 'text-only and automatic voice must not be active together');
  assert.equal(textOnly.preferences.accessibility.voiceGender, 'auto');
  assert.equal(textOnly.preferences.accessibility.voiceRate, 1.1, 'voice rate must be bounded');
  auth.changeMyPin(firstLogin.user, { currentPin:'2468', newPin:'8642' });
  assert.equal(auth.login('lina', '8642', { id:'adaptive-user', type:'pc', label:'Clavier adapté' }).user.mustChoosePin, false);
  assert.equal(auth.publicProfiles().find((profile) => profile.username === 'lina').accessMode, 'large');

  for (let attempt = 1; attempt <= 4; attempt += 1) assert.throws(() => auth.login('lina', '0000', { id:'blocked-device', type:'pc', label:'PC test' }), /INVALID_CREDENTIALS/);
  assert.throws(() => auth.login('lina', '0000', { id:'blocked-device', type:'pc', label:'PC test' }), /LOGIN_RATE_LIMITED/);
  assert.throws(() => auth.login('lina', '8642', { id:'blocked-device', type:'pc', label:'PC test' }), /LOGIN_RATE_LIMITED/);

  console.log('Adaptive profile selection, first-login PIN and login throttling smoke test passed.');
} finally {
  if (usersBackup) fs.writeFileSync(usersFile, usersBackup); else { try { fs.unlinkSync(usersFile); } catch {} }
  if (sessionsBackup) fs.writeFileSync(sessionsFile, sessionsBackup); else { try { fs.unlinkSync(sessionsFile); } catch {} }
}
