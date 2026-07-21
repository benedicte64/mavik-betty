'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');

const authPath = require.resolve('../auth');
let auth = require('../auth');
const usersBackup = fs.existsSync(auth.USERS_FILE) ? fs.readFileSync(auth.USERS_FILE) : null;
const sessionsBackup = fs.existsSync(auth.SESSIONS_FILE) ? fs.readFileSync(auth.SESSIONS_FILE) : null;

try {
  fs.writeFileSync(auth.USERS_FILE, '[]');
  fs.writeFileSync(auth.SESSIONS_FILE, '[]');
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
  const adapted = auth.updateMyProfile(firstLogin.user, { preferences:{ accessMode:'large', accessibility:{ typeToSpeak:true, textOnly:true, reducedMotion:true } } }, { id:'adaptive-user', type:'pc', label:'Clavier adapté' });
  assert.equal(adapted.preferences.accessibility.typeToSpeak, true, 'type-to-speech must be persisted per user');
  assert.equal(adapted.preferences.accessibility.textOnly, true, 'written-only answers must be available per user');
  assert.equal(adapted.preferences.accessibility.reducedMotion, true, 'reduced motion must be persisted per user');
  assert.equal(adapted.preferences.accessibility.visualAlerts, false, 'unselected assistive options must stay disabled');
  const mergedAdaptation = auth.updateMyProfile(adapted, { preferences:{ accessibility:{ largeTargets:true } } }, { id:'adaptive-user', type:'pc', label:'Clavier adapté' });
  assert.equal(mergedAdaptation.preferences.accessibility.typeToSpeak, true, 'partial updates must preserve previous assistive choices');
  assert.equal(mergedAdaptation.preferences.accessibility.largeTargets, true);
  assert.equal(Object.hasOwn(mergedAdaptation.preferences.accessibility, 'untrustedOption'), false, 'unknown assistive settings must be discarded');
  auth.changeMyPin(firstLogin.user, { currentPin:'2468', newPin:'8642' });
  assert.equal(auth.login('lina', '8642', { id:'adaptive-user', type:'pc', label:'Clavier adapté' }).user.mustChoosePin, false);
  assert.equal(auth.publicProfiles().find((profile) => profile.username === 'lina').accessMode, 'large');

  for (let attempt = 1; attempt <= 4; attempt += 1) assert.throws(() => auth.login('lina', '0000', { id:'blocked-device', type:'pc', label:'PC test' }), /INVALID_CREDENTIALS/);
  assert.throws(() => auth.login('lina', '0000', { id:'blocked-device', type:'pc', label:'PC test' }), /LOGIN_RATE_LIMITED/);
  assert.throws(() => auth.login('lina', '8642', { id:'blocked-device', type:'pc', label:'PC test' }), /LOGIN_RATE_LIMITED/);

  console.log('Adaptive profile selection, first-login PIN and login throttling smoke test passed.');
} finally {
  if (usersBackup) fs.writeFileSync(auth.USERS_FILE, usersBackup); else { try { fs.unlinkSync(auth.USERS_FILE); } catch {} }
  if (sessionsBackup) fs.writeFileSync(auth.SESSIONS_FILE, sessionsBackup); else { try { fs.unlinkSync(auth.SESSIONS_FILE); } catch {} }
}
