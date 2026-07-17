(() => {
  'use strict';
  if (window.JarvisCore) return;

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition;
  let dialog;
  let statusEl;
  let logEl;
  let held = false;
  let transcript = '';
  let answering = false;
  let lastQuestion = '';

  const user = () => {
    try {
      const session = JSON.parse(sessionStorage.getItem('jarvis-session') || 'null');
      const accounts = JSON.parse(localStorage.getItem('jarvis-accounts') || '[]');
      return accounts.find(account => account.id === session?.id) || { name: 'Utilisateur', id: 'inconnu' };
    } catch {
      return { name: 'Utilisateur', id: 'inconnu' };
    }
  };

  const preferences = () => {
    try {
      return JSON.parse(localStorage.getItem(`gcos-profile-${user().id}`) || '{}');
    } catch {
      return {};
    }
  };

  const service = name => window.GCOS?.getService?.(name);
  const airtable = () => service('airtable');
  const api = () => service('api');

  function injectStyles() {
    if (document.getElementById('jarvisCoreCss')) return;
    const style = document.createElement('style');
    style.id = 'jarvisCoreCss';
    style.textContent = `#jarvisPanel{position:fixed;inset:0;z-index:42000;background:#02090ddd;backdrop-filter:blur(15px);display:none;place-items:center;padding:18px;user-select:none}#jarvisPanel.open{display:grid}.jarvis-shell{width:min(780px,100%);max-height:92vh;overflow:hidden;border:1px solid #8fe6ff66;border-radius:28px;background:linear-gradient(145deg,#0b2631,#061116);color:#fff;box-shadow:0 30px 100px #000d}.jarvis-head{display:flex;align-items:center;gap:16px;padding:20px;border-bottom:1px solid #8fe6ff28}.jarvis-orb{width:72px;height:72px;border-radius:50%;display:grid;place-items:center;font-weight:1000;font-size:1.7rem;background:radial-gradient(circle,#fff 0 9%,#8fe6ff 11% 23%,#168aae 26% 49%,#07131a 53%);box-shadow:0 0 25px #8fe6ff,0 0 70px #159bd666}.jarvis-orb.listening{background:radial-gradient(circle,#fff 0 9%,#ffdf63 11% 23%,#e77b17 26% 49%,#251006 53%);transform:scale(1.12)}.jarvis-orb.thinking{background:radial-gradient(circle,#fff 0 9%,#d8a2ff 11% 23%,#7535a7 26% 49%,#15071e 53%);animation:jt 1s linear infinite}.jarvis-orb.speaking{background:radial-gradient(circle,#fff 0 9%,#a8ffbd 11% 23%,#2b9c54 26% 49%,#07190e 53%)}.jarvis-title{flex:1}.jarvis-title b{letter-spacing:.2em}.jarvis-state{margin-top:5px;color:#b7efff;font-weight:900}.jarvis-log{padding:18px;max-height:52vh;overflow:auto;user-select:text}.jarvis-msg{padding:12px 14px;border-radius:14px;margin:8px 0;line-height:1.45}.jarvis-msg.you{background:#173744;margin-left:12%}.jarvis-msg.ai{background:#10251c;margin-right:12%}.jarvis-actions{display:grid;grid-template-columns:1fr auto auto;gap:14px;align-items:center;padding:16px;border-top:1px solid #8fe6ff28}.ptt-wrap{display:flex;justify-content:center}.ptt{width:120px;height:120px;border:2px solid #8fe6ff88;border-radius:50%;background:radial-gradient(circle at 35% 30%,#dfffff,#4ad8ff 23%,#0b7fa6 47%,#051923 72%);font-size:2.7rem;touch-action:none;user-select:none}.ptt.held{background:radial-gradient(circle at 35% 30%,#fff3c4,#ffb137 25%,#d45a0b 52%,#321104 74%);transform:scale(.96)}.smallbtn{border:1px solid #4d7782;border-radius:14px;padding:13px;background:#173844;color:#fff;font-weight:900}.stop{background:#5a2020}@keyframes jt{to{transform:rotate(360deg)}}@media(max-width:650px){.jarvis-actions{grid-template-columns:1fr 1fr}.ptt-wrap{grid-column:1/3}}`;
    document.head.appendChild(style);
  }

  function build() {
    if (dialog) return;
    injectStyles();
    dialog = document.createElement('div');
    dialog.id = 'jarvisPanel';
    dialog.innerHTML = `<div class="jarvis-shell"><div class="jarvis-head"><div class="jarvis-orb" id="jarvisOrb">J</div><div class="jarvis-title"><b>JARVIS — GentleCarE</b><div class="jarvis-state" id="jarvisState">Veille</div></div><button id="jarvisClose" class="smallbtn">×</button></div><div class="jarvis-log" id="jarvisLog"><div class="jarvis-msg ai">Bonjour ${user().name}. Je passe désormais par le serveur sécurisé GCOS pour consulter GentleCarE.</div></div><div class="jarvis-actions"><div class="ptt-wrap"><button class="ptt" id="jarvisPTT" aria-label="Parler à Jarvis">🎙</button></div><button class="smallbtn" id="jarvisServer">Serveur</button><button class="smallbtn stop" id="jarvisStop">Fermer</button></div></div>`;
    document.body.appendChild(dialog);
    statusEl = dialog.querySelector('#jarvisState');
    logEl = dialog.querySelector('#jarvisLog');
    const ptt = dialog.querySelector('#jarvisPTT');
    ptt.oncontextmenu = event => event.preventDefault();
    ptt.onpointerdown = event => {
      event.preventDefault();
      try { ptt.setPointerCapture(event.pointerId); } catch {}
      beginHold(ptt);
    };
    ptt.onpointerup = event => {
      event.preventDefault();
      if (held) endHold(ptt);
    };
    ptt.onpointercancel = () => held && endHold(ptt);
    dialog.querySelector('#jarvisServer').onclick = configureServer;
    dialog.querySelector('#jarvisClose').onclick = close;
    dialog.querySelector('#jarvisStop').onclick = close;
  }

  function state(value) {
    build();
    statusEl.textContent = value;
    dialog.querySelector('#jarvisOrb').className = `jarvis-orb ${value === 'Écoute' ? 'listening' : value === 'Réflexion' ? 'thinking' : value === 'Réponse' ? 'speaking' : ''}`;
  }

  function add(who, text) {
    build();
    const message = document.createElement('div');
    message.className = `jarvis-msg ${who}`;
    message.textContent = text;
    logEl.appendChild(message);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function say(text) {
    answering = true;
    state('Réponse');
    add('ai', text);
    logConversation(text);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = Number(preferences().rate || 1);
    utterance.pitch = Number(preferences().pitch || 1);
    utterance.onend = () => {
      answering = false;
      state('Veille');
    };
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  }

  function normalize(value) {
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  async function serverHealth() {
    if (!api()) return { online: false, error: 'GCOS_API_UNAVAILABLE' };
    return api().health();
  }

  async function configureServer() {
    const current = api()?.baseUrl?.() || 'http://127.0.0.1:4782';
    const value = prompt('Adresse du serveur GCOS de l’atelier :', current);
    if (!value) return;
    try {
      api().setBaseUrl(value);
      const health = await serverHealth();
      say(health.online ? 'Serveur GCOS connecté.' : 'Adresse enregistrée, mais le serveur GCOS ne répond pas actuellement.');
    } catch {
      say('Cette adresse de serveur n’est pas valide.');
    }
  }

  async function requireServer() {
    const health = await serverHealth();
    if (!health.online) throw new Error('GCOS_SERVER_OFFLINE');
    if (!health.airtableConfigured) throw new Error('AIRTABLE_NOT_CONFIGURED');
    return health;
  }

  async function logConversation(response) {
    try {
      if (!airtable()) return;
      await airtable().create('Journal Jarvis', {
        'Événement': `Conversation Jarvis ${Date.now()}`,
        'Date et heure': new Date().toISOString(),
        'Auteur': user().name,
        'Type d’action': ['Question', 'Réponse'],
        'Résumé': lastQuestion,
        'Résultat': 'Terminé',
        'Détails techniques': response
      });
    } catch {
      // Le journal ne doit jamais bloquer la réponse de Jarvis.
    }
  }

  async function searchTable(table, query) {
    return airtable().search(table, query, { maxRecords: 50 });
  }

  async function memoryAnswer(query) {
    const payload = await airtable().list('Jarvis - Mémoire et règles', { maxRecords: 100 });
    const words = normalize(query).split(/\s+/).filter(word => word.length > 3);
    let best = null;
    let score = 0;
    for (const record of payload.records || []) {
      const fields = record.fields || {};
      if (fields.Actif === false) continue;
      const text = normalize(`${fields['Élément de mémoire'] || ''} ${fields.Contenu || ''} ${JSON.stringify(fields.Domaine || '')}`);
      const currentScore = words.filter(word => text.includes(word)).length;
      if (currentScore > score) {
        score = currentScore;
        best = fields;
      }
    }
    return score ? best : null;
  }

  function extractName(text) {
    const match = text.match(/(?:nom de|pour|client|réservation de|reservation de)\s+([a-zà-ÿ'-]+(?:\s+[a-zà-ÿ'-]+){0,2})/i);
    return match ? match[1].trim() : '';
  }

  async function respond(text) {
    state('Réflexion');
    lastQuestion = text;
    const normalized = normalize(text);
    try {
      if (/tu m'entends|m'entends/.test(normalized)) return say(`Oui ${user().name}, je vous entends correctement.`);
      if (/appeler.*prenom|m'appeler.*prenom|mon prenom/.test(normalized)) return say(`Oui ${user().name}. Votre profil m’autorise à vous appeler par votre prénom.`);
      if (/heure est il|quelle heure/.test(normalized)) return say(`Il est ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.`);
      if (/planning|agenda|creneau/.test(normalized)) {
        say('J’ouvre le planning atelier.');
        return setTimeout(() => { location.href = 'planning.html'; }, 700);
      }
      if (/etat.*serveur|serveur.*gcos|connexion.*gcos/.test(normalized)) {
        const health = await serverHealth();
        return say(health.online ? `Le serveur GCOS est en ligne. Airtable est ${health.airtableConfigured ? 'configuré' : 'non configuré'}.` : 'Le serveur GCOS est hors ligne.');
      }

      await requireServer();
      const name = extractName(text);
      if (/reservation|intervention|devis|commande|client|vehicule|nom de/.test(normalized)) {
        const tables = ['Clients', 'Véhicules', 'Dossiers et devis', 'Interventions', 'Commandes et achats'];
        const hits = [];
        for (const table of tables) {
          const records = await searchTable(table, name || text);
          hits.push(...records.map(record => ({ table, fields: record.fields || {} })));
        }
        if (hits.length) {
          const first = hits[0];
          const label = first.fields['Nom complet'] || first.fields.Véhicule || first.fields.Dossier || first.fields.Intervention || first.fields.Commande || 'dossier';
          const date = first.fields['Date prévue'] || first.fields['Date du devis'] || first.fields['Livraison prévue'];
          return say(`J’ai trouvé ${hits.length} résultat${hits.length > 1 ? 's' : ''} dans Airtable. Premier résultat : ${label}${date ? `, date ${new Date(date).toLocaleDateString('fr-FR')}` : ''}.`);
        }
        return say('Je n’ai trouvé aucun résultat correspondant dans Airtable.');
      }

      const memory = await memoryAnswer(text);
      if (memory) return say(memory.Contenu || memory['Élément de mémoire']);
      return say('Je n’ai pas encore une réponse fiable dans ma mémoire. Cette demande sera conservée dans le journal Jarvis.');
    } catch (error) {
      if (error.message === 'GCOS_SERVER_OFFLINE') return say('Le serveur GCOS de l’atelier ne répond pas. Démarrez-le sur le PC ou vérifiez son adresse.');
      if (error.message === 'AIRTABLE_NOT_CONFIGURED') return say('Le serveur GCOS fonctionne, mais la connexion Airtable doit être configurée sur le PC.');
      return say('Je n’arrive pas à consulter les données GentleCarE pour le moment.');
    }
  }

  function beginHold(button) {
    if (answering) return;
    build();
    dialog.classList.add('open');
    held = true;
    transcript = '';
    button.classList.add('held');
    state('Écoute');
    if (!SR) {
      held = false;
      button.classList.remove('held');
      return say('La reconnaissance vocale n’est pas disponible sur ce navigateur.');
    }
    if (recognition) try { recognition.abort(); } catch {}
    recognition = new SR();
    recognition.lang = 'fr-FR';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = event => {
      let output = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) output += `${event.results[index][0].transcript} `;
      transcript = `${transcript} ${output}`.trim();
    };
    recognition.onerror = event => {
      if (event.error !== 'aborted') add('ai', `Erreur microphone : ${event.error}`);
    };
    try { recognition.start(); } catch { state('Veille'); }
  }

  function endHold(button) {
    held = false;
    button.classList.remove('held');
    state('Réflexion');
    if (recognition) try { recognition.stop(); } catch {}
    setTimeout(() => {
      const text = transcript.trim();
      transcript = '';
      if (text) {
        add('you', text);
        respond(text);
      } else {
        state('Veille');
      }
    }, 500);
  }

  async function open() {
    build();
    dialog.classList.add('open');
    state('Veille');
    const health = await serverHealth();
    statusEl.textContent = health.online ? 'Veille — GCOS connecté' : 'Veille — GCOS hors ligne';
  }

  function close() {
    held = false;
    if (recognition) try { recognition.abort(); } catch {}
    speechSynthesis.cancel();
    state('Veille');
    dialog.classList.remove('open');
  }

  window.JarvisCore = Object.freeze({ open, close, configureServer, respond });
  document.addEventListener('click', event => {
    const button = event.target.closest('#jarvisGlobalButton,[data-jarvis]');
    if (button) {
      event.preventDefault();
      open();
    }
  }, true);
})();