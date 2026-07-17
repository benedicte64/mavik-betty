'use strict';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function findByText(items, text, fields) {
  const q = String(text || '').toLowerCase();
  return items.find((item) => fields.some((field) => String(item[field] || '').toLowerCase().includes(q)));
}

function brief(store) {
  const clients = store.list('clients');
  const vehicles = store.list('vehicles');
  const interventions = store.list('interventions');
  const observations = store.list('observations');
  const today = todayKey();
  const todayInterventions = interventions.filter((item) => item.scheduledDate === today);
  const open = interventions.filter((item) => !['Terminée', 'Livrée', 'Annulée'].includes(item.status));
  const urgent = observations.filter((item) => item.severity === 'Urgent' && item.decision === 'En attente');
  return {
    greeting: `Bonjour David. ${todayInterventions.length} intervention(s) prévue(s) aujourd’hui, ${open.length} dossier(s) ouvert(s) et ${urgent.length} constat(s) urgent(s).`,
    todayInterventions,
    openInterventions: open,
    urgentObservations: urgent,
    totals: { clients: clients.length, vehicles: vehicles.length, interventions: interventions.length }
  };
}

function execute(store, input = {}) {
  const text = String(input.text || '').trim();
  const normalized = text.toLowerCase();
  if (!text) return { type: 'message', answer: 'Donnez-moi une instruction.' };

  if (/bonjour|point|résumé|resume|journée|journee/.test(normalized)) {
    const data = brief(store);
    return { type: 'brief', answer: data.greeting, data };
  }

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

  return {
    type: 'message',
    answer: 'Commande reçue. Pour cette première version, demandez le point du jour, le nombre de clients ou véhicules, les interventions actives, ou recherchez un véhicule par modèle, plaque ou VIN.'
  };
}

module.exports = { brief, execute };
