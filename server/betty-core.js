'use strict';

const operationalBrain = require('./operational-brain');

const PROFILE = Object.freeze({ owner:'Avenor', product:'MAVIK', assistant:'Betty', version:'1.0.0', model:'adaptive-business-core' });
const CAPABILITIES = Object.freeze([
  'Mémoire métier persistante', 'Journal d’audit', 'Gestionnaire de tâches', 'Centre de notifications',
  'Base documentaire', 'Analyse de procédures', 'Suggestions décisionnelles avec validation humaine'
]);
const ROLE_LABELS = Object.freeze({ admin:'Direction', associate:'Direction', commercial:'Commercial', secretary:'Secrétariat', accountant:'Comptabilité', developer:'Produit & développement', support:'Support', technician:'Opérations', trainee:'Découverte' });
const ROLE_HOME = Object.freeze({ admin:'direction', associate:'direction', commercial:'commercial', secretary:'secretariat', accountant:'accounting', developer:'product', support:'product', technician:'dashboard', trainee:'dashboard' });
const ROLE_AREAS = Object.freeze({ admin:['direction','commercial','secretariat','accounting','product'], associate:['direction','commercial','secretariat','accounting','product'], commercial:['commercial'], secretary:['secretariat'], accountant:['accounting'], developer:['product'], support:['product'], technician:[], trainee:[] });
const TASK_DEPARTMENTS = Object.freeze({ admin:'direction', associate:'direction', commercial:'commercial', secretary:'secretariat', accountant:'accounting', developer:'product', support:'product', technician:'operations' });

