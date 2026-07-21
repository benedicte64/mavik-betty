(() => {
  'use strict';

  const Recognition = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
  const DEFAULTS = Object.freeze({
    voiceFirst: false,
    dailyBriefing: false,
    voiceGender: 'auto',
    voiceRate: 0.9
  });
  const FEMALE_HINTS = /audrey|amelie|amélie|celine|céline|hortense|julie|marie|virginie|female|femme/i;
  const MALE_HINTS = /henri|thomas|paul|male|homme/i;
  const DIGITS = Object.freeze({
    zero:'0', zéro:'0', oh:'0', un:'1', une:'1', deux:'2', trois:'3', quatre:'4', cinq:'5', six:'6', sept:'7', huit:'8', neuf:'9'
  });
  let activeRecognition = null;

  function clampRate(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(1.1, Math.max(0.7, number)) : DEFAULTS.voiceRate;
  }

  function normalize(input = {}) {
    return {
      voiceFirst: input.voiceFirst === true,
      dailyBriefing: input.dailyBriefing === true,
      voiceGender: ['auto', 'female', 'male'].includes(input.voiceGender) ? input.voiceGender : DEFAULTS.voiceGender,
      voiceRate: clampRate(input.voiceRate)
    };
  }

  function frenchVoices() {
    if (!('speechSynthesis' in globalThis)) return [];
    return speechSynthesis.getVoices().filter((voice) => /^fr([_-]|$)/i.test(voice.lang || ''));
  }

  function selectVoice(gender = 'auto') {
    const voices = frenchVoices();
    if (!voices.length) return null;
    const hint = gender === 'female' ? FEMALE_HINTS : gender === 'male' ? MALE_HINTS : null;
    return (hint && voices.find((voice) => hint.test(voice.name))) || voices.find((voice) => voice.localService) || voices[0];
  }

  function stopSpeaking() {
    if ('speechSynthesis' in globalThis) speechSynthesis.cancel();
  }

  function speak(text, preferences = {}, options = {}) {
    const message = String(text || '').trim();
    const settings = normalize(preferences);
    if (!message || !('speechSynthesis' in globalThis) || (options.respectTextOnly && preferences.textOnly === true)) return Promise.resolve(false);
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'fr-FR';
      utterance.rate = settings.voiceRate;
      utterance.pitch = 1;
      utterance.volume = 1;
      const voice = selectVoice(settings.voiceGender);
      if (voice) utterance.voice = voice;
      utterance.onend = () => resolve(true);
      utterance.onerror = () => resolve(false);
      if (options.cancel !== false) speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    });
  }

  function stopListening() {
    if (!activeRecognition) return;
    try { activeRecognition.abort(); } catch {}
    activeRecognition = null;
  }

  function listenOnce(options = {}) {
    if (!Recognition) return Promise.reject(Object.assign(new Error('VOICE_RECOGNITION_UNAVAILABLE'), { code:'VOICE_RECOGNITION_UNAVAILABLE' }));
    stopSpeaking();
    stopListening();
    return new Promise((resolve, reject) => {
      const recognition = new Recognition();
      activeRecognition = recognition;
      recognition.lang = options.lang || 'fr-FR';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      let settled = false;
      const finish = (callback, value) => {
        if (settled) return;
        settled = true;
        activeRecognition = null;
        callback(value);
      };
      recognition.onresult = (event) => finish(resolve, String(event.results?.[0]?.[0]?.transcript || '').trim());
      recognition.onerror = (event) => finish(reject, Object.assign(new Error(event.error || 'VOICE_RECOGNITION_FAILED'), { code:event.error || 'VOICE_RECOGNITION_FAILED' }));
      recognition.onnomatch = () => finish(reject, Object.assign(new Error('VOICE_NOT_UNDERSTOOD'), { code:'VOICE_NOT_UNDERSTOOD' }));
      recognition.onend = () => { if (!settled) finish(reject, Object.assign(new Error('VOICE_NO_SPEECH'), { code:'VOICE_NO_SPEECH' })); };
      try { recognition.start(); } catch (error) { finish(reject, error); }
    });
  }

  function fold(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9àâäéèêëîïôöùûüç]+/g, ' ').trim();
  }

  function parseSpokenPin(value) {
    const raw = fold(value);
    const direct = raw.replace(/\D/g, '');
    if (direct.length === 4) return direct;
    const parsed = raw.split(/\s+/).map((token) => DIGITS[token] ?? DIGITS[token.normalize('NFC')]).filter((digit) => digit !== undefined).join('');
    return parsed.length === 4 ? parsed : '';
  }

  function matchChoice(value, choices = []) {
    const heard = fold(value);
    if (!heard) return null;
    return choices.find((choice) => {
      const candidates = [choice.id, choice.label, ...(choice.aliases || [])].map(fold).filter(Boolean);
      return candidates.some((candidate) => heard === candidate || heard.includes(candidate) || candidate.includes(heard));
    }) || null;
  }

  globalThis.BettyVoice = Object.freeze({
    DEFAULTS,
    supported: () => Boolean(Recognition),
    synthesisSupported: () => 'speechSynthesis' in globalThis,
    normalize,
    speak,
    stopSpeaking,
    listenOnce,
    stopListening,
    parseSpokenPin,
    matchChoice
  });
})();
