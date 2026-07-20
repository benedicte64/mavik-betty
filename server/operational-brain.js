'use strict';

const eventBus = require('./operational-event-bus');

const ROLE_COLLECTIONS = Object.freeze({
  commercial:['opportunities','quotes','quoteRequests','subscriptions','meetings','tasks'],
  secretary:['contracts','documents','meetings','tasks'], accountant:['invoices','expenses','meetings','tasks'],
  developer:['softwareProjects','supportTickets','meetings','tasks'], support:['softwareProjects','supportTickets','meetings','tasks'],
  technician:['interventions','vehicles','stockItems','meetings','tasks'], trainee:['meetings','tasks']
});
const ROLE_DEPARTMENT = Object.freeze({ commercial:'commercial', secretary:'secretariat', accountant:'accounting', developer:'product', support:'product', technician:'operations', trainee:'discovery' });

function text(value) { return String(value || '').trim(); }
function safeList(store, collection) { try { return store.list(collection) || []; } catch { return []; } }
function allowed(user = {}, collection) { return ['admin','associate'].includes(user.role) || (ROLE_COLLECTIONS[user.role] || []).includes(collection); }
function records(store, user, collection) {
  if (!allowed(user, collection)) return [];
  const items = safeList(store, collection);
  if (collection !== 'tasks' || ['admin','associate'].includes(user.role)) return items;
  return items.filter((item) => !item.department || item.department === ROLE_DEPARTMENT[user.role]);
}
function open(status) { return !/termin|livr|résolu|resolu|fermé|ferme|annul|payée|payee|gagné|gagne|perdu|signé|signe/i.test(text(status)); }
function today() { return new Date().toISOString().slice(0, 10); }
function isToday(value) { return text(value).slice(0, 10) === today(); }

function buildPriority(input) {
  return {
    id:input.id, score:Number(input.score || 0), level:input.score >= 90 ? 'critical' : input.score >= 75 ? 'urgent' : input.score >= 55 ? 'important' : 'normal',
    title:input.title, why:input.why, impact:input.impact || '', view:input.view || 'dashboard', source:input.source || 'mavik', recordId:input.recordId || '',
    proposedAction:input.proposedAction ? { ...input.proposedAction, requiresValidation:input.proposedAction.requiresValidation !== false } : null,
    evidence:input.evidence || []
  };
}

function priorities(store, user = {}) {
  const day = today();
  const items = new Map();
  const add = (input) => { const item = buildPriority(input); const current = items.get(item.id); if (!current || current.score < item.score) items.set(item.id, item); };
  const events = eventBus.list(store, user, { limit:100 });

  for (const event of events) {
    const signature = `${event.source}.${event.type}`.toLowerCase();
    if (/devis|quote/.test(signature) && /accept|sign/.test(signature)) add({ id:`accepted-quote-${event.entity?.id || event.id}`, score:94, title:event.title || 'Devis accepté', why:'Un accord client vient d’être enregistré.', impact:'La préparation peut commencer sans perdre de temps.', view:'commercial', source:event.source, recordId:event.entity?.id, evidence:[event.id], proposedAction:{ type:'prepare-order', title:'Préparer le dossier et les besoins associés', requiresValidation:true } });
    else if (/stock/.test(signature) && /threshold|low|seuil|rupture/.test(signature)) add({ id:`low-stock-${event.entity?.id || event.id}`, score:88, title:event.title || 'Stock sous le seuil', why:'Le niveau défini a été franchi.', impact:'Une rupture peut bloquer une prestation ou une livraison.', view:'dashboard', source:event.source, recordId:event.entity?.id, evidence:[event.id], proposedAction:{ type:'prepare-purchase', title:'Préparer la commande fournisseur', requiresValidation:true } });
    else if (/telephony/.test(signature) && /missed|manqué|manque/.test(signature)) add({ id:`missed-call-${event.id}`, score:72, title:event.title || 'Appel manqué', why:'Un contact attend probablement une réponse.', impact:'La rapidité de rappel influence la satisfaction et la vente.', view:'messages', source:event.source, evidence:[event.id], proposedAction:{ type:'prepare-callback', title:'Préparer le rappel', requiresValidation:false } });
    else if (/gmail|email/.test(signature) && /received|reply|response|reçu|recu/.test(signature)) add({ id:`customer-reply-${event.id}`, score:event.importance === 'urgent' ? 86 : 68, title:event.title || 'Nouvelle réponse reçue', why:'Une nouvelle information attend votre lecture.', impact:'La réponse peut modifier une priorité ou débloquer un dossier.', view:'messages', source:event.source, evidence:[event.id] });
    else if (/calendar/.test(signature) && /changed|updated|cancel|modifi|annul/.test(signature)) add({ id:`calendar-change-${event.entity?.id || event.id}`, score:65, title:event.title || 'Rendez-vous modifié', why:'Le planning vient de changer.', impact:'Les personnes et tâches concernées doivent être réalignées.', view:'calendar', source:event.source, evidence:[event.id] });
    else if (['urgent','critical'].includes(event.importance)) add({ id:`urgent-event-${event.id}`, score:event.importance === 'critical' ? 96 : 82, title:event.title, why:event.summary, impact:'Cet événement a été signalé comme prioritaire par sa source.', source:event.source, evidence:[event.id] });
  }

  for (const task of records(store,user,'tasks')) if (open(task.status) && (/urgent|haute/i.test(text(task.priority)) || (task.dueDate && task.dueDate <= day))) add({ id:`task-${task.id}`, score:/urgent/i.test(text(task.priority)) ? 93 : task.dueDate < day ? 87 : 78, title:task.title || 'Tâche prioritaire', why:task.dueDate < day ? 'Cette tâche a dépassé son échéance.' : 'Cette tâche est urgente ou arrive à échéance.', impact:'Un retard peut désorganiser le travail des autres services.', view:'dashboard', source:'mavik', recordId:task.id, proposedAction:{ type:'review-task', title:'Ouvrir et traiter la tâche', requiresValidation:false } });
  for (const invoice of records(store,user,'invoices')) if (open(invoice.status) && invoice.dueDate && invoice.dueDate < day) add({ id:`invoice-${invoice.id}`, score:84, title:`Relancer ${invoice.customer || invoice.number || 'une facture'}`, why:`La facture est arrivée à échéance le ${invoice.dueDate}.`, impact:'Une relance rapide protège la trésorerie.', view:'accounting', source:'accounting', recordId:invoice.id, proposedAction:{ type:'prepare-reminder', title:'Préparer la relance', requiresValidation:true } });
  for (const opportunity of records(store,user,'opportunities')) if (open(opportunity.stage) && opportunity.dueDate && opportunity.dueDate <= day) add({ id:`opportunity-${opportunity.id}`, score:74, title:`Relancer ${opportunity.company || 'une opportunité'}`, why:opportunity.nextAction || 'L’action commerciale prévue arrive à échéance.', impact:'Une relance peut accélérer la décision et le chiffre d’affaires.', view:'commercial', source:'crm', recordId:opportunity.id, proposedAction:{ type:'prepare-commercial-message', title:'Préparer le message de relance', requiresValidation:true } });
  for (const ticket of records(store,user,'supportTickets')) if (open(ticket.status) && /urgent|haute/i.test(text(ticket.priority))) add({ id:`ticket-${ticket.id}`, score:86, title:ticket.title || 'Ticket support prioritaire', why:'Le support a classé ce dossier en haute priorité.', impact:'La satisfaction et la continuité de service peuvent être affectées.', view:'product', source:'mavik', recordId:ticket.id });
  for (const item of records(store,user,'stockItems')) if (Number(item.alertThreshold || 0) > 0 && Number(item.quantity || 0) <= Number(item.alertThreshold || 0)) add({ id:`stock-${item.id}`, score:82, title:`Réapprovisionner ${item.name || 'le stock'}`, why:`Quantité ${item.quantity || 0}, seuil ${item.alertThreshold}.`, impact:'Une rupture peut bloquer l’activité.', source:'stock', recordId:item.id, proposedAction:{ type:'prepare-purchase', title:'Préparer la commande fournisseur', requiresValidation:true } });
  return [...items.values()].sort((a,b) => b.score - a.score).slice(0, 12).map((item,index) => ({ ...item, rank:index + 1 }));
}

