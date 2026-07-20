'use strict';

const DIRECTION_ROLES = new Set(['admin', 'associate']);
const AREAS = Object.freeze([
  { id: 'direction', label: 'Direction', roles: ['admin', 'associate'] },
  { id: 'commercial', label: 'Commercial', roles: ['admin', 'associate', 'commercial'] },
  { id: 'secretariat', label: 'Secrétariat', roles: ['admin', 'associate', 'secretary'] },
  { id: 'accounting', label: 'Comptabilité', roles: ['admin', 'associate', 'accountant'] },
  { id: 'product', label: 'Produit & développement', roles: ['admin', 'associate', 'developer', 'support'] }
]);

function records(store, collection) {
  try { return store.list(collection) || []; } catch { return []; }
}
function sum(items, field) { return items.reduce((total, item) => total + Number(item[field] || 0), 0); }
function direction(user = {}) { return DIRECTION_ROLES.has(user.role); }
function accessibleAreas(user = {}) { return AREAS.filter((area) => area.roles.includes(user.role)); }
function overview(store, user = {}, can = () => true) {
  const permittedRecords = (collection) => can(user, `${collection}.read`) ? records(store, collection) : [];
  const opportunities = permittedRecords('opportunities');
  const subscriptions = permittedRecords('subscriptions');
  const invoices = permittedRecords('invoices');
  const expenses = permittedRecords('expenses');
  const projects = permittedRecords('softwareProjects');
  const products = permittedRecords('softwareProducts');
  const contracts = permittedRecords('contracts');
  const tickets = permittedRecords('supportTickets');
  const meetings = permittedRecords('meetings');
  const tasks = permittedRecords('tasks');
  const activeOpportunities = opportunities.filter((item) => !/gagné|gagne|perdu/i.test(item.stage));
  const activeSubscriptions = subscriptions.filter((item) => /actif|active/i.test(item.status));
  const unpaidInvoices = invoices.filter((item) => !/payée|payee|annul/i.test(item.status));
  const openProjects = projects.filter((item) => !/termin|livr|annul/i.test(item.status));
  const openTickets = tickets.filter((item) => !/résolu|resolu|fermé|ferme/i.test(item.status));
  return {
    profile: { company: 'Avenor', product: 'MAVIK', assistant: 'Betty', mode: 'software-company', dataPolicy: 'demo-or-tenant-only' },
    user: { id: user.id || '', name: user.name || user.username || '', role: user.role || 'trainee' },
    areas: accessibleAreas(user),
    metrics: {
      pipeline: sum(activeOpportunities, 'value'),
      weightedPipeline: Math.round(activeOpportunities.reduce((total, item) => total + Number(item.value || 0) * Number(item.probability || 0) / 100, 0)),
      mrr: sum(activeSubscriptions, 'monthlyAmount'),
      activeSubscriptions: activeSubscriptions.length,
      unpaidInvoices: sum(unpaidInvoices, 'amount'),
      monthlyExpenses: sum(expenses.filter((item) => !/refus|annul/i.test(item.status)), 'amount'),
      openProjects: openProjects.length,
      openTickets: openTickets.length,
      pendingTasks: tasks.filter((item) => !/termin|annul/i.test(item.status)).length
    },
    opportunities: opportunities.slice(0, 100), subscriptions: subscriptions.slice(0, 100), invoices: invoices.slice(0, 100),
    expenses: expenses.slice(0, 100), projects: projects.slice(0, 100), products: products.slice(0, 100),
    contracts: contracts.slice(0, 100), tickets: tickets.slice(0, 100), meetings: meetings.slice(0, 100), tasks: tasks.slice(0, 100)
  };
}
function isoDay(offset = 0) { const date = new Date(); date.setDate(date.getDate() + offset); return date.toISOString().slice(0, 10); }
function seedDemo(store, user = {}) {
  if (!direction(user)) throw Object.assign(new Error('SOFTWARE_COMPANY_DIRECTION_REQUIRED'), { status: 403 });
  const created = {};
  const seed = (collection, items) => {
    if (records(store, collection).length) return [];
    created[collection] = items.map((item) => store.create(collection, { ...item, demo: true, createdBy: user.id || '', createdByName: user.name || '' }));
    return created[collection];
  };
  seed('softwareProducts', [
    { name: 'MAVIK Core', version: '0.31.0', status: 'Développement', owner: 'Équipe Produit', monthlyPrice: 149 },
    { name: 'MAVIK Studio', version: '0.10.0', status: 'Conception', owner: 'Équipe Produit', monthlyPrice: 299 }
  ]);
  seed('opportunities', [
    { company: 'Atelier Horizon', contact: 'Claire Martin', product: 'MAVIK', stage: 'Démonstration', value: 7200, probability: 60, owner: 'Équipe commerciale', nextAction: 'Envoyer la proposition', dueDate: isoDay(2) },
    { company: 'Nova Services', contact: 'Yanis Robert', product: 'MAVIK Studio', stage: 'Qualification', value: 14400, probability: 35, owner: 'Équipe commerciale', nextAction: 'Planifier la découverte', dueDate: isoDay(4) }
  ]);
  seed('softwareProjects', [
    { name: 'Portail client multi-tenant', product: 'MAVIK Core', status: 'En cours', progress: 68, owner: 'Produit & développement', targetDate: isoDay(21), priority: 'Haute' },
    { name: 'Assistant de configuration', product: 'MAVIK Studio', status: 'Conception', progress: 32, owner: 'Produit & développement', targetDate: isoDay(35), priority: 'Normale' }
  ]);
  seed('subscriptions', [
    { customer: 'Client Démo Alpha', plan: 'MAVIK Pro', monthlyAmount: 299, status: 'Actif', renewalDate: isoDay(28), owner: 'Commercial' },
    { customer: 'Client Démo Beta', plan: 'MAVIK Essentiel', monthlyAmount: 149, status: 'Actif', renewalDate: isoDay(14), owner: 'Commercial' }
  ]);
  seed('invoices', [
    { customer: 'Client Démo Alpha', amount: 3588, status: 'Envoyée', issueDate: isoDay(-10), dueDate: isoDay(20) },
    { customer: 'Client Démo Beta', amount: 894, status: 'À relancer', issueDate: isoDay(-35), dueDate: isoDay(-5) }
  ]);
  seed('contracts', [
    { title: 'Contrat SaaS annuel', customer: 'Client Démo Alpha', status: 'Signé', owner: 'Secrétariat', renewalDate: isoDay(180), value: 3588 },
    { title: 'Accord de confidentialité', customer: 'Nova Services', status: 'À envoyer', owner: 'Secrétariat', renewalDate: '', value: 0 }
  ]);
  seed('supportTickets', [
    { title: 'Importer les anciens clients', customer: 'Client Démo Alpha', status: 'En cours', priority: 'Haute', assignee: 'Support', product: 'MAVIK Core' }
  ]);
  seed('meetings', [
    { title: 'Point commercial hebdomadaire', start: `${isoDay(1)}T09:00:00`, end: `${isoDay(1)}T09:45:00`, department: 'commercial', attendees: ['Direction', 'Commercial'], location: 'Visioconférence' },
    { title: 'Revue produit MAVIK', start: `${isoDay(2)}T14:00:00`, end: `${isoDay(2)}T15:00:00`, department: 'product', attendees: ['Direction', 'Produit'], location: 'Avenor' }
  ]);
  return { created, overview: overview(store, user) };
}

module.exports = { AREAS, accessibleAreas, overview, seedDemo };
