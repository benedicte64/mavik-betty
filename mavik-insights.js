(() => {
  'use strict';

  const QUEUE_KEY = 'mavik.insights.queue.v1';
  const CONFIG_KEY = 'mavik.insights.config.v1';
  const INSTALLATION_KEY = 'mavik.insights.installation.v1';
  const MAX_QUEUE = 1000;

  const defaults = {
    enabled: true,
    productImprovement: false,
    sectorIntelligence: false
  };

  const blocked = [
    /password/i, /secret/i, /token/i, /authorization/i,
    /payment/i, /card/i, /cvv/i, /iban/i, /bic/i,
    /email/i, /phone/i, /address/i, /adresse/i,
    /immatriculation/i, /registration/i,
    /first.?name/i, /last.?name/i, /^name$/i
  ];

  function read(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function configuration() {
    return { ...defaults, ...read(CONFIG_KEY, {}) };
  }

  function configure(next = {}) {
    const current = configuration();
    const updated = {
      enabled: next.enabled ?? current.enabled,
      productImprovement: Boolean(next.productImprovement ?? current.productImprovement),
      sectorIntelligence: Boolean(next.sectorIntelligence ?? current.sectorIntelligence)
    };
    write(CONFIG_KEY, updated);
    return updated;
  }

  function installationId() {
    let id = localStorage.getItem(INSTALLATION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(INSTALLATION_KEY, id);
    }
    return id;
  }

  function sanitize(value, depth = 0) {
    if (depth > 5) return '[limite]';
    if (value === null || value === undefined) return value;
    if (typeof value === 'string') return value.slice(0, 250);
    if (typeof value === 'number' || typeof value === 'boolean') return value;
    if (Array.isArray(value)) return value.slice(0, 100).map(item => sanitize(item, depth + 1));
    if (typeof value === 'object') {
      const output = {};
      for (const [key, item] of Object.entries(value)) {
        if (blocked.some(pattern => pattern.test(key))) continue;
        output[key] = sanitize(item, depth + 1);
      }
      return output;
    }
    return String(value);
  }

  function allowed(level, config) {
    if (level === 'essential') return true;
    if (level === 'productImprovement') return config.productImprovement;
    if (level === 'sectorIntelligence') return config.sectorIntelligence;
    return false;
  }

  function track(eventName, properties = {}, level = 'productImprovement') {
    const config = configuration();
    if (!config.enabled || !allowed(level, config)) return null;
    if (typeof eventName !== 'string' || !eventName.trim()) throw new TypeError('Nom d’événement invalide');

    const events = read(QUEUE_KEY, []);
    const event = {
      id: crypto.randomUUID(),
      schemaVersion: 1,
      eventName: eventName.trim().slice(0, 100),
      level,
      occurredAt: new Date().toISOString(),
      installationId: installationId(),
      application: 'GCOS',
      properties: sanitize(properties)
    };
    events.push(event);
    write(QUEUE_KEY, events.slice(-MAX_QUEUE));
    return event.id;
  }

  function exportBatch(limit = 100) {
    return read(QUEUE_KEY, []).slice(0, Math.max(1, Math.min(500, limit)));
  }

  function acknowledge(eventIds = []) {
    const ids = new Set(eventIds);
    const remaining = read(QUEUE_KEY, []).filter(event => !ids.has(event.id));
    write(QUEUE_KEY, remaining);
    return remaining.length;
  }

  function status() {
    const config = configuration();
    return { ...config, pending: read(QUEUE_KEY, []).length };
  }

  window.MavikInsights = Object.freeze({
    configure,
    track,
    exportBatch,
    acknowledge,
    status,
    sanitize
  });
})();
