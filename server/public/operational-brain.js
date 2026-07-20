(() => {
  'use strict';

  const STORAGE_KEY = 'mavik-betty-company-demo-v2';
  const HIGH_IMPACT_PATTERNS = /payer|paiement|signer|signature|contrat|supprimer|licencier|embaucher|engagement|juridique|modifier les droits|créer un utilisateur/i;

  const readState = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
    catch { return null; }
  };

  const today = () => new Date().toISOString().slice(0, 10);
  const daysUntil = (value) => value ? Math.ceil((new Date(`${value}T12:00:00`) - new Date(`${today()}T12:00:00`)) / 86400000) : 999;
  const euro = (value) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number(value || 0));
  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[character]);

  function scoreItem(item) {
    const dueIn = daysUntil(item.dueDate || item.renewalDate);
    const urgent = /urgent|haute|retard|impay|bloqu/i.test(`${item.priority || ''} ${item.status || ''}`);
    const financial = Number(item.amount || item.value || 0);
    let score = urgent ? 35 : 10;
    if (dueIn < 0) score += 35;
    else if (dueIn === 0) score += 30;
    else if (dueIn <= 2) score += 20;
    else if (dueIn <= 7) score += 8;
    score += Math.min(25, Math.round(financial / 500));
    return Math.min(100, score);
  }

  function buildPriorities(state) {
    const items = [];
    (state?.invoices || []).filter((item) => !/payée|annul/i.test(item.status || '')).forEach((item) => items.push({
      type: 'Facture', title: `${item.number || 'Facture'} · ${item.customer}`, reason: item.dueDate < today() ? `Échéance dépassée · ${euro(item.amount)}` : `À encaisser · ${euro(item.amount)}`, dueDate: item.dueDate, score: scoreItem(item), action: 'Préparer la relance', impact: 'Trésorerie'
    }));
    (state?.opportunities || []).filter((item) => !/gagné|perdu/i.test(item.stage || '')).forEach((item) => items.push({
      type: 'Commercial', title: `${item.company} · ${item.nextAction || 'Prochaine action'}`, reason: `${item.stage} · potentiel ${euro(item.value)} · probabilité ${item.probability || 0} %`, dueDate: item.dueDate, score: scoreItem(item), action: 'Préparer le dossier commercial', impact: 'Chiffre d’affaires'
    }));
    (state?.tasks || []).filter((item) => !/termin|annul/i.test(item.status || '')).forEach((item) => items.push({
      type: 'Tâche', title: item.title, reason: `${item.assignee || 'Non attribuée'} · priorité ${item.priority || 'normale'}`, dueDate: item.dueDate, score: scoreItem(item), action: 'Organiser et préparer', impact: item.department || 'Opérations'
    }));
    (state?.contracts || []).filter((item) => /à envoyer|à signer|attente|renouvel/i.test(`${item.status || ''} ${item.title || ''}`)).forEach((item) => items.push({
      type: 'Contrat', title: `${item.title} · ${item.customer}`, reason: `Statut ${item.status || 'à traiter'}`, dueDate: item.renewalDate, score: scoreItem(item) + 10, action: 'Préparer pour validation', impact: 'Juridique'
    }));
    return items.sort((a, b) => b.score - a.score).slice(0, 6);
  }

  function validationPolicy(action) {
    return HIGH_IMPACT_PATTERNS.test(action) ? { required: true, label: 'Validation humaine obligatoire' } : { required: false, label: 'Betty peut préparer automatiquement' };
  }

  function briefHtml(priorities, state) {
    const firstName = state?.user?.name?.split(' ')[0] || 'Bénédicte';
    const overdue = (state?.invoices || []).filter((item) => item.dueDate && item.dueDate < today() && !/payée|annul/i.test(item.status || '')).length;
    const meetings = (state?.meetings || []).filter((item) => String(item.start || '').slice(0, 10) === today()).length;
    const opportunities = (state?.opportunities || []).filter((item) => !/gagné|perdu/i.test(item.stage || '')).length;
    return `<section class="operational-brief" aria-labelledby="operationalBriefTitle">
      <div class="operational-brief-head"><div><span class="operational-kicker">Cerveau opérationnel Betty</span><h2 id="operationalBriefTitle">Bonjour ${escapeHtml(firstName)}. Voici l’ordre recommandé.</h2><p>Betty analyse les données déjà présentes dans MAVIK, prépare les actions sans risque et réserve les décisions importantes à votre validation.</p></div><span class="brain-status">Analyse active</span></div>
      <div class="operational-summary"><span><b>${priorities.length}</b> priorités détectées</span><span><b>${overdue}</b> facture(s) en retard</span><span><b>${opportunities}</b> opportunité(s) active(s)</span><span><b>${meetings}</b> rendez-vous aujourd’hui</span></div>
      <div class="operational-priorities">${priorities.slice(0, 3).map((item, index) => { const policy = validationPolicy(item.action + ' ' + item.type); return `<article><span class="priority-rank">${index + 1}</span><div><small>${escapeHtml(item.type)} · score ${item.score}/100</small><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.reason)}</p><em>${escapeHtml(item.action)} · ${escapeHtml(policy.label)}</em></div></article>`; }).join('') || '<p class="operational-empty">Aucune urgence détectée. Betty continue de surveiller les données disponibles.</p>'}</div>
      <div class="operational-actions"><button type="button" id="refreshOperationalBrief">Recalculer les priorités</button><button type="button" class="secondary" id="explainOperationalPolicy">Voir la règle de validation</button></div>
    </section>`;
  }

  function install() {
    const workspace = document.getElementById('workspace');
    if (!workspace || document.querySelector('.operational-brief')) return;
    const state = readState();
    if (!state) return;
    const priorities = buildPriorities(state);
    workspace.insertAdjacentHTML('afterbegin', briefHtml(priorities, state));

    const top = priorities[0];
    const priorityNode = document.getElementById('bettyPriority');
    if (priorityNode && top) priorityNode.textContent = top.title;

    document.getElementById('refreshOperationalBrief')?.addEventListener('click', () => {
      document.querySelector('.operational-brief')?.remove();
      install();
    });
    document.getElementById('explainOperationalPolicy')?.addEventListener('click', () => {
      const answer = document.getElementById('bettyAnswer');
      if (answer) answer.textContent = 'Je peux consulter, analyser, organiser, préparer et recommander. Je demande votre validation seulement lorsqu’une décision importante engage l’entreprise ou ses utilisateurs.';
    });
  }

  const observer = new MutationObserver(() => {
    const title = document.getElementById('viewTitle')?.textContent || '';
    if (/Vue d’ensemble/i.test(title)) install();
  });

  window.MavikOperationalBrain = { buildPriorities, validationPolicy, refresh: install };
  window.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.getElementById('workspace'), { childList: true });
    setTimeout(install, 350);
  });
})();
