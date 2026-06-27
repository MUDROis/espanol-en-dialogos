### Task 2: Create `js/auth.js`

**Files:**
- Create: `js/auth.js`

**Interfaces:**
- Produces: global `AUTH` object consumed by `index.html`, `admin.html`, `js/app.js`, `js/progress.js`

**API:**
- `AUTH.init()` — load session from localStorage
- `AUTH.activate(code)` — async → `{success: true}` | `{error: 'message'}`
- `AUTH.logout()` — clear session
- `AUTH.isAuthenticated()` — boolean
- `AUTH.getActivation()` — `{type, expires_at, codeHash, activated_at}` | null
- `AUTH.getAccessType()` — `'demo'` | `'full'` | `'admin'` | null
- `AUTH.canAccessLesson(lessonId)` — boolean
- `AUTH.onChange(fn)` — subscribe, returns unsubscribe fn

**Implementation details:**

```js
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

  function isExpired(activation) {
    if (!activation.expires_at) return false;
    return new Date(activation.expires_at) <= new Date();
  }

  return {
    async init() {
      currentActivation = loadActivation();
      if (currentActivation && isExpired(currentActivation)) {
        currentActivation = null;
        localStorage.removeItem(STORAGE_KEY);
      }
      notify();
    },

    isAuthenticated() { return !!currentActivation; },

    getActivation() { return currentActivation; },

    getAccessType() { return currentActivation ? currentActivation.type : null; },

    canAccessLesson(lessonId) {
      if (!currentActivation) return false;
      if (isExpired(currentActivation)) return false;
      if (currentActivation.type === 'admin') return true;
      if (currentActivation.type === 'full') return true;
      if (currentActivation.type === 'demo') return lessonId === 1;
      return false;
    },

    async activate(code) {
      const hash = await sha256(code);
      const codes = await loadCodes();
      const match = codes.find(c => c.hash === hash);
      if (!match) return { error: 'Неверный код доступа' };
      if (!match.active) return { error: 'Код доступа деактивирован' };
      let expires_at = null;
      if (match.expires_in) {
        const matchNum = match.expires_in.match(/^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?$/);
        if (matchNum) {
          const now = new Date();
          const years = parseInt(matchNum[1] || '0');
          const months = parseInt(matchNum[2] || '0');
          const days = parseInt(matchNum[3] || '0');
          now.setFullYear(now.getFullYear() + years);
          now.setMonth(now.getMonth() + months);
          now.setDate(now.getDate() + days);
          expires_at = now.toISOString();
        }
      }
      currentActivation = {
        type: match.type,
        expires_at,
        activated_at: new Date().toISOString(),
        codeHash: hash
      };
      saveActivation(currentActivation);
      notify();
      return { success: true, type: match.type };
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
    }
  };
})();
```

- [ ] **Step 1: Create the file with the exact code above**
- [ ] **Step 2: Verify the file loads without errors** (check syntax)
- [ ] **Step 3: Commit**
