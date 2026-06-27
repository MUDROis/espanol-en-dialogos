/* js/auth.js */
const AUTH = (() => {
  const CODES_URL = 'data/access-codes.json';
  const STORAGE_KEY = 'espanol_activation';

  let currentActivation = null;
  let codesCache = null;
  let authListeners = [];

  async function sha256(str) {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function loadCodes() {
    if (codesCache) return codesCache;
    const resp = await fetch(CODES_URL);
    codesCache = await resp.json();
    return codesCache;
  }

  function loadActivation() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function saveActivation(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function notify() {
    authListeners.forEach(fn => fn(currentActivation?.type || null));
  }

  return {
    async init() {
      currentActivation = loadActivation();
      notify();
    },

    isAuthenticated() { return !!currentActivation; },
    getActivation() { return currentActivation; },

    canAccessLesson(lessonId) {
      if (!currentActivation) return false;
      if (currentActivation.type === 'admin') return true;
      if (currentActivation.type === 'full') {
        if (currentActivation.expires_at) {
          return new Date(currentActivation.expires_at) > new Date();
        }
        return true;
      }
      if (currentActivation.type === 'demo') {
        return lessonId === 1;
      }
      return false;
    },

    async activate(code) {
      const hash = await sha256(code);
      const codes = await loadCodes();
      const match = codes.find(c => c.hash === hash);
      if (!match) return { error: 'Неверный код доступа' };
      if (match.expires_at && new Date(match.expires_at) < new Date()) {
        return { error: 'Срок действия кода истёк' };
      }
      currentActivation = {
        type: match.type,
        expires_at: match.expires_at || null,
        activated_at: new Date().toISOString(),
        codeHash: hash
      };
      saveActivation(currentActivation);
      notify();
      return { success: true };
    },

    logout() {
      currentActivation = null;
      localStorage.removeItem(STORAGE_KEY);
      notify();
    },

    onChange(fn) {
      authListeners.push(fn);
      if (currentActivation) {
        setTimeout(() => fn(currentActivation.type), 0);
      }
      return () => { authListeners = authListeners.filter(f => f !== fn); };
    },

    getAccessType() {
      return currentActivation ? currentActivation.type : null;
    }
  };
})();
