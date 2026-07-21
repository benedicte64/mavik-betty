'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const betty = require('../betty-core');

function memoryStore() {
  const db = {
    tasks:[{ id:'task-1', title:'Valider la proposition client', status:'À faire', priority:'Haute', department:'direction', dueDate:new Date().toISOString().slice(0,10), assignee:'Direction' }],
    invoices:[{ id:'invoice-1', customer:'Client Alpha', amount:1200, status:'À relancer', dueDate:'2026-01-10' }],
    opportunities:[{ id:'opp-1', company:'Entreprise Démo', value:10000, probability:70, stage:'Proposition', dueDate:new Date().toISOString().slice(0,10), nextAction:'Préparer la décision' }],
    subscriptions:[{ id:'sub-1', monthlyAmount:299, status:'Actif' }],
    softwareProjects:[{ id:'project-1', name:'MAVIK Studio', progress:45, status:'En cours' }],
    supportTickets:[{ id:'ticket-1', title:'Configurer le portail', priority:'Haute', status:'Nouveau', customer:'Client Alpha' }],
    meetings:[{ id:'meeting-1', title:'Revue produit', status:'Confirmé' }],
    contracts:[], documents:[{ id:'doc-1', title:'Procédure de validation', category:'Procédure' }], bettyMemory:[], bettyAudit:[], events:[]
  };
  return {
    list(collection) { if (!db[collection]) db[collection]=[]; return db[collection]; },
    create(collection,input) { if (!db[collection]) db[collection]=[];const record={ id:crypto.randomUUID(), ...input, createdAt:new Date().toISOString() };db[collection].unshift(record);return record; },
    db
  };
}

const store=memoryStore();
const direction={ id:'direction-1', name:'Bénédicte', role:'admin' };
const commercial={ id:'commercial-1', name:'Lina', role:'commercial' };

const brief=betty.brief(store,direction);
assert.equal(brief.profile.assistant,'Betty');
assert.equal(brief.profile.owner,'Avenor');
assert.equal(brief.capabilities.length,8);
assert.equal(brief.principles.humanValidation,true);
assert.ok(brief.notifications.some((item)=>item.type==='invoice'));
assert.equal(brief.work.can.payments,true);

const hello=betty.execute(store,{ text:'Bonjour Betty' },direction);
assert.equal(hello.intent,'greeting');
const weather=betty.execute(store,{ text:'Quel temps fait-il ?' },direction);
assert.equal(weather.intent,'weather-unavailable');
assert.match(weather.answer,/pas de source météo en direct/);
const payments=betty.execute(store,{ text:'Quels règlements faut-il suivre ?' },direction);
assert.equal(payments.intent,'payments');
assert.match(payments.answer,/validation/);

const pipeline=betty.execute(store,{ text:'Montre-moi le pipeline commercial' },commercial);
assert.equal(pipeline.view,'commercial');
assert.match(pipeline.answer,/7[\s\u202f]?000/);
const forbiddenAccounting=betty.execute(store,{ text:'Montre-moi les factures impayées' },commercial);
assert.equal(forbiddenAccounting.intent,'access-denied');
assert.equal(forbiddenAccounting.data,undefined,'a denied role must not receive accounting data');

const proposed=betty.execute(store,{ text:'Ajoute une tâche : préparer la démonstration' },commercial);
assert.equal(proposed.requiresConfirmation,true);
assert.equal(store.list('tasks').length,1,'no write is allowed before human confirmation');

const accountingTask=betty.execute(store,{ text:'Ajoute une tâche : relancer la facture Alpha' },commercial);
assert.equal(accountingTask.requiresConfirmation,true,'a task containing an accounting keyword must still require confirmation');
assert.equal(store.list('tasks').length,1);

const confirmed=betty.execute(store,{ text:'Ajoute une tâche : préparer la démonstration', confirmed:true },commercial);
assert.equal(confirmed.requiresConfirmation,false);
assert.equal(store.list('tasks').length,2);
assert.ok(store.list('bettyAudit').some((entry)=>entry.action==='task.created'&&entry.humanValidated===true));
assert.ok(betty.memory(store,commercial,10).length>=3);

const trainee={ id:'trainee-1', name:'Noa', role:'trainee' };
const forbiddenTask=betty.execute(store,{ text:'Ajoute une tâche : modifier le projet' },trainee);
assert.equal(forbiddenTask.intent,'access-denied');
assert.equal(store.list('tasks').length,2,'a read-only profile must not create a task');

const scopedFiles=['../betty-core.js','../../docs/BETTY_CORE_V1.md','../public/company.html','../public/company-client.js','../public/login.html','../public/login.template.html'];
for(const relative of scopedFiles){const content=fs.readFileSync(path.join(__dirname,relative),'utf8');assert.doesNotMatch(content,/jarvis|gentlecare/i,`${relative} must remain client-neutral`);}

console.log('Betty Core v1 memory, audit, roles and human confirmation smoke test passed.');
