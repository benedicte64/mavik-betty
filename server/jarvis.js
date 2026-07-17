'use strict';

const { knowledge, search: searchKnowledge } = require('./jarvis-knowledge');

function todayKey() { return new Date().toISOString().slice(0, 10); }
function findByText(items, text, fields) {
  const q = String(text || '').toLowerCase();
  return items.find((item) => fields.some((field) => String(item[field] || '').toLowerCase().includes(q)));
}

function brief(store) {
  const clients = store.list('clients');
  const vehicles = store.list('vehicles');
  const interventions = store.list('interventions');
  const observations = store.list('observations');
  const tasks = store.list('tasks');
  const stockItems = store.list('stockItems');
  const quotes = store.list('quotes');
  const today = todayKey();
  const todayInterventions = interventions.filter((item) => item.scheduledDate === today);
  const open = interventions.filter((item) => !['Terminée', 'Livrée', 'Annulée'].includes(item.status));
  const urgent = observations.filter((item) => item.severity === 'Urgent' && item.decision === 'En attente');
  const pendingTasks = tasks.filter((item) => item.status !== 'Terminée');
  const lowStock = stockItems.filter((item) => item.alertThreshold > 0 && item.quantity <= item.alertThreshold);
  const pendingQuotes = quotes.filter((item) => ['Brouillon', 'Envoyé', 'À relancer'].includes(item.status));
  return {
    greeting: `Bonjour David. ${todayInterventions.length} intervention(s) aujourd’hui, ${pendingTasks.length} tâche(s) à faire, ${pendingQuotes.length} devis en attente et ${lowStock.length} alerte(s) de stock.`,
    todayInterventions, openInterventions: open, urgentObservations: urgent,
    pendingTasks, pendingQuotes, lowStock,
    totals: { clients: clients.length, vehicles: vehicles.length, interventions: interventions.length }
  };
}

function pricingAnswer(normalized) {
  if (!/tarif|prix|combien|coûte|coute/.test(normalized)) return null;
  const p = knowledge.pricing;
  if (/fondateur|pass/.test(normalized)) return `Le Pack Intégral Pass Fondateur est à ${p.integralFounderTtc} € TTC, soit ${p.founderDiscountPercent} % de remise.`;
  if (/club/.test(normalized)) return `Le tarif Club du Pack Intégral est à ${p.integralClubTtc} € TTC.`;
  if (/déplacement|deplacement/.test(normalized)) return `Le déplacement est facturé ${p.travelRateExVat} € HT par heure.`;
  if (/heure|horaire|main.?d.?œuvre|main.?d.?oeuvre/.test(normalized)) return `Le tarif atelier est de ${p.hourlyRateExVat} € HT par heure.`;
  if (/intégral|integral|cryo.*dinitrol|dinitrol.*cryo/.test(normalized)) return `Le Pack Intégral Cryo + Dinitrol est à ${p.integralPublicTtc} € TTC au tarif public, ${p.integralClubTtc} € TTC au tarif Club et ${p.integralFounderTtc} € TTC avec le Pass Fondateur.`;
  return null;
}

