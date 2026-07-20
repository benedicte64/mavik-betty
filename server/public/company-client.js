(() => {
  'use strict';

  const STORAGE_KEY = 'mavik-betty-company-demo-v2';
  const CHANNELS = [
    ['general', 'Toute l’équipe'], ['commercial', 'Commercial'], ['secretariat', 'Secrétariat'],
    ['accounting', 'Comptabilité'], ['product', 'Produit & développement'], ['direction', 'Direction']
  ];
  const VIEW_META = {
    dashboard: ['Pilotage de l’entreprise', 'Vue d’ensemble'], commercial: ['Vente de logiciels', 'Commercial'],
    secretariat: ['Administration et coordination', 'Secrétariat'], accounting: ['Suivi financier', 'Comptabilité'],
    product: ['Création et exploitation des logiciels', 'Produit & développement'], direction: ['Décisions et performance', 'Direction'],
    calendar: ['Tous les rendez-vous au même endroit', 'Agenda unifié'], messages: ['Échanges privés à l’entreprise', 'Discussion interne']
  };
  const $ = (id) => document.getElementById(id);
  const esc = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const uuid = () => globalThis.crypto?.randomUUID?.() || `demo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const day = (offset = 0) => { const date = new Date(); date.setDate(date.getDate() + offset); return date.toISOString().slice(0, 10); };
  const dateTime = (offset, hour) => `${day(offset)}T${String(hour).padStart(2, '0')}:00:00`;
  const money = (value) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number(value || 0));
  const shortDate = (value) => value ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(new Date(String(value).length === 10 ? `${value}T12:00:00` : value)) : 'À définir';
  const shortTime = (value) => value ? new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '';
  const tone = (value = '') => /pay|sign|actif|gagn|termin|résolu/i.test(value) ? 'green' : /retard|impay|urgent|bloqu|perdu/i.test(value) ? 'red' : /attente|relance|prépar|conception|qualification/i.test(value) ? 'amber' : '';
  const pill = (value) => `<span class="pill ${tone(value)}">${esc(value || 'À traiter')}</span>`;

  let apiMode = false;
  let currentView = 'dashboard';
  let activeChannel = 'general';
  let overview = null;
  let calendarSettings = { calendars: [], feedUrl: '', configured: false };
  let externalEvents = [];
  let messages = [];
  let directory = [];
  let localState = null;

  function defaultState() {
    return {
      version: 2,
      user: { id: 'demo-direction', name: 'Bénédicte', role: 'admin' },
      softwareProducts: [
        { id: uuid(), name: 'MAVIK Core', version: '0.31.0', status: 'Développement', owner: 'Équipe Produit', monthlyPrice: 149 },
        { id: uuid(), name: 'MAVIK Studio', version: '0.10.0', status: 'Conception', owner: 'Équipe Produit', monthlyPrice: 299 }
      ],
      opportunities: [
        { id: uuid(), company: 'Atelier Horizon', contact: 'Claire Martin', product: 'MAVIK', stage: 'Démonstration', value: 7200, probability: 60, owner: 'Lina', nextAction: 'Envoyer la proposition', dueDate: day(2) },
        { id: uuid(), company: 'Nova Services', contact: 'Yanis Robert', product: 'MAVIK Studio', stage: 'Qualification', value: 14400, probability: 35, owner: 'Lina', nextAction: 'Planifier la découverte', dueDate: day(4) },
        { id: uuid(), company: 'Maison Bellis', contact: 'Sofia Bernard', product: 'MAVIK', stage: 'Proposition', value: 9800, probability: 75, owner: 'Hugo', nextAction: 'Relancer la direction', dueDate: day(1) }
      ],
      softwareProjects: [
        { id: uuid(), name: 'Portail client multi-tenant', product: 'MAVIK Core', status: 'En cours', progress: 68, owner: 'Nora', targetDate: day(21), priority: 'Haute' },
        { id: uuid(), name: 'Assistant de configuration', product: 'MAVIK Studio', status: 'Conception', progress: 32, owner: 'Nora', targetDate: day(35), priority: 'Normale' }
      ],
      subscriptions: [
        { id: uuid(), customer: 'Client Démo Alpha', plan: 'MAVIK Pro', monthlyAmount: 299, status: 'Actif', renewalDate: day(28), owner: 'Lina' },
        { id: uuid(), customer: 'Client Démo Beta', plan: 'MAVIK Essentiel', monthlyAmount: 149, status: 'Actif', renewalDate: day(14), owner: 'Hugo' }
      ],
      invoices: [
        { id: uuid(), number: 'FAC-DEMO-0001', customer: 'Client Démo Alpha', amount: 3588, status: 'Envoyée', issueDate: day(-10), dueDate: day(20) },
        { id: uuid(), number: 'FAC-DEMO-0002', customer: 'Client Démo Beta', amount: 894, status: 'À relancer', issueDate: day(-35), dueDate: day(-5) }
      ],
      expenses: [
        { id: uuid(), supplier: 'Cloud Europe', label: 'Hébergement SaaS', amount: 640, status: 'Validée', dueDate: day(8), category: 'Infrastructure' },
        { id: uuid(), supplier: 'Design Lab', label: 'Identité interface', amount: 1200, status: 'À valider', dueDate: day(5), category: 'Produit' }
      ],
      contracts: [
        { id: uuid(), number: 'CTR-DEMO-0001', title: 'Contrat SaaS annuel', customer: 'Client Démo Alpha', status: 'Signé', owner: 'Secrétariat', renewalDate: day(180), value: 3588 },
        { id: uuid(), number: 'CTR-DEMO-0002', title: 'Accord de confidentialité', customer: 'Nova Services', status: 'À envoyer', owner: 'Secrétariat', renewalDate: '', value: 0 }
      ],
      supportTickets: [
        { id: uuid(), number: 'TICKET-DEMO-0001', title: 'Importer les anciens clients', customer: 'Client Démo Alpha', status: 'En cours', priority: 'Haute', assignee: 'Malo', product: 'MAVIK Core' }
      ],
      meetings: [
        { id: uuid(), title: 'Point commercial hebdomadaire', start: dateTime(1, 9), end: dateTime(1, 10), department: 'commercial', attendees: ['Direction', 'Commercial'], location: 'Visioconférence', status: 'Confirmé' },
        { id: uuid(), title: 'Revue produit MAVIK', start: dateTime(2, 14), end: dateTime(2, 15), department: 'product', attendees: ['Direction', 'Produit'], location: 'Avenor', status: 'Confirmé' },
        { id: uuid(), title: 'Clôture comptable mensuelle', start: dateTime(4, 11), end: dateTime(4, 12), department: 'accounting', attendees: ['Direction', 'Comptabilité'], location: 'Avenor', status: 'Confirmé' }
      ],
      tasks: [
        { id: uuid(), title: 'Valider la proposition Maison Bellis', status: 'À faire', priority: 'Haute', dueDate: day(1), assignee: 'Direction', department: 'direction' },
        { id: uuid(), title: 'Relancer la facture FAC-DEMO-0002', status: 'À faire', priority: 'Haute', dueDate: day(0), assignee: 'Comptabilité', department: 'accounting' },
        { id: uuid(), title: 'Préparer le contrat Nova Services', status: 'À faire', priority: 'Normale', dueDate: day(3), assignee: 'Secrétariat', department: 'secretariat' }
      ],
      calendars: [
        { id: 'avenor-team', name: 'Équipe Avenor', provider: 'google', account: 'Autorisation à effectuer', configured: false, enabled: true, color: '#4285f4' },
        { id: 'direction', name: 'Direction', provider: 'outlook', account: 'Autorisation à effectuer', configured: false, enabled: true, color: '#0078d4' }
      ],
      messages: [
        { id: uuid(), channel: 'general', fromUserId: 'betty', fromName: 'Betty', body: 'Bienvenue dans l’espace interne Avenor. Chaque métier dispose de son canal et les décisions importantes restent traçables.', createdAt: new Date().toISOString(), readBy: ['demo-direction'] },
        { id: uuid(), channel: 'commercial', fromUserId: 'demo-commercial', fromName: 'Lina · Commercial', body: 'La démonstration Maison Bellis est positive. Je prépare la relance pour demain.', createdAt: new Date(Date.now() - 3600000).toISOString(), readBy: [] }
      ],
      directory: [
        { id: 'demo-direction', name: 'Bénédicte', role: 'admin', isSelf: true },
        { id: 'demo-commercial', name: 'Lina', role: 'commercial' },
        { id: 'demo-secretariat', name: 'Emma', role: 'secretary' },
        { id: 'demo-accounting', name: 'Louis', role: 'accountant' },
        { id: 'demo-product', name: 'Nora', role: 'developer' }
      ]
    };
  }

  function loadLocal() {
    try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); if (saved?.version === 2) return saved; } catch {}
    const state = defaultState(); localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); return state;
  }
  function saveLocal() { if (localState) localStorage.setItem(STORAGE_KEY, JSON.stringify(localState)); }
  function sum(items, key) { return (items || []).reduce((total, item) => total + Number(item[key] || 0), 0); }
  function localOverview(state) {
    const activeOpportunities = state.opportunities.filter((item) => !/gagné|perdu/i.test(item.stage));
    const activeSubscriptions = state.subscriptions.filter((item) => /actif/i.test(item.status));
    const unpaid = state.invoices.filter((item) => !/payée|annul/i.test(item.status));
    return {
      profile: { company: 'Avenor', product: 'MAVIK', assistant: 'Betty', mode: 'software-company' }, user: state.user,
      areas: ['direction', 'commercial', 'secretariat', 'accounting', 'product'].map((id) => ({ id })),
      metrics: {
        pipeline: sum(activeOpportunities, 'value'), weightedPipeline: Math.round(activeOpportunities.reduce((total, item) => total + item.value * item.probability / 100, 0)),
        mrr: sum(activeSubscriptions, 'monthlyAmount'), activeSubscriptions: activeSubscriptions.length,
        unpaidInvoices: sum(unpaid, 'amount'), monthlyExpenses: sum(state.expenses, 'amount'),
        openProjects: state.softwareProjects.filter((item) => !/termin|annul/i.test(item.status)).length,
        openTickets: state.supportTickets.filter((item) => !/résolu|fermé/i.test(item.status)).length,
        pendingTasks: state.tasks.filter((item) => !/termin|annul/i.test(item.status)).length
      },
      opportunities: state.opportunities, subscriptions: state.subscriptions, invoices: state.invoices, expenses: state.expenses,
      projects: state.softwareProjects, products: state.softwareProducts, contracts: state.contracts, tickets: state.supportTickets,
      meetings: state.meetings, tasks: state.tasks
    };
  }

  async function api(url, options = {}) {
    const response = await fetch(url, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, credentials: 'same-origin', ...options });
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('json') ? await response.json().catch(() => ({})) : {};
    if (!response.ok) throw new Error(data.error || `Erreur ${response.status}`);
    return data;
  }
  async function refreshServer() {
    overview = await api('/api/company/overview');
    const [settings, messageData, people, eventData] = await Promise.all([
      api('/api/calendar/settings').catch(() => ({ calendars: [] })),
      api(`/api/internal/messages?limit=150&channel=${encodeURIComponent(activeChannel)}`).catch(() => ({ records: [] })),
      api('/api/internal/directory').catch(() => ({ records: [] })),
      api('/api/local/externalCalendarEvents').catch(() => ({ records: [] }))
    ]);
    calendarSettings = settings; messages = messageData.records || []; directory = people.records || []; externalEvents = eventData.records || [];
  }
  async function initialize() {
    try {
      const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 2500);
      overview = await api('/api/company/overview', { signal: controller.signal }); clearTimeout(timer); apiMode = true; await refreshServer();
    } catch {
      apiMode = false; localState = loadLocal(); overview = localOverview(localState); calendarSettings = { calendars: localState.calendars, configured: localState.calendars.some((item) => item.configured), feedUrl: '' }; messages = localState.messages; directory = localState.directory;
    }
    $('dataMode').textContent = apiMode ? 'MAVIK installé · données sécurisées' : 'Démonstration locale';
    render(); updateBettyPriority();
  }

  function metric(label, value, detail, toneValue = 'rgba(103,65,236,.11)') { return `<article class="metric-card" style="--tone:${toneValue}"><small>${esc(label)}</small><strong>${esc(value)}</strong><span>${esc(detail)}</span></article>`; }
  function metricsHtml() {
    const m = overview.metrics || {};
    return `<section class="metric-grid">${metric('Pipeline commercial', money(m.pipeline), `${money(m.weightedPipeline)} pondéré`)}${metric('Revenu mensuel récurrent', money(m.mrr), `${m.activeSubscriptions || 0} abonnement(s) actif(s)`, 'rgba(19,155,105,.12)')}${metric('Factures à encaisser', money(m.unpaidInvoices), 'Suivi comptable', 'rgba(215,131,22,.13)')}${metric('Projets logiciels', m.openProjects || 0, `${m.openTickets || 0} ticket(s) support`, 'rgba(54,123,245,.12)')}</section>`;
  }
  function table(headers, rows, empty = 'Aucune donnée enregistrée.') {
    if (!rows.length) return `<div class="empty">${esc(empty)}</div>`;
    return `<table class="data-table"><thead><tr>${headers.map((item) => `<th>${esc(item)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
  }
  function nextMeetings(limit = 5) { return [...(overview.meetings || [])].filter((item) => !/annul/i.test(item.status || '')).sort((a, b) => String(a.start).localeCompare(String(b.start))).slice(0, limit); }
  function taskRows(items = overview.tasks || []) { return items.slice(0, 10).map((item) => `<div class="priority-item"><span class="symbol">${/haute|urgent/i.test(item.priority || '') ? '!' : '✓'}</span><div><strong>${esc(item.title)}</strong><div class="muted">${esc(item.assignee || 'Non attribuée')} · ${shortDate(item.dueDate)}</div></div>${pill(item.priority || item.status)}</div>`).join('') || '<div class="empty">Aucune tâche en attente.</div>'; }

  function renderDashboard() {
    const opportunities = (overview.opportunities || []).filter((item) => !/gagné|perdu/i.test(item.stage)).sort((a, b) => Number(b.value) - Number(a.value)).slice(0, 5);
    const meetings = nextMeetings();
    return `${metricsHtml()}<section class="layout-2"><div><article class="panel table-panel"><div class="panel-head"><div><h2>Opportunités à suivre</h2><div class="muted">Les prochaines actions commerciales les plus importantes.</div></div><button class="action-button" data-view="commercial">Voir le pipeline</button></div>${table(['Entreprise','Étape','Montant','Prochaine action'],opportunities.map((item)=>`<tr><td><strong>${esc(item.company)}</strong><span class="muted">${esc(item.contact)}</span></td><td>${pill(item.stage)}</td><td><strong>${money(item.value)}</strong><span class="muted">${item.probability || 0} %</span></td><td>${esc(item.nextAction || 'À définir')}<span class="muted">${shortDate(item.dueDate)}</span></td></tr>`))}</article><article class="panel"><div class="panel-head"><div><h2>Priorités de l’équipe</h2><div class="muted">Centralisées depuis tous les services.</div></div><button class="action-button" data-action="new-task">+ Tâche</button></div><div class="priority-list">${taskRows()}</div></article></div><div><article class="panel"><div class="panel-head"><div><h2>Prochains rendez-vous</h2><div class="muted">Agenda unifié Avenor.</div></div><button class="action-button" data-view="calendar">Ouvrir</button></div><div class="agenda-list">${meetings.map(eventCard).join('') || '<div class="empty">Aucun rendez-vous.</div>'}</div></article><article class="panel"><div class="panel-head"><div><h2>Betty recommande</h2><div class="muted">Synthèse automatique de la situation.</div></div></div><div class="priority-list"><div class="priority-item"><span class="symbol">€</span><div><strong>Relancer les factures arrivées à échéance</strong><div class="muted">Préserver la trésorerie avant les nouvelles dépenses.</div></div></div><div class="priority-item"><span class="symbol">↗</span><div><strong>Concentrer la vente sur les démonstrations avancées</strong><div class="muted">Le pipeline pondéré est de ${money(overview.metrics.weightedPipeline)}.</div></div></div></div></article></div></section>`;
  }

  const STAGES = ['Prospect', 'Qualification', 'Démonstration', 'Proposition'];
  function renderCommercial() {
    const columns = STAGES.map((stage) => { const items = (overview.opportunities || []).filter((item) => item.stage === stage); return `<section class="kanban-column"><header><span>${esc(stage)}</span><b>${items.length}</b></header>${items.map((item) => `<article class="kanban-card"><h3>${esc(item.company)}</h3><div class="muted">${esc(item.contact)} · ${esc(item.product)}</div><div class="value">${money(item.value)}</div><div class="muted">${esc(item.nextAction || 'Action à définir')} · ${shortDate(item.dueDate)}</div><div class="progress"><i style="width:${Number(item.probability || 0)}%"></i></div><div class="actions" style="margin-top:9px"><button class="action-button" data-action="advance-opportunity" data-id="${esc(item.id)}">Étape suivante</button></div></article>`).join('') || '<div class="empty">Vide</div>'}</section>`; }).join('');
    return `${metricsHtml()}<div class="toolbar"><div><h2>Pipeline de vente</h2><div class="muted">Du premier contact à la signature et à l’abonnement.</div></div><button class="primary" data-action="new-opportunity">+ Opportunité</button></div><div class="kanban">${columns}</div><article class="panel table-panel" style="margin-top:14px"><div class="panel-head"><div><h2>Abonnements clients</h2><div class="muted">Revenus SaaS récurrents et renouvellements.</div></div></div>${table(['Client','Offre','MRR','Renouvellement','Statut'],(overview.subscriptions||[]).map((item)=>`<tr><td><strong>${esc(item.customer)}</strong></td><td>${esc(item.plan)}</td><td>${money(item.monthlyAmount)}</td><td>${shortDate(item.renewalDate)}</td><td>${pill(item.status)}</td></tr>`))}</article>`;
  }

  function renderSecretariat() {
    return `<div class="toolbar"><div><h2>Coordination administrative</h2><div class="muted">Contrats, rendez-vous, documents et tâches transverses.</div></div><div class="actions"><button class="soft" data-action="new-task">+ Tâche</button><button class="primary" data-action="new-meeting">+ Rendez-vous</button></div></div><section class="layout-2"><article class="panel table-panel"><div class="panel-head"><div><h2>Contrats et documents</h2><div class="muted">Échéances et validations administratives.</div></div></div>${table(['Document','Client','Responsable','Échéance','Statut'],(overview.contracts||[]).map((item)=>`<tr><td><strong>${esc(item.title)}</strong><span class="muted">${esc(item.number||'')}</span></td><td>${esc(item.customer)}</td><td>${esc(item.owner)}</td><td>${shortDate(item.renewalDate)}</td><td>${pill(item.status)}</td></tr>`))}</article><div><article class="panel"><div class="panel-head"><div><h2>Agenda de coordination</h2><div class="muted">Réunions et rendez-vous clients.</div></div></div><div class="agenda-list">${nextMeetings(8).map(eventCard).join('')||'<div class="empty">Aucun rendez-vous.</div>'}</div></article><article class="panel"><div class="panel-head"><div><h2>Tâches administratives</h2></div></div><div class="priority-list">${taskRows((overview.tasks||[]).filter((item)=>/secr|admin|direction/i.test(`${item.department||''} ${item.assignee||''}`)))}</div></article></div></section>`;
  }

  function renderAccounting() {
    const invoices = overview.invoices || [];
    return `${metricsHtml()}<div class="toolbar"><div><h2>Facturation et trésorerie</h2><div class="muted">Encaissements, dépenses et revenus récurrents.</div></div><button class="primary" data-action="new-invoice">+ Facture</button></div><section class="layout-2"><article class="panel table-panel"><div class="panel-head"><div><h2>Factures clients</h2><div class="muted">Les changements restent soumis aux droits comptables.</div></div></div>${table(['N°','Client','Montant','Échéance','Statut',''],invoices.map((item)=>`<tr><td><strong>${esc(item.number||'Brouillon')}</strong></td><td>${esc(item.customer)}</td><td>${money(item.amount)}</td><td>${shortDate(item.dueDate)}</td><td>${pill(item.status)}</td><td>${!/payée/i.test(item.status||'')?`<button class="action-button" data-action="invoice-paid" data-id="${esc(item.id)}">Payée</button>`:''}</td></tr>`))}</article><div><article class="panel table-panel"><div class="panel-head"><div><h2>Dépenses</h2><div class="muted">Fournisseurs et abonnements de fonctionnement.</div></div></div>${table(['Fournisseur','Objet','Montant','Statut'],(overview.expenses||[]).map((item)=>`<tr><td>${esc(item.supplier)}</td><td>${esc(item.label)}</td><td>${money(item.amount)}</td><td>${pill(item.status)}</td></tr>`))}</article><article class="panel"><h2>Lecture rapide</h2><div class="priority-list" style="margin-top:12px"><div class="priority-item"><span class="symbol">↺</span><div><strong>${money(overview.metrics.mrr)} de MRR</strong><div class="muted">Revenu récurrent mensuel actif.</div></div></div><div class="priority-item"><span class="symbol">−</span><div><strong>${money(overview.metrics.monthlyExpenses)} de dépenses suivies</strong><div class="muted">À rapprocher des justificatifs.</div></div></div></div></article></div></section>`;
  }

  function renderProduct() {
    return `<div class="toolbar"><div><h2>Produits et développement</h2><div class="muted">Roadmap, versions, livraison et support client.</div></div><button class="primary" data-action="new-project">+ Projet</button></div><section class="layout-2"><div><article class="panel"><div class="panel-head"><div><h2>Projets en cours</h2><div class="muted">Avancement des créations logicielles.</div></div></div><div class="priority-list">${(overview.projects||[]).map((item)=>`<div class="priority-item"><span class="symbol">◇</span><div><strong>${esc(item.name)}</strong><div class="muted">${esc(item.product)} · ${esc(item.owner)} · cible ${shortDate(item.targetDate)}</div><div class="progress"><i style="width:${Number(item.progress||0)}%"></i></div></div><div><b>${Number(item.progress||0)} %</b><button class="action-button" data-action="project-plus" data-id="${esc(item.id)}" style="display:block;margin-top:5px">+10</button></div></div>`).join('')||'<div class="empty">Aucun projet.</div>'}</div></article><article class="panel table-panel"><div class="panel-head"><div><h2>Support client</h2><div class="muted">Incidents et demandes à traiter.</div></div></div>${table(['Ticket','Client','Produit','Priorité','Statut'],(overview.tickets||[]).map((item)=>`<tr><td><strong>${esc(item.title)}</strong><span class="muted">${esc(item.number||'')}</span></td><td>${esc(item.customer)}</td><td>${esc(item.product)}</td><td>${pill(item.priority)}</td><td>${pill(item.status)}</td></tr>`))}</article></div><article class="panel table-panel"><div class="panel-head"><div><h2>Catalogue logiciel</h2><div class="muted">Produits commercialisables par Avenor.</div></div></div>${table(['Produit','Version','Responsable','Prix mensuel','Statut'],(overview.products||[]).map((item)=>`<tr><td><strong>${esc(item.name)}</strong></td><td>${esc(item.version)}</td><td>${esc(item.owner)}</td><td>${money(item.monthlyPrice)}</td><td>${pill(item.status)}</td></tr>`))}</article></section>`;
  }

  function renderDirection() {
    const departments = [
      ['Commercial','Transformer les prospects en abonnements','Démonstrations','Propositions','Relances'],
      ['Secrétariat','Coordonner l’entreprise et ses documents','Contrats','Rendez-vous','Courriers'],
      ['Comptabilité','Sécuriser la trésorerie et les obligations','Facturation','Dépenses','Échéances'],
      ['Produit & développement','Créer, livrer et maintenir les logiciels','Roadmap','Versions','Support']
    ];
    return `${metricsHtml()}<section class="layout-2"><article class="panel"><div class="panel-head"><div><h2>Organisation Avenor</h2><div class="muted">Chaque équipe dispose de ses données et partage la même source de vérité.</div></div></div><div class="department-grid">${departments.map((item)=>`<article class="department-card"><header><div><h3>${item[0]}</h3><div class="muted">${item[1]}</div></div>${pill('Actif')}</header><ul>${item.slice(2).map((value)=>`<li>${value}</li>`).join('')}</ul></article>`).join('')}</div></article><div><article class="panel"><div class="panel-head"><div><h2>Décisions à prendre</h2><div class="muted">Points nécessitant la validation de la direction.</div></div></div><div class="priority-list">${taskRows((overview.tasks||[]).filter((item)=>/haute|direction/i.test(`${item.priority||''} ${item.assignee||''}`)))}</div></article><article class="panel"><h2>Indicateurs de pilotage</h2><div class="priority-list" style="margin-top:12px"><div class="priority-item"><span class="symbol">%</span><div><strong>${overview.metrics.pipeline?Math.round(overview.metrics.weightedPipeline/overview.metrics.pipeline*100):0} % de confiance pipeline</strong><div class="muted">Rapport entre pipeline brut et pondéré.</div></div></div><div class="priority-item"><span class="symbol">€</span><div><strong>${money((overview.metrics.mrr||0)*12)} d’ARR actuel</strong><div class="muted">Projection annuelle des abonnements actifs.</div></div></div></div></article></div></section>`;
  }

  function eventCard(item) {
    const color = ({ commercial:'#367bf5',secretariat:'#8a5be8',accounting:'#139b69',product:'#db7c24',direction:'#d64f55' })[item.department] || '#6741ec';
    return `<div class="agenda-event"><time>${shortDate(item.start)}<br>${shortTime(item.start)}</time><i style="--event:${color}"></i><div><strong>${esc(item.title)}</strong><div class="muted">${esc(item.location||item.calendarName||'')} ${item.attendees?.length?`· ${esc(item.attendees.join(', '))}`:''}</div></div>${pill(item.status||'Confirmé')}</div>`;
  }
  function renderCalendar() {
    const calendars = calendarSettings.calendars || [];
    const events = [...(overview.meetings||[]), ...externalEvents.map((item)=>({ ...item, start:item.start||item.startDate, end:item.end||item.endDate, department:item.calendarId, status:item.status }))].sort((a,b)=>String(a.start).localeCompare(String(b.start)));
    return `<div class="toolbar"><div><h2>Connexions calendrier</h2><div class="muted">Google Agenda, Outlook et tout lien iCal privé peuvent être réunis en lecture dans MAVIK.</div></div><div class="actions"><button class="soft" data-action="sync-calendar">Synchroniser</button><button class="primary" data-action="connect-calendar">+ Connecter un agenda</button></div></div><section class="calendar-grid">${calendars.map((item)=>`<article class="calendar-card"><span class="provider-icon">${item.provider==='google'?'G':item.provider==='outlook'?'O':'iC'}</span><div><strong>${esc(item.name)}</strong><small>${esc(item.account||item.iCalUrlMasked||'Compte non autorisé')}</small></div>${pill(item.configured?'Connecté':'Autorisation requise')}</article>`).join('')||'<article class="panel empty">Aucun agenda connecté.</article>'}</section><article class="panel" style="margin-top:14px"><div class="panel-head"><div><h2>Prochains événements</h2><div class="muted">Réunions MAVIK et événements importés.</div></div><button class="action-button" data-action="new-meeting">+ Rendez-vous</button></div><div class="agenda-list">${events.slice(0,20).map(eventCard).join('')||'<div class="empty">Aucun événement.</div>'}</div>${calendarSettings.feedUrl?`<div class="actions" style="margin-top:14px"><button class="action-button" data-action="copy-feed" data-feed="${esc(calendarSettings.feedUrl)}">Copier le lien MAVIK vers mon agenda</button></div>`:''}</article><article class="panel"><strong>Connexion réelle</strong><p class="muted">Pour un agenda privé, copiez son adresse iCal privée dans « Connecter un agenda ». Le lien est conservé dans l’installation MAVIK et n’est jamais affiché en clair. L’écriture directe dans Google ou Outlook demandera ensuite une autorisation OAuth distincte.</p></article>`;
  }

  function renderMessages() {
    const currentUserId = overview.user?.id || localState?.user?.id;
    const visible = messages.filter((item)=>!item.channel||item.channel===activeChannel);
    const allowedChannels = CHANNELS.filter(([id])=>id!=='direction'||['admin','associate'].includes(overview.user?.role));
    return `<section class="panel"><div class="panel-head"><div><h2>Discussion interne</h2><div class="muted">Messages réservés aux utilisateurs de l’entreprise.</div></div><button class="primary" data-action="new-message">Nouveau message</button></div><div class="message-layout"><nav class="channel-list">${allowedChannels.map(([id,label])=>`<button class="${id===activeChannel?'active':''}" data-channel="${id}"># ${esc(label)}</button>`).join('')}</nav><div><div class="messages">${visible.map((item)=>`<article class="message ${item.fromUserId===currentUserId?'mine':''}"><header><strong>${esc(item.fromName||'Équipe MAVIK')}</strong><time>${new Date(item.createdAt).toLocaleString('fr-FR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</time></header><p>${esc(item.body)}</p></article>`).join('')||'<div class="empty">Aucun message dans ce canal.</div>'}</div><form class="message-compose" id="inlineMessageForm"><textarea name="body" required placeholder="Écrire dans #${esc(CHANNELS.find(([id])=>id===activeChannel)?.[1]||activeChannel)}"></textarea><button class="primary">Envoyer</button></form></div></div></section>`;
  }

  function render() {
    const [eyebrow, title] = VIEW_META[currentView] || VIEW_META.dashboard; $('viewEyebrow').textContent = eyebrow; $('viewTitle').textContent = title;
    const allowedAreas = new Set((overview.areas||[]).map((area)=>area.id));
    document.querySelectorAll('#companyNav [data-view]').forEach((button) => { button.classList.toggle('active', button.dataset.view === currentView); if(['commercial','secretariat','accounting','product','direction'].includes(button.dataset.view))button.hidden=!allowedAreas.has(button.dataset.view); });
    const opportunityButton=document.querySelector('.top-actions [data-action="new-opportunity"]');if(opportunityButton)opportunityButton.hidden=!allowedAreas.has('commercial');
    const renderers = { dashboard:renderDashboard, commercial:renderCommercial, secretariat:renderSecretariat, accounting:renderAccounting, product:renderProduct, direction:renderDirection, calendar:renderCalendar, messages:renderMessages };
    $('workspace').innerHTML = (renderers[currentView] || renderDashboard)(); $('workspace').focus({ preventScroll:true }); updateUnread();
  }
  function updateUnread() {
    const userId = overview.user?.id || localState?.user?.id;
    const count = messages.filter((item)=>item.fromUserId!==userId && !(item.readBy||[]).includes(userId)).length;
    $('unreadBadge').textContent = count || ''; $('unreadBadge').classList.toggle('show', count > 0);
  }
  function updateBettyPriority() {
    const overdue = (overview.invoices||[]).filter((item)=>item.dueDate && item.dueDate < day() && !/payée|annul/i.test(item.status||''));
    const priority = overdue.length ? `${overdue.length} facture(s) en retard à relancer` : (overview.tasks||[]).find((item)=>/haute|urgent/i.test(item.priority||''))?.title || 'Aucune urgence détectée';
    $('bettyPriority').textContent = priority;
  }
  async function navigate(view) {
    currentView = view; document.querySelector('.company-sidebar').classList.remove('open');
    if (apiMode && view === 'messages') { const data = await api(`/api/internal/messages?limit=150&channel=${encodeURIComponent(activeChannel)}`).catch(()=>({records:[]})); messages = data.records||[]; }
    render();
  }

  const FORMS = {
    opportunity: { title:'Nouvelle opportunité', eyebrow:'Commercial', fields:`<div><label>Entreprise</label><input name="company" required></div><div><label>Contact</label><input name="contact" required></div><div><label>Produit</label><select name="product"><option>MAVIK</option><option>MAVIK Core</option><option>MAVIK Studio</option></select></div><div><label>Montant estimé</label><input name="value" type="number" min="0" required></div><div><label>Étape</label><select name="stage">${STAGES.map(x=>`<option>${x}</option>`).join('')}</select></div><div><label>Probabilité (%)</label><input name="probability" type="number" min="0" max="100" value="20"></div><div class="full"><label>Prochaine action</label><input name="nextAction" required></div><div><label>Échéance</label><input name="dueDate" type="date" value="${day(3)}"></div><div><label>Responsable</label><input name="owner" value="Équipe commerciale"></div>` },
    meeting: { title:'Nouveau rendez-vous', eyebrow:'Agenda', fields:`<div class="full"><label>Objet</label><input name="title" required></div><div><label>Début</label><input name="start" type="datetime-local" required></div><div><label>Fin</label><input name="end" type="datetime-local" required></div><div><label>Service</label><select name="department"><option value="commercial">Commercial</option><option value="secretariat">Secrétariat</option><option value="accounting">Comptabilité</option><option value="product">Produit</option><option value="direction">Direction</option></select></div><div><label>Lieu</label><input name="location"></div><div class="full"><label>Participants (séparés par des virgules)</label><input name="attendees"></div>` },
    invoice: { title:'Nouvelle facture', eyebrow:'Comptabilité', fields:`<div class="full"><label>Client</label><input name="customer" required></div><div><label>Montant</label><input name="amount" type="number" min="0" required></div><div><label>Statut</label><select name="status"><option>Brouillon</option><option>Envoyée</option><option>À relancer</option></select></div><div><label>Date d’émission</label><input name="issueDate" type="date" value="${day()}"></div><div><label>Échéance</label><input name="dueDate" type="date" value="${day(30)}"></div>` },
    project: { title:'Nouveau projet logiciel', eyebrow:'Produit & développement', fields:`<div class="full"><label>Nom du projet</label><input name="name" required></div><div><label>Produit</label><input name="product" value="MAVIK Core"></div><div><label>Responsable</label><input name="owner" required></div><div><label>Statut</label><select name="status"><option>À planifier</option><option>Conception</option><option>En cours</option></select></div><div><label>Avancement (%)</label><input name="progress" type="number" min="0" max="100" value="0"></div><div><label>Date cible</label><input name="targetDate" type="date" value="${day(30)}"></div><div><label>Priorité</label><select name="priority"><option>Normale</option><option>Haute</option><option>Urgente</option></select></div>` },
    task: { title:'Nouvelle tâche', eyebrow:'Organisation', fields:`<div class="full"><label>Tâche</label><input name="title" required></div><div><label>Responsable</label><input name="assignee" required></div><div><label>Service</label><select name="department"><option value="direction">Direction</option><option value="commercial">Commercial</option><option value="secretariat">Secrétariat</option><option value="accounting">Comptabilité</option><option value="product">Produit</option></select></div><div><label>Priorité</label><select name="priority"><option>Normale</option><option>Haute</option><option>Urgente</option></select></div><div><label>Échéance</label><input name="dueDate" type="date" value="${day(2)}"></div>` },
    calendar: { title:'Connecter un agenda', eyebrow:'Agenda unifié', fields:`<div><label>Fournisseur</label><select name="provider"><option value="google">Google Agenda</option><option value="outlook">Outlook</option><option value="ical">Autre iCal</option></select></div><div><label>Nom affiché</label><input name="name" required placeholder="Direction"></div><div class="full"><label>Compte ou propriétaire</label><input name="account" placeholder="nom@entreprise.fr"></div><div class="full"><label>Adresse iCal privée</label><input name="iCalUrl" type="password" placeholder="https://…/basic.ics"><small class="muted">Lecture seule. Cette adresse reste dans l’installation MAVIK.</small></div><div><label>Couleur</label><input name="color" type="color" value="#4285f4"></div><div><label><input name="blocksOperations" type="checkbox"> Bloquer les créneaux occupés</label></div>` },
    message: { title:'Nouveau message interne', eyebrow:'Équipe', fields:`<div><label>Canal</label><select name="channel">${CHANNELS.map(([id,label])=>`<option value="${id}" ${id===activeChannel?'selected':''}>${label}</option>`).join('')}</select></div><div><label>Priorité</label><select name="priority"><option value="normal">Normale</option><option value="urgent">Urgente</option></select></div><div class="full"><label>Objet</label><input name="subject" maxlength="120"></div><div class="full"><label>Message</label><textarea name="body" required></textarea></div>` }
  };
  function openForm(type) { const config = FORMS[type]; if (!config) return; $('dialogEyebrow').textContent=config.eyebrow; $('dialogTitle').textContent=config.title; $('dialogFields').innerHTML=config.fields; if(type==='message'&&!['admin','associate'].includes(overview.user?.role))$('dialogFields').querySelector('option[value="direction"]')?.remove(); $('dialogStatus').textContent=''; $('companyForm').dataset.type=type; $('companyDialog').showModal(); }
  function formObject(form) { const data = Object.fromEntries(new FormData(form)); form.querySelectorAll('input[type="checkbox"]').forEach((input)=>data[input.name]=input.checked); return data; }
  async function createRecord(collection, payload) {
    if (apiMode) { await api(`/api/local/${collection}`, { method:'POST', body:JSON.stringify(payload) }); await refreshServer(); }
    else { const key = collection === 'softwareProjects' ? 'softwareProjects' : collection; localState[key].unshift({ id:uuid(), ...payload, createdAt:new Date().toISOString() }); saveLocal(); overview=localOverview(localState); }
  }
  async function updateRecord(collection, id, payload) {
    if (apiMode) { await api(`/api/local/${collection}/${encodeURIComponent(id)}`, { method:'PATCH', body:JSON.stringify(payload) }); await refreshServer(); }
    else { const items=localState[collection]; const index=items.findIndex((item)=>item.id===id); if(index>=0)items[index]={...items[index],...payload,updatedAt:new Date().toISOString()}; saveLocal(); overview=localOverview(localState); }
  }
  async function saveForm(type, payload) {
    if (type==='opportunity') return createRecord('opportunities',{...payload,value:Number(payload.value),probability:Number(payload.probability)});
    if (type==='meeting') return createRecord('meetings',{...payload,attendees:String(payload.attendees||'').split(',').map(x=>x.trim()).filter(Boolean),status:'Confirmé'});
    if (type==='invoice') return createRecord('invoices',{...payload,amount:Number(payload.amount)});
    if (type==='project') return createRecord('softwareProjects',{...payload,progress:Number(payload.progress)});
    if (type==='task') return createRecord('tasks',{...payload,status:'À faire'});
    if (type==='message') return sendMessage(payload.body,payload.channel,payload);
    if (type==='calendar') {
      const calendar={id:`${payload.provider}-${uuid().slice(0,8)}`,...payload,configured:Boolean(payload.iCalUrl),enabled:true};
      if(apiMode){await api('/api/calendar/settings',{method:'PATCH',body:JSON.stringify({calendar})});calendarSettings=await api('/api/calendar/settings');}
      else{if(payload.iCalUrl)throw new Error('Pour protéger ce lien privé, connectez cet agenda dans une installation MAVIK sécurisée.');delete calendar.iCalUrl;calendar.configured=false;localState.calendars.push(calendar);saveLocal();calendarSettings={...calendarSettings,calendars:localState.calendars,configured:localState.calendars.some(item=>item.configured)};}
    }
  }
  async function sendMessage(body, channel=activeChannel, extra={}) {
    if (!String(body||'').trim()) throw new Error('Écrivez un message.');
    if(apiMode){const self=overview.user?.id;const recipients=directory.filter((person)=>person.id!==self&&(channel!=='direction'||['admin','associate'].includes(person.role))).map((person)=>person.id);if(!recipients.length)throw new Error('Ajoutez au moins un autre utilisateur MAVIK autorisé.');await api('/api/internal/messages',{method:'POST',body:JSON.stringify({toUserIds:recipients,channel,subject:extra.subject||'',priority:extra.priority||'normal',body})});const data=await api(`/api/internal/messages?limit=150&channel=${encodeURIComponent(channel)}`);messages=data.records||[];}
    else{const message={id:uuid(),channel,fromUserId:localState.user.id,fromName:localState.user.name,body:String(body).trim(),subject:extra.subject||'',priority:extra.priority||'normal',createdAt:new Date().toISOString(),readBy:[localState.user.id],toUserIds:localState.directory.filter(p=>!p.isSelf).map(p=>p.id)};localState.messages.unshift(message);saveLocal();messages=localState.messages;}
    activeChannel=channel;
  }
  function toast(text){const element=$('toast');element.textContent=text;element.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>element.classList.remove('show'),3200)}

  $('companyForm').addEventListener('submit', async (event) => {
    if(event.submitter?.value==='cancel')return;event.preventDefault();const type=event.currentTarget.dataset.type;const payload=formObject(event.currentTarget);$('dialogStatus').textContent='Enregistrement…';
    try{await saveForm(type,payload);$('companyDialog').close();toast('Enregistré dans MAVIK.');if(type==='message')currentView='messages';render();updateBettyPriority();}catch(error){$('dialogStatus').textContent=error.message;}
  });
  $('workspace').addEventListener('submit', async (event) => {
    if(event.target.id!=='inlineMessageForm')return;event.preventDefault();const body=new FormData(event.target).get('body');try{await sendMessage(body,activeChannel);render();}catch(error){toast(error.message);}
  });
  document.addEventListener('click', async (event) => {
    const viewButton=event.target.closest('[data-view]');if(viewButton){navigate(viewButton.dataset.view);return;}
    const channelButton=event.target.closest('[data-channel]');if(channelButton){activeChannel=channelButton.dataset.channel;if(apiMode){const data=await api(`/api/internal/messages?limit=150&channel=${encodeURIComponent(activeChannel)}`).catch(()=>({records:[]}));messages=data.records||[];}render();return;}
    const button=event.target.closest('[data-action]');if(!button)return;const action=button.dataset.action;
    if(action==='new-opportunity')return openForm('opportunity');if(action==='new-meeting')return openForm('meeting');if(action==='new-invoice')return openForm('invoice');if(action==='new-project')return openForm('project');if(action==='new-task')return openForm('task');if(action==='connect-calendar')return openForm('calendar');if(action==='new-message')return openForm('message');
    try{
      if(action==='advance-opportunity'){const item=(overview.opportunities||[]).find(x=>x.id===button.dataset.id);const index=STAGES.indexOf(item.stage);await updateRecord('opportunities',item.id,{stage:index<STAGES.length-1?STAGES[index+1]:'Gagné',probability:index<STAGES.length-1?Math.min(95,Number(item.probability||0)+20):100});toast('Opportunité mise à jour.');}
      if(action==='invoice-paid'){await updateRecord('invoices',button.dataset.id,{status:'Payée',paidAt:new Date().toISOString()});toast('Facture marquée payée.');}
      if(action==='project-plus'){const item=(overview.projects||[]).find(x=>x.id===button.dataset.id);await updateRecord('softwareProjects',item.id,{progress:Math.min(100,Number(item.progress||0)+10),status:Number(item.progress||0)+10>=100?'Terminée':item.status});toast('Avancement mis à jour.');}
      if(action==='sync-calendar'){if(!apiMode)throw new Error('La synchronisation réelle nécessite MAVIK installé.');const result=await api('/api/calendar/sync',{method:'POST',body:'{}'});await refreshServer();toast(`${result.imported||0} événement(s) importé(s).`);}
      if(action==='copy-feed'){await navigator.clipboard.writeText(button.dataset.feed);toast('Lien MAVIK copié.');}
      render();updateBettyPriority();
    }catch(error){toast(error.message);}
  });

  function askBetty(command) {
    const text=String(command||'').trim();const normalized=text.toLowerCase();if(!text)return;
    let answer='Je peux ouvrir un service, créer une opportunité, préparer un rendez-vous ou résumer les priorités.';
    if(/commercial|vente|prospect|pipeline/.test(normalized)){navigate('commercial');answer=`Le pipeline actif représente ${money(overview.metrics.pipeline)}, dont ${money(overview.metrics.weightedPipeline)} pondérés.`;}
    else if(/agenda|calendrier|rendez/.test(normalized)){navigate('calendar');answer=`J’ai regroupé ${nextMeetings(30).length} rendez-vous MAVIK. Les agendas privés attendent votre autorisation iCal.`;}
    else if(/facture|impay|compta|trésor/.test(normalized)){navigate('accounting');answer=`Il reste ${money(overview.metrics.unpaidInvoices)} à encaisser. Je vous montre les échéances.`;}
    else if(/message|équipe|interne/.test(normalized)){navigate('messages');answer='J’ouvre la discussion interne. Choisissez le canal concerné.';}
    else if(/projet|produit|dévelop/.test(normalized)){navigate('product');answer=`${overview.metrics.openProjects} projet(s) logiciel(s) sont ouverts et ${overview.metrics.openTickets} ticket(s) support restent à traiter.`;}
    else if(/direction|indicateur|performance/.test(normalized)){navigate('direction');answer=`Le MRR actuel est de ${money(overview.metrics.mrr)} et le pipeline pondéré de ${money(overview.metrics.weightedPipeline)}.`;}
    else if(/quoi|priorit|aujourd/.test(normalized)){const task=(overview.tasks||[]).find(item=>/haute|urgent/i.test(item.priority||''));answer=task?`La priorité est : ${task.title}. Elle est attribuée à ${task.assignee||'l’équipe'}.`:'Aucune urgence n’est enregistrée. Vous pouvez avancer sur le pipeline commercial.';}
    $('bettyAnswer').textContent=answer;
  }
  $('bettyForm').addEventListener('submit',(event)=>{event.preventDefault();const input=$('bettyInput');askBetty(input.value);input.value='';});
  document.querySelectorAll('[data-betty]').forEach((button)=>button.addEventListener('click',()=>askBetty(button.dataset.betty)));
  $('mobileMenu').addEventListener('click',()=>document.querySelector('.company-sidebar').classList.toggle('open'));
  $('bettyToggle').addEventListener('click',()=>{const panel=document.querySelector('.betty-panel');const collapsed=panel.classList.toggle('collapsed');$('bettyToggle').textContent=collapsed?'+':'−';$('bettyToggle').setAttribute('aria-expanded',String(!collapsed));});
  function setMascotMotion(paused){$('bettyMascotStage').classList.toggle('paused',paused);$('bettyMotion').setAttribute('aria-pressed',String(paused));$('bettyMotion').textContent=paused?'Reprendre':'Pause animation';localStorage.setItem('mavik-betty-motion',paused?'paused':'active');}
  $('bettyMotion').addEventListener('click',()=>setMascotMotion(!$('bettyMascotStage').classList.contains('paused')));
  setMascotMotion(matchMedia('(prefers-reduced-motion: reduce)').matches||localStorage.getItem('mavik-betty-motion')==='paused');
  if(matchMedia('(max-width: 1280px)').matches){document.querySelector('.betty-panel').classList.add('collapsed');$('bettyToggle').textContent='+';$('bettyToggle').setAttribute('aria-expanded','false');}

  initialize();
})();