function text(value) { return String(value || '').trim(); }
function normalized(value) { return text(value).toLowerCase(); }
function today() { return new Date().toISOString().slice(0, 10); }
function safeList(store, collection) { try { return store.list(collection) || []; } catch { return []; } }
function firstName(user = {}) { return text(user.name || user.username || 'Bonjour').split(/\s+/)[0]; }
function money(value) { return new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR', maximumFractionDigits:0 }).format(Number(value || 0)); }
function open(status) { return !/termin|livr|résolu|resolu|fermé|ferme|annul|payée|payee|gagné|gagne|perdu/i.test(text(status)); }
function visibleTo(user = {}, department = '') { return ['admin','associate'].includes(user.role) || !department || TASK_DEPARTMENTS[user.role] === department; }
function allowed(user = {}, view) { return ['dashboard','calendar','messages'].includes(view) || (ROLE_AREAS[user.role] || []).includes(view); }

function audit(store, user = {}, action, details = {}) {
  try { return store.create('bettyAudit', { assistant:'Betty', action, userId:user.id || '', userName:user.name || user.username || '', userRole:user.role || '', details, humanValidated:details.humanValidated === true }); }
  catch { return null; }
}

function remember(store, user = {}, input = {}, result = {}) {
  try { return store.create('bettyMemory', { assistant:'Betty', userId:user.id || '', userName:user.name || user.username || '', userRole:user.role || '', intent:result.intent || 'conversation', request:text(input.text), answer:text(result.answer), view:result.view || '', requiresConfirmation:result.requiresConfirmation === true }); }
  catch { return null; }
}

function memory(store, user = {}, limit = 20) {
  const max = Math.max(1, Math.min(100, Number(limit) || 20));
  return safeList(store, 'bettyMemory').filter((item) => !user.id || item.userId === user.id).slice(0, max);
}

function notifications(store, user = {}) {
  const records = [];
  const day = today();
  for (const task of safeList(store, 'tasks')) {
    if (!open(task.status) || !visibleTo(user, task.department)) continue;
    if (/urgent|haute/i.test(text(task.priority)) || (task.dueDate && task.dueDate <= day)) records.push({ level:'urgent', type:'task', title:task.title || 'Tâche prioritaire', detail:`${task.assignee || ROLE_LABELS[user.role] || 'Équipe'} · ${task.dueDate || 'sans échéance'}`, view:'dashboard', recordId:task.id });
  }
  if (['admin','associate','accountant'].includes(user.role)) for (const invoice of safeList(store, 'invoices')) {
    if (open(invoice.status) && invoice.dueDate && invoice.dueDate < day) records.push({ level:'warning', type:'invoice', title:`Facture à relancer · ${invoice.customer || invoice.number || ''}`, detail:`${money(invoice.amount)} · échéance ${invoice.dueDate}`, view:'accounting', recordId:invoice.id });
  }
  if (['admin','associate','commercial'].includes(user.role)) for (const opportunity of safeList(store, 'opportunities')) {
    if (open(opportunity.stage) && opportunity.dueDate && opportunity.dueDate <= day) records.push({ level:'warning', type:'opportunity', title:`Action commerciale · ${opportunity.company || ''}`, detail:opportunity.nextAction || 'Prochaine action à préciser', view:'commercial', recordId:opportunity.id });
  }
  if (['admin','associate','developer','support'].includes(user.role)) for (const ticket of safeList(store, 'supportTickets')) {
    if (open(ticket.status) && /urgent|haute/i.test(text(ticket.priority))) records.push({ level:'urgent', type:'support', title:ticket.title || 'Ticket prioritaire', detail:`${ticket.customer || 'Client'} · ${ticket.assignee || 'à attribuer'}`, view:'product', recordId:ticket.id });
  }
  return records.slice(0, 20);
}

function suggestions(store, user = {}) {
  const items = [];
  const alerts = notifications(store, user);
  const overdue = alerts.filter((item) => item.type === 'invoice');
  if (overdue.length) items.push({ id:'recover-overdue-invoices', title:`Relancer ${overdue.length} facture(s) arrivée(s) à échéance`, reason:'Une relance rapide protège la trésorerie.', view:'accounting', requiresConfirmation:true });
  const commercial = safeList(store, 'opportunities').filter((item) => open(item.stage)).sort((a,b) => Number(b.value || 0) * Number(b.probability || 0) - Number(a.value || 0) * Number(a.probability || 0))[0];
  if (commercial && ['admin','associate','commercial'].includes(user.role)) items.push({ id:'focus-best-opportunity', title:`Prioriser ${commercial.company || 'la meilleure opportunité'}`, reason:`Valeur pondérée estimée : ${money(Number(commercial.value || 0) * Number(commercial.probability || 0) / 100)}.`, view:'commercial', requiresConfirmation:false });
  const project = safeList(store, 'softwareProjects').filter((item) => open(item.status)).sort((a,b) => Number(a.progress || 0) - Number(b.progress || 0))[0];
  if (project && ['admin','associate','developer','support'].includes(user.role)) items.push({ id:'review-project', title:`Faire le point sur ${project.name}`, reason:`Avancement déclaré : ${Number(project.progress || 0)} %.`, view:'product', requiresConfirmation:false });
  const task = alerts.find((item) => item.type === 'task');
  if (task) items.push({ id:'handle-priority-task', title:task.title, reason:'Cette tâche est prioritaire ou arrivée à échéance.', view:'dashboard', requiresConfirmation:false });
  return items.slice(0, 6);
}

function metrics(store, user = {}) {
  const opportunities = allowed(user,'commercial') ? safeList(store, 'opportunities').filter((item) => open(item.stage)) : [];
  const subscriptions = (allowed(user,'commercial') || allowed(user,'accounting')) ? safeList(store, 'subscriptions').filter((item) => /actif/i.test(text(item.status))) : [];
  const invoices = allowed(user,'accounting') ? safeList(store, 'invoices').filter((item) => open(item.status)) : [];
  const projects = allowed(user,'product') ? safeList(store, 'softwareProjects').filter((item) => open(item.status)) : [];
  return {
    pipeline: opportunities.reduce((sum,item) => sum + Number(item.value || 0), 0),
    weightedPipeline: Math.round(opportunities.reduce((sum,item) => sum + Number(item.value || 0) * Number(item.probability || 0) / 100, 0)),
    monthlyRecurringRevenue: subscriptions.reduce((sum,item) => sum + Number(item.monthlyAmount || 0), 0),
    unpaidInvoices: invoices.reduce((sum,item) => sum + Number(item.amount || 0), 0),
    openProjects: projects.length,
    openTickets: allowed(user,'product') ? safeList(store, 'supportTickets').filter((item) => open(item.status)).length : 0,
    pendingTasks: safeList(store, 'tasks').filter((item) => open(item.status) && visibleTo(user, item.department)).length
  };
}

function brief(store, user = {}) {
  const alerts = notifications(store, user); const recommendations = suggestions(store, user); const summary = metrics(store, user); const operations = operationalBrain.brief(store,user);
  return {
    profile:PROFILE, capabilities:CAPABILITIES, user:{ id:user.id || '', name:user.name || user.username || '', role:user.role || 'trainee', roleLabel:ROLE_LABELS[user.role] || user.role || 'Utilisateur', home:ROLE_HOME[user.role] || 'dashboard' },
    greeting:`Bonjour ${firstName(user)}. Je vois ${summary.pendingTasks} tâche(s) en attente et ${alerts.length} alerte(s) utiles pour votre espace ${ROLE_LABELS[user.role] || 'MAVIK'}.`,
    metrics:summary, notifications:alerts, suggestions:recommendations, operations, memory:memory(store,user,5),
    principles:{ humanValidation:true, traceability:true, explainedRecommendations:true, clientNeutral:true }
  };
}

function result(store, user, input, value) {
  const output = { assistant:'Betty', version:PROFILE.version, explanation:value.explanation || 'Réponse construite à partir des données autorisées pour votre rôle.', requiresConfirmation:value.requiresConfirmation === true, ...value };
  remember(store,user,input,output); audit(store,user,'conversation.command',{ intent:output.intent, view:output.view || '', requiresConfirmation:output.requiresConfirmation }); return output;
}

function execute(store, input = {}, user = {}) {
  const request = text(input.text); const query = normalized(request); const summary = metrics(store,user);
  if (!request) return result(store,user,input,{ intent:'help', answer:'Dites-moi ce que vous voulez préparer, vérifier ou comprendre.', view:ROLE_HOME[user.role] || 'dashboard' });
  const taskMatch=request.match(/(?:ajoute|crée|cree|prépare|prepare)\s+(?:une\s+)?tâche\s*[:\-]?\s*(.+)/i);
  if (taskMatch && !TASK_DEPARTMENTS[user.role]) return result(store,user,input,{ intent:'access-denied', answer:'Votre profil peut consulter les tâches, mais ne peut pas en créer.', view:'dashboard', explanation:'Betty applique les droits d’écriture de votre rôle avant de proposer une action.' });
  if (taskMatch && input.confirmed !== true) return result(store,user,input,{ intent:'create-task', answer:`Je peux créer la tâche « ${taskMatch[1].trim()} ». Confirmez-vous cette écriture ?`, view:'dashboard', requiresConfirmation:true, proposedAction:{ type:'create-task', title:taskMatch[1].trim(), originalText:request }, explanation:'La création modifie les données de l’entreprise et nécessite donc votre confirmation.' });
  if (taskMatch && input.confirmed === true) {
    const task=store.create('tasks',{ title:taskMatch[1].trim(), status:'À faire', priority:/urgent/i.test(query)?'Urgente':'Normale', assignee:ROLE_LABELS[user.role] || user.name || 'Équipe', department:TASK_DEPARTMENTS[user.role], createdBy:user.id || '', createdByName:user.name || '' });
    audit(store,user,'task.created',{ recordId:task.id, title:task.title, humanValidated:true });
    return result(store,user,input,{ intent:'create-task-confirmed', answer:`C’est fait. La tâche « ${task.title} » est enregistrée et tracée.`, view:'dashboard', data:{ task }, explanation:'L’action a été exécutée après votre confirmation explicite.' });
  }
  if (/bonjour|priorit|point du jour|résumé|resume|que dois-je|quoi faire/.test(query)) {
    const data = brief(store,user); const operational = data.operations.firstRecommendation; const first = operational || data.suggestions[0];
    const reason = operational?.why || first?.reason || '';
    return result(store,user,input,{ intent:'daily-brief', answer:first?`${data.greeting} Ma priorité n°1 : ${first.title}. ${reason}`:data.greeting, view:first?.view || data.user.home, data });
  }
  if (/commercial|vente|prospect|pipeline|abonnement/.test(query)) return allowed(user,'commercial') ? result(store,user,input,{ intent:'commercial', answer:`Le pipeline actif est de ${money(summary.pipeline)}, dont ${money(summary.weightedPipeline)} pondérés.`, view:'commercial', data:{ metrics:summary } }) : result(store,user,input,{ intent:'access-denied', answer:'Cet espace commercial n’est pas autorisé pour votre rôle.', view:ROLE_HOME[user.role] || 'dashboard', explanation:'Betty applique les droits de votre profil avant de consulter les données.' });
  if (/compta|comptab|facture|impay|trésor/.test(query)) return allowed(user,'accounting') ? result(store,user,input,{ intent:'accounting', answer:`Le montant des factures encore ouvertes est de ${money(summary.unpaidInvoices)}.`, view:'accounting', data:{ metrics:summary } }) : result(store,user,input,{ intent:'access-denied', answer:'Cet espace comptable n’est pas autorisé pour votre rôle.', view:ROLE_HOME[user.role] || 'dashboard', explanation:'Betty applique les droits de votre profil avant de consulter les données.' });
  if (/secrét|contrat|administratif|courrier/.test(query)) return allowed(user,'secretariat') ? result(store,user,input,{ intent:'secretariat', answer:`Je vous ouvre la coordination administrative. ${safeList(store,'contracts').filter((item)=>open(item.status)).length} contrat(s) ou document(s) restent à suivre.`, view:'secretariat' }) : result(store,user,input,{ intent:'access-denied', answer:'Cet espace administratif n’est pas autorisé pour votre rôle.', view:ROLE_HOME[user.role] || 'dashboard', explanation:'Betty applique les droits de votre profil avant de consulter les données.' });
  if (/produit|dévelop|logiciel|projet|support|ticket/.test(query)) return allowed(user,'product') ? result(store,user,input,{ intent:'product', answer:`${summary.openProjects} projet(s) logiciel(s) et ${summary.openTickets} ticket(s) support sont ouverts.`, view:'product', data:{ metrics:summary } }) : result(store,user,input,{ intent:'access-denied', answer:'Cet espace produit n’est pas autorisé pour votre rôle.', view:ROLE_HOME[user.role] || 'dashboard', explanation:'Betty applique les droits de votre profil avant de consulter les données.' });
  if (/agenda|calendrier|rendez/.test(query)) return result(store,user,input,{ intent:'calendar', answer:`Je vous ouvre l’agenda unifié. ${safeList(store,'meetings').filter((item)=>open(item.status)).length} rendez-vous sont suivis dans MAVIK.`, view:'calendar' });
  if (/message|discussion|équipe|interne/.test(query)) return result(store,user,input,{ intent:'messages', answer:'Je vous ouvre la discussion interne de l’entreprise.', view:'messages' });
  if (/mémoire|memoire|historique|souviens/.test(query)) { const records=memory(store,user,10);return result(store,user,input,{ intent:'memory', answer:records.length?`Je retrouve ${records.length} échange(s) récent(s) dans votre mémoire métier.`:'Votre mémoire métier ne contient pas encore d’échange antérieur.', view:ROLE_HOME[user.role] || 'dashboard', data:{ records } }); }
  if (/document|procédure|procedure|consigne/.test(query)) { const docs=safeList(store,'documents');const procedures=docs.filter((item)=>/procédure|procedure|consigne|mode opératoire/i.test(`${item.category || ''} ${item.title || ''}`));return result(store,user,input,{ intent:'documents', answer:`La base contient ${docs.length} document(s), dont ${procedures.length} procédure(s) identifiable(s). Je ne modifie jamais une procédure sans validation humaine.`, view:'dashboard', data:{ records:procedures } }); }
  if (/suggestion|recommand|amélior|amelior|décision|decision/.test(query)) { const records=suggestions(store,user);return result(store,user,input,{ intent:'suggestions', answer:records.length?records.map((item,index)=>`${index+1}. ${item.title} — ${item.reason}`).join('\n'):'Je ne détecte aucune recommandation urgente avec les données disponibles.', view:records[0]?.view || ROLE_HOME[user.role] || 'dashboard', data:{ records } }); }
  return result(store,user,input,{ intent:'help', answer:`Je peux résumer vos priorités, ouvrir votre espace ${ROLE_LABELS[user.role] || 'métier'}, consulter la mémoire, analyser les documents ou préparer une action à confirmer.`, view:ROLE_HOME[user.role] || 'dashboard' });
}

module.exports = { PROFILE, CAPABILITIES, ROLE_HOME, audit, remember, memory, notifications, suggestions, metrics, brief, execute };