function execute(store, input = {}) {
  const text = String(input.text || '').trim();
  const normalized = text.toLowerCase();
  if (!text) return { type: 'message', answer: 'Donnez-moi une instruction.' };

  if (/bonjour|point|résumé|resume|journée|journee/.test(normalized)) {
    const data = brief(store);
    return { type: 'brief', answer: data.greeting, data };
  }

  const addTask = text.match(/(?:ajoute|crée|cree|note)\s+(?:une\s+)?tâche\s*[:\-]?\s*(.+)/i);
  if (addTask) {
    const task = store.create('tasks', { title: addTask[1].trim(), status: 'À faire', priority: /urgent/i.test(text) ? 'Urgente' : 'Normale' });
    return { type: 'task-created', answer: `Tâche ajoutée : ${task.title}.`, data: task };
  }

  if (/tâches?|taches?|à faire|a faire/.test(normalized)) {
    const records = store.list('tasks').filter((item) => item.status !== 'Terminée');
    return { type: 'tasks', answer: `${records.length} tâche(s) restent à faire.`, data: { records } };
  }

  if (/stock|fournitures?|glace disponible|dinitrol disponible/.test(normalized)) {
    const records = store.list('stockItems');
    const low = records.filter((item) => item.alertThreshold > 0 && item.quantity <= item.alertThreshold);
    return { type: 'stock', answer: `${records.length} article(s) suivis, dont ${low.length} en alerte.`, data: { records, low } };
  }

  if (/devis/.test(normalized) && /(attente|relancer|combien|nombre)/.test(normalized)) {
    const records = store.list('quotes').filter((item) => ['Brouillon', 'Envoyé', 'À relancer'].includes(item.status));
    return { type: 'quotes', answer: `${records.length} devis sont en attente ou à relancer.`, data: { records } };
  }

  const price = pricingAnswer(normalized);
  if (price) return { type: 'knowledge', answer: price, data: { source: 'GentleCarE' } };

  if (/adresse|siège|siege/.test(normalized)) return { type: 'knowledge', answer: `L’adresse GentleCarE est ${knowledge.company.address}.`, data: knowledge.company };
  if (/glace|carbonique|pellet/.test(normalized)) {
    const d = knowledge.dryIce;
    return { type: 'knowledge', answer: `Base de calcul : ${knowledge.operations.dryIceKgPerVehicle} kg par véhicule. Glace à ${d.standardPricePerKg} €/kg, ou ${d.volumePricePerKg} €/kg en volume, plus ${d.deliveryAdr} € de livraison ADR.`, data: d };
  }
  if (/pression|compresseur|ibl2500|machine cryo/.test(normalized)) {
    const e = knowledge.equipment;
    return { type: 'knowledge', answer: `Machine ${e.cryogenicMachine} : travail prévu à ${e.workingPressureBar} bars, maximum ${e.maximumPressureBar} bars. Contrainte électrique actuelle : ${e.electricalConstraintKw} kW, objectif ${e.desiredElectricalPowerKw} kW.`, data: e };
  }
  if (/règle|regle|procédure|procedure|consigne/.test(normalized)) return { type: 'knowledge', answer: knowledge.workflowRules.join(' '), data: { rules: knowledge.workflowRules } };

  if (/clients?/.test(normalized) && /(combien|nombre)/.test(normalized)) {
    const count = store.list('clients').length;
    return { type: 'metric', answer: `${count} client(s) enregistré(s).`, data: { count } };
  }
  if (/véhicules?|vehicules?/.test(normalized) && /(combien|nombre)/.test(normalized)) {
    const count = store.list('vehicles').length;
    return { type: 'metric', answer: `${count} véhicule(s) enregistré(s).`, data: { count } };
  }

  const vehicles = store.list('vehicles');
  const vehicle = findByText(vehicles, text, ['model', 'registration', 'vin']);
  if (vehicle) {
    const interventions = store.list('interventions').filter((item) => item.vehicleId === vehicle.id);
    return { type: 'vehicle', answer: `${vehicle.model || 'Véhicule'} ${vehicle.registration || ''} : ${interventions.length} intervention(s).`, data: { vehicle, interventions } };
  }

  if (/interventions?|atelier/.test(normalized)) {
    const open = store.list('interventions').filter((item) => !['Terminée', 'Livrée', 'Annulée'].includes(item.status));
    return { type: 'interventions', answer: `${open.length} intervention(s) active(s).`, data: { records: open } };
  }

  const matches = searchKnowledge(text);
  if (matches.length) return { type: 'knowledge-search', answer: matches.map((item) => `${item.path} : ${item.value}`).join('\n'), data: { matches } };

  return { type: 'message', answer: 'Je n’ai pas encore cette information dans Jarvis OS. Elle pourra être ajoutée à la mémoire GentleCarE.' };
}

module.exports = { brief, execute, knowledge };
