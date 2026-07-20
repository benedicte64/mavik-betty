'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const eventBus = require('../operational-event-bus');
const brain = require('../operational-brain');

function memoryStore() {
  const day = new Date().toISOString().slice(0,10);
  const db = {
    operationalEvents:[], events:[{ id:'raw-task-event', type:'tasks.created', recordId:'task-1', createdAt:new Date().toISOString() }],
    tasks:[{ id:'task-1', title:'Traiter le dossier urgent', status:'À faire', priority:'Urgente', dueDate:day, department:'direction' }],
    invoices:[{ id:'invoice-1', customer:'Client Alpha', amount:1800, status:'À relancer', dueDate:'2026-01-10' }],
    opportunities:[{ id:'opp-1', company:'Entreprise Démo', stage:'Proposition', value:8000, probability:70, dueDate:day, nextAction:'Relancer la décision' }],
    quoteRequests:[{ id:'quote-1', status:'À valider', clientName:'Client Beta' }], quotes:[],
    stockItems:[], meetings:[], externalCalendarEvents:[], supportTickets:[], interventions:[], vehicles:[], subscriptions:[], documents:[], expenses:[], contracts:[], softwareProjects:[]
  };
  return {
    list(collection) { if (!db[collection]) db[collection]=[]; return db[collection]; },
    create(collection,input) {
      if (!db[collection]) db[collection]=[];
      const record={ id:crypto.randomUUID(), ...input, createdAt:input.createdAt || new Date().toISOString(), updatedAt:new Date().toISOString() };
      db[collection].unshift(record);
      db.events.unshift({ id:crypto.randomUUID(), type:`${collection}.created`, recordId:record.id, createdAt:new Date().toISOString() });
      return record;
    },
    db
  };
}

const store=memoryStore();
const direction={ id:'direction-1', name:'Bénédicte', role:'admin', tenantId:'avenor' };
const commercial={ id:'commercial-1', name:'Lina', role:'commercial', tenantId:'avenor' };
assert.throws(()=>eventBus.ingest(store,{ source:'unknown-provider', type:'message.received' },direction),/OPERATIONAL_EVENT_SOURCE_INVALID/);

const accepted=eventBus.ingest(store,{
  source:'crm', type:'quote.accepted', externalId:'crm-quote-42', title:'Le devis Client Beta est accepté',
  summary:'Le client vient de confirmer son accord.', entity:{ type:'quote', id:'quote-42' },
  data:{ amount:4200, accessToken:'must-not-leak', shippingAddress:'12 rue de la Paix' }, importance:'urgent'
},direction);
assert.equal(accepted.duplicate,false);
assert.equal(accepted.event.data.accessToken,'[masqué]');
assert.equal(accepted.event.data.shippingAddress,'12 rue de la Paix');

const duplicate=eventBus.ingest(store,{ source:'crm', type:'quote.accepted', externalId:'crm-quote-42' },direction);
assert.equal(duplicate.duplicate,true);
assert.equal(store.list('operationalEvents').filter((event)=>event.externalId==='crm-quote-42').length,1);

eventBus.ingest(store,{
  source:'accounting', type:'invoice.updated', externalId:'invoice-private-1', title:'Facture Client Alpha mise à jour',
  data:{ amount:1800, status:'À relancer' }
},direction);

const directionEvents=eventBus.list(store,direction,{limit:100});
assert.ok(directionEvents.some((event)=>event.externalId==='invoice-private-1'));
assert.ok(directionEvents.some((event)=>event.originEventId==='raw-task-event'),'internal MAVIK events must enter the operational bus');
const commercialEvents=eventBus.list(store,commercial,{limit:100});
assert.equal(commercialEvents.some((event)=>event.externalId==='invoice-private-1'),false,'commercial users must not receive accounting events');
assert.equal(commercialEvents.some((event)=>event.originEventId==='raw-task-event'),false,'commercial users must not receive a direction task event');

const daily=brain.brief(store,direction);
assert.equal(daily.dataMode,'live-server');
assert.equal(daily.firstRecommendation.title,'Le devis Client Beta est accepté');
assert.equal(daily.firstRecommendation.proposedAction.requiresValidation,true);
assert.equal(daily.counts.quotesToProcess,1);
assert.equal(daily.monitoring.realtimeActive,true);
assert.ok(daily.monitoring.activeSources>=1);
assert.match(daily.monitoring.disclosure,/visible/i);
assert.match(daily.promise,/événements réellement reçus/i);

const accountingBrief=brain.brief(store,{ id:'accounting-1', name:'Louis', role:'accountant', tenantId:'avenor' });
assert.equal(accountingBrief.priorities.some((item)=>item.title==='Le devis Client Beta est accepté'),false);
assert.ok(accountingBrief.priorities.some((item)=>item.id==='invoice-invoice-1'));
const commercialBrief=brain.brief(store,commercial);
assert.equal(commercialBrief.priorities.some((item)=>item.id==='task-task-1'),false,'commercial priorities must not include direction tasks');

console.log('Operational Event Bus, traceability, role isolation and priority brain smoke test passed.');