function brief(store, user = {}) {
  const events = eventBus.list(store,user,{limit:100});
  const ranked = priorities(store,user);
  const quotes = [...records(store,user,'quotes'), ...records(store,user,'quoteRequests')].filter((item) => open(item.status));
  const followUps = records(store,user,'opportunities').filter((item) => open(item.stage) && item.dueDate && item.dueDate <= today());
  const urgent = records(store,user,'tasks').filter((item) => open(item.status) && (/urgent|haute/i.test(text(item.priority)) || (item.dueDate && item.dueDate <= today())));
  const meetings = [...records(store,user,'meetings').filter((item) => isToday(item.start)), ...records(store,user,'externalCalendarEvents').filter((item) => isToday(item.start || item.startDate))];
  const lowStock = records(store,user,'stockItems').filter((item) => Number(item.alertThreshold || 0) > 0 && Number(item.quantity || 0) <= Number(item.alertThreshold || 0));
  const replies = events.filter((event) => /gmail|email/.test(`${event.source}.${event.type}`) && /received|reply|response|reçu|recu/.test(event.type));
  const workloadScore = urgent.length * 3 + quotes.length * 2 + followUps.length * 2 + meetings.length + lowStock.length * 2 + replies.length;
  const monitoring = eventBus.status(store,user);
  return {
    generatedAt:new Date().toISOString(), dataMode:'live-server', role:user.role || 'trainee',
    monitoring:{ ...monitoring, disclosure:'Toute donnée reçue est visible dans le journal des événements selon les droits du rôle.' },
    workload:{ score:workloadScore, label:workloadScore >= 12 ? 'Élevée' : workloadScore >= 6 ? 'Modérée' : 'Maîtrisée' },
    counts:{ quotesToProcess:quotes.length, commercialFollowUps:followUps.length, urgentItems:urgent.length, appointmentsToday:meetings.length, supplierActions:lowStock.length, customerReplies:replies.length },
    priorities:ranked,
    recentEvents:events.slice(0,8),
    firstRecommendation:ranked[0] || null,
    explanation:ranked[0] ? `La priorité n°1 est « ${ranked[0].title} » car ${ranked[0].why.toLowerCase()}` : 'Aucune urgence n’est démontrée par les données actuellement disponibles.',
    promise:monitoring.realtimeActive
      ? 'Betty recalcule les priorités à partir des événements réellement reçus par MAVIK.'
      : 'Betty ne prétend pas surveiller en continu : les priorités seront recalculées dès qu’un connecteur transmettra des événements.'
  };
}

module.exports = { brief, priorities };
