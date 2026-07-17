'use strict';

const knowledge = {
  company: {
    name: 'GentleCarE',
    legalForm: 'SARL',
    address: 'ZA Lantegia, 64990 Villefranque',
    activity: 'Cryonettoyage automobile et protection anticorrosion Dinitrol',
    forbiddenTerms: ['garage auto'],
    excludedContacts: ['Piranha']
  },
  pricing: {
    hourlyRateExVat: 180,
    travelRateExVat: 85,
    integralPublicTtc: 1500,
    integralClubTtc: 1200,
    integralFounderTtc: 1050,
    founderDiscountPercent: 30
  },
  operations: {
    dryIceKgPerVehicle: 20,
    initialTargetVehiclesPerMonth: 12,
    standardVehicleDurationDays: 2,
    workshopStartMode: 'Automobile uniquement au démarrage; industriel après embauche'
  },
  dryIce: {
    standardPricePerKg: 3.8,
    volumePricePerKg: 2.5,
    deliveryAdr: 75,
    containerCapacityKg: 350
  },
  equipment: {
    cryogenicMachine: 'IBL2500',
    workingPressureBar: 10,
    maximumPressureBar: 15,
    electricalConstraintKw: 24,
    desiredElectricalPowerKw: 36
  },
  commercial: {
    foundersOffer: '-30 % et programmation prioritaire',
    privilegedCustomerDiscountPercent: 40,
    preferredChannels: ['SMS', 'E-mail', 'Appel']
  },
  governance: {
    partners: ['David', 'Bénédicte'],
    targetOwnership: '50/50',
    commercialRoles: ['David', 'Bénédicte']
  },
  workflowRules: [
    'Le véhicule est l’entité centrale du dossier.',
    'Conserver devis, photos, rapports et communications dans le dossier client.',
    'Créer un historique par véhicule.',
    'Ne jamais contacter Piranha.',
    'Ne pas employer l’expression garage auto dans la communication GentleCarE.'
  ]
};

function search(query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];
  const results = [];

  function walk(value, path = []) {
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, [...path, index]));
      return;
    }
    if (value && typeof value === 'object') {
      Object.entries(value).forEach(([key, item]) => walk(item, [...path, key]));
      return;
    }
    const text = String(value);
    const pathText = path.join('.');
    if (text.toLowerCase().includes(q) || pathText.toLowerCase().includes(q)) {
      results.push({ path: pathText, value });
    }
  }

  walk(knowledge);
  return results.slice(0, 20);
}

module.exports = { knowledge, search };
