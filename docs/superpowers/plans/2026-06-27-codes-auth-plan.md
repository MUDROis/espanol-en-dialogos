# Codes-Based Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Supabase auth with offline codes-based authorization — codes stored as SHA-256 hashes in a static JSON file, with admin panel for code management and GitHub Actions workflow for committing new codes.

**Architecture:** Static JSON file (`data/access-codes.json`) stores SHA-256 hashes with type/label/expiration. Auth module (`js/auth.js`) loads codes, hashes user input, matches against stored hashes. Session stored in localStorage. Progress keyed by code hash prefix. Admin panel at `admin.html` for generating codes. GitHub Actions workflow for committing new codes.

**Tech Stack:** Vanilla JS, SHA-256 (Web Crypto API), GitHub Actions

## Global Constraints

- No database — all auth data in static JSON
- No network calls for auth (only initial JSON fetch)
- Codes never stored in plaintext in repo — only SHA-256 hashes
- `active: false` for deactivation (no physical deletion)
- Progress isolated per code hash (different users, same device → separate progress)

---

### Task 1: Create initial `data/access-codes.json`

**Files:**
- Create: `data/access-codes.json`

**Interfaces:**
- Produces: file format consumed by `js/auth.js` `loadCodes()`

**Pre-generated codes (compute SHA-256 hashes at implementation time):**

| Plaintext | Type | Label | Expires |
|-----------|------|-------|---------|
| `DEMO-2026` | demo | Демо-доступ | null |
| `ADMIN-MASTER` | admin | Администратор | null |

- [ ] **Step 1: Compute SHA-256 hashes**

Run in browser console or node:
```js
async function sha256(str) {
  const buf = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
// sha256('DEMO-2026') → demo_hash
// sha256('ADMIN-MASTER') → admin_hash
```

- [ ] **Step 2: Create `data/access-codes.json`**

```json
[
  {
    "hash": "<demo_hash>",
    "type": "demo",
    "label": "Демо-доступ",
    "active": true,
    "expires_in": null,
    "created_at": "2026-06-27T00:00:00.000Z"
  },
  {
    "hash": "<admin_hash>",
    "type": "admin",
    "label": "Администратор",
    "active": true,
    "expires_in": null,
    "created_at": "2026-06-27T00:00:00.000Z"
  }
]
```

- [ ] **Step 3: Commit**

```bash
git add data/access-codes.json
git commit -m "feat: add initial access codes (demo + admin)"
```

---

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

- [ ] **Step 1: Create `js/auth.js`**

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

- [ ] **Step 2: Verify the file loads without errors**

Open `index.html` in browser, check console for no errors. Verify `AUTH` is defined in global scope.

- [ ] **Step 3: Commit**

```bash
git add js/auth.js
git commit -m "feat: add auth module with SHA-256 code matching"
```

---

### Task 3: Modify `js/progress.js` — per-code progress isolation

**Files:**
- Modify: `js/progress.js`

**Interfaces:**
- Consumes: `AUTH.getActivation()` (optional — works without auth too)
- Produces: progress keyed by `espanol_progress_{codeHashPrefix}`

- [ ] **Step 1: Replace `STORAGE_KEY` with `_getKey()`**

Replace entire `js/progress.js` content:

```js
/* js/progress.js */
const Progress = {
  _getKey() {
    const activation = typeof AUTH !== 'undefined' ? AUTH.getActivation() : null;
    const suffix = activation ? activation.codeHash.slice(0, 12) : 'anonymous';
    return 'espanol_progress_' + suffix;
  },

  _load() {
    try {
      return JSON.parse(localStorage.getItem(this._getKey()) || '{}');
    } catch {
      return {};
    }
  },

  _save(data) {
    localStorage.setItem(this._getKey(), JSON.stringify(data));
  },

  get(dialogId) {
    const data = this._load();
    return data[dialogId] || { completed: false, score: null, lastStep: 0 };
  },

  set(dialogId, updates) {
    const data = this._load();
    data[dialogId] = { ...this.get(dialogId), ...updates };
    this._save(data);
  },

  getAll() {
    return this._load();
  },

  getStats() {
    const data = this._load();
    const entries = Object.values(data);
    return {
      total: Object.keys(data).length,
      completed: entries.filter(e => e.completed).length
    };
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add js/progress.js
git commit -m "feat: isolate progress per code hash prefix"
```

---

### Task 4: Modify `index.html` — auth UI + lesson gating

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: `AUTH` from `js/auth.js`, `Progress` from `js/progress.js`

- [ ] **Step 1: Add auth.js script before progress.js**

Replace existing script order:
```html
  <script src="js/auth.js"></script>
  <script src="js/progress.js"></script>
  <script src="js/speech.js"></script>
  <script src="js/app.js"></script>
  <script>
    // inline script...
  </script>
```

- [ ] **Step 2: Add auth-section HTML after header, before progress-summary**

```html
  <main>
    <div id="auth-section" class="container" style="display:none">
      <div class="auth-card">
        <div id="auth-form-area">
          <h2>Введите код доступа</h2>
          <p style="text-align:center;margin-bottom:16px;font-size:14px;color:var(--gray-dark)">
            Код вы получаете после оплаты курса
          </p>
          <div id="auth-error" class="auth-error" style="display:none"></div>
          <input type="text" id="auth-code" class="auth-input" placeholder="Код доступа" autocomplete="off">
          <button id="auth-submit" class="btn btn-primary" style="width:100%">Активировать</button>
        </div>
        <div id="auth-user-area" style="display:none">
          <p style="text-align:center;font-size:14px;color:var(--gray-dark)" id="auth-access-info"></p>
          <button id="auth-logout" class="btn btn-secondary" style="width:100%">Выйти</button>
        </div>
      </div>
    </div>

    <div class="container">
      <!-- existing progress-summary and course-content -->
    </div>
  </main>
```

- [ ] **Step 3: Replace inline script with auth-gated version**

Replace everything from the first `<script>` (after `app.js`) to the end of the file with:

```html
  <script>
    function showAuthError(msg) {
      const el = document.getElementById('auth-error');
      el.textContent = msg;
      el.style.display = 'block';
    }

    function hideAuthError() {
      document.getElementById('auth-error').style.display = 'none';
    }

    function renderCourse(dialogs) {
      const stats = Progress.getStats();
      const activation = AUTH.getActivation();

      const total = 55;
      document.getElementById('total-text').textContent = total;
      document.getElementById('progress-text').textContent = stats.completed;
      const pct = total > 0 ? Math.round((stats.completed / total) * 100) : 0;
      document.getElementById('progress-fill').style.width = pct + '%';

      const parts = {};
      for (const d of dialogs) {
        const key = d.part;
        if (!parts[key]) { parts[key] = { part: key, title: d.partTitle, dialogs: [] }; }
        parts[key].dialogs.push(d);
      }

      let html = '';
      for (const key of Object.keys(parts).sort((a,b) => a - b)) {
        const p = parts[key];
        html += `
          <div class="part-card">
            <div class="part-header" onclick="this.nextElementSibling.classList.toggle('part-body--hidden')">
              <span>Parte ${['I','II','III','IV','V','VI'][key-1] || key}: ${p.title}</span>
              <span style="font-size:14px;color:var(--gray-dark)">${p.dialogs.length} диалогов</span>
            </div>
            <div class="part-body">
              ${p.dialogs.map(d => {
                if (AUTH.canAccessLesson(d.id)) {
                  const prog = Progress.get('dialog-' + d.id);
                  let statusClass = 'available';
                  let statusText = '→';
                  if (prog.completed) { statusClass = 'done'; statusText = '✓'; }
                  return '<a href="lesson.html?id=' + d.id + '" class="dialog-link">' +
                    '<span>' + d.id + '. ' + d.title + '</span>' +
                    '<span style="font-size:14px;color:var(--gray-dark)">' + d.theme + '</span>' +
                    '<span class="status ' + statusClass + '">' + statusText + '</span>' +
                    '</a>';
                }
                return '<div class="dialog-link--locked" title="Доступно после оплаты курса">' +
                  '<span>' + d.id + '. ' + d.title + '</span>' +
                  '<span style="font-size:14px;color:var(--gray-dark)">' + d.theme + '</span>' +
                  '<span class="status locked">🔒</span>' +
                  '</div>';
              }).join('')}
            </div>
          </div>`;
      }
      document.getElementById('course-content').innerHTML = html;
    }

    function showAuth(isAuthenticated, activation) {
      const authSection = document.getElementById('auth-section');
      const courseSection = document.getElementById('progress-summary').parentElement;
      const adminLink = document.getElementById('admin-link');
      if (!isAuthenticated) {
        authSection.style.display = 'block';
        courseSection.style.display = 'none';
        document.getElementById('auth-form-area').style.display = 'block';
        document.getElementById('auth-user-area').style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
      } else {
        authSection.style.display = 'block';
        courseSection.style.display = 'block';
        document.getElementById('auth-form-area').style.display = 'none';
        document.getElementById('auth-user-area').style.display = 'block';
        const accessInfo = document.getElementById('auth-access-info');
        if (activation.type === 'admin') {
          accessInfo.textContent = 'Администратор — полный доступ';
          if (adminLink) adminLink.style.display = 'inline';
        } else if (activation.type === 'demo') {
          accessInfo.textContent = 'Демо-доступ: открыт урок 1';
        } else if (activation.type === 'full') {
          if (activation.expires_at) {
            const expiry = new Date(activation.expires_at).toLocaleDateString('ru-RU');
            accessInfo.textContent = 'Полный доступ до ' + expiry;
          } else {
            accessInfo.textContent = 'Полный доступ — все уроки открыты';
          }
        }
      }
    }

    document.addEventListener('DOMContentLoaded', async () => {
      await AUTH.init();

      const resp = await fetch('data/dialogs.json');
      const dialogs = await resp.json();

      AUTH.onChange((type) => {
        const act = AUTH.getActivation();
        showAuth(!!act, act);
        if (act) { renderCourse(dialogs); }
      });

      document.getElementById('auth-submit').addEventListener('click', async () => {
        hideAuthError();
        const code = document.getElementById('auth-code').value.trim();
        if (!code) { showAuthError('Введите код доступа'); return; }
        const res = await AUTH.activate(code);
        if (res.error) { showAuthError(res.error); return; }
      });

      document.getElementById('auth-code').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.getElementById('auth-submit').click();
      });

      document.getElementById('auth-logout').addEventListener('click', () => {
        AUTH.logout();
        document.getElementById('auth-code').value = '';
      });

      if (AUTH.isAuthenticated()) {
        showAuth(true, AUTH.getActivation());
        renderCourse(dialogs);
      }
    });
  </script>
```

- [ ] **Step 4: Add admin link to the header**

In the header div, after the existing content:
```html
      <div>
        <h1>🇪🇸 Español en Diálogos</h1>
        <p style="opacity:0.8;margin-top:4px">Интерактивный курс испанского языка по книге «Испанский в диалогах»</p>
        <a id="admin-link" href="admin.html" style="color:#fff;font-size:14px;display:none;margin-top:4px">⚙ Управление кодами</a>
      </div>
```

- [ ] **Step 5: Verify**

Open `index.html` in browser. Should show auth form (not course). Enter demo code → should see only lesson 1. Enter admin code → should see all lessons + admin link. Check that `AUTH` and `Progress` work without errors in console.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: add auth UI and lesson gating to main page"
```

---

### Task 5: Modify `js/app.js` — lesson access guard on lesson.html

**Files:**
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `AUTH` from `js/auth.js`, `LessonPlayer` from `js/lesson-player.js`

- [ ] **Step 1: Add auth check before loading dialog**

Replace `js/app.js`:

```js
/* js/app.js */
window.allCharacters = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (Speech.isSupported) {
    speechSynthesis.getVoices();
    speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
  }

  try {
    const resp = await fetch('data/characters.json');
    window.allCharacters = await resp.json();
  } catch (e) {}

  const params = new URLSearchParams(window.location.search);
  const dialogId = params.get('id');

  if (window.location.pathname.endsWith('lesson.html') && dialogId) {
    await AUTH.init();
    if (!AUTH.canAccessLesson(parseInt(dialogId))) {
      const container = document.getElementById('app');
      if (container) {
        container.innerHTML = `
          <div class="container" style="text-align:center;padding:40px">
            <h2>🚫 Доступ запрещён</h2>
            <p>У вас нет доступа к этому уроку.</p>
            <a href="index.html" class="btn btn-primary">На главную</a>
          </div>`;
      }
      document.getElementById('lesson-title').textContent = 'Доступ запрещён';
      document.getElementById('step-indicator').style.display = 'none';
      document.getElementById('nav-buttons').style.display = 'none';
      return;
    }
    loadDialog(dialogId);
  }
});

async function loadDialog(id) {
  const container = document.getElementById('app');
  if (!container) return;

  container.innerHTML = '<div class="container" style="text-align:center;padding:40px"><p>Загрузка...</p></div>';

  try {
    const paddedId = String(id).padStart(2, '0');
    const response = await fetch(`data/dialog-${paddedId}.json`);
    if (!response.ok) throw new Error('Not found');
    const dialog = await response.json();
    LessonPlayer.init(dialog);
  } catch (e) {
    container.innerHTML = `
      <div class="container" style="text-align:center;padding:40px">
        <h2>Диалог не найден</h2>
        <p>Диалог с номером ${id} ещё не добавлен.</p>
        <a href="index.html" class="btn btn-primary">На главную</a>
      </div>`;
  }
}
```

- [ ] **Step 2: Add auth.js and progress.js scripts to lesson.html**

Ensure `lesson.html` includes:
```html
  <script src="js/auth.js"></script>
  <script src="js/progress.js"></script>
  <script src="js/speech.js"></script>
  <script src="js/games.js"></script>
  <script src="js/lesson-player.js"></script>
  <script src="js/app.js"></script>
```

- [ ] **Step 3: Verify**

Open `lesson.html?id=2` without auth (or with demo code). Should show "Доступ запрещён". With admin/full code, should load lesson normally.

- [ ] **Step 4: Commit**

```bash
git add js/app.js lesson.html
git commit -m "feat: add lesson access guard with auth check"
```

---

### Task 6: Create `admin.html` — admin panel

**Files:**
- Create: `admin.html`

**Interfaces:**
- Consumes: `AUTH.getAccessType()` — redirects non-admin
- Consumes: `data/access-codes.json` — loads and displays existing codes

- [ ] **Step 1: Create `admin.html`**

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Español en Diálogos — Управление кодами</title>
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <header class="header">
    <div class="container header-inner">
      <div>
        <a href="index.html" style="color:#fff">← На главную</a>
        <h1 style="margin-top:4px">⚙ Управление кодами доступа</h1>
      </div>
      <a href="https://xn--80aaagnrcpdkofpu2ae0iuf.xn--p1ai/" target="_blank" rel="noopener"><img src="logo.png" alt="Español en Diálogos" class="header-logo"></a>
    </div>
  </header>

  <main>
    <div class="container" id="admin-loading" style="text-align:center;padding:40px">
      <p>Проверка доступа...</p>
    </div>

    <div id="admin-content" style="display:none">
      <div class="container">
        <div class="card" style="margin-bottom:16px">
          <h2>🔑 Сгенерировать новый код</h2>
          <div id="generate-error" class="auth-error" style="display:none"></div>
          <div style="display:flex;flex-direction:column;gap:12px;margin-top:16px">
            <div>
              <label style="font-weight:600;display:block;margin-bottom:4px">Метка (ФИО ученика)</label>
              <input type="text" id="new-label" class="auth-input" placeholder="Иван Петров">
            </div>
            <div>
              <label style="font-weight:600;display:block;margin-bottom:4px">Тип доступа</label>
              <select id="new-type" class="auth-input">
                <option value="demo">Демо (урок 1)</option>
                <option value="full" selected>Полный (все уроки)</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
            <div>
              <label style="font-weight:600;display:block;margin-bottom:4px">Срок действия</label>
              <select id="new-expires" class="auth-input">
                <option value="">Навсегда</option>
                <option value="P1M">1 месяц</option>
                <option value="P6M">6 месяцев</option>
                <option value="P1Y" selected>1 год</option>
              </select>
            </div>
            <button id="generate-btn" class="btn btn-primary" style="width:100%">Сгенерировать код</button>
          </div>

          <div id="generated-result" style="display:none;margin-top:16px;padding:16px;background:#f0fff4;border-radius:8px">
            <p style="font-weight:600;margin-bottom:8px">✅ Код сгенерирован</p>
            <div style="font-size:24px;font-family:monospace;text-align:center;padding:16px;background:#fff;border-radius:8px;border:2px dashed var(--success);margin:8px 0;word-break:break-all" id="generated-code"></div>
            <button id="copy-btn" class="btn btn-secondary" style="width:100%;margin-bottom:8px">📋 Скопировать код</button>
            <p style="font-size:12px;color:var(--gray-dark);margin-top:8px">
              Хеш (SHA-256): <code id="generated-hash" style="font-size:11px;word-break:break-all"></code>
            </p>
            <details style="margin-top:8px;font-size:13px">
              <summary style="cursor:pointer;color:var(--primary)">Как добавить код в репозиторий?</summary>
              <div style="margin-top:8px;padding:8px;background:var(--gray);border-radius:6px">
                <p><strong>Вариант 1:</strong> Откройте GitHub → Actions → Manage Codes → Run workflow → Mode: add → введите код, тип, метку → Run</p>
                <p><strong>Вариант 2:</strong> Добавьте строку вручную в <code>data/access-codes.json</code> и закоммитьте</p>
              </div>
            </details>
          </div>
        </div>

        <div class="card">
          <h2>📋 Существующие коды</h2>
          <div id="codes-table-wrapper" style="margin-top:16px;overflow-x:auto">
            <table id="codes-table" class="admin-table">
              <thead>
                <tr>
                  <th>Метка</th>
                  <th>Тип</th>
                  <th>Срок</th>
                  <th>Статус</th>
                  <th>Создан</th>
                  <th>Действие</th>
                </tr>
              </thead>
              <tbody id="codes-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </main>

  <footer style="text-align:center;padding:24px;color:var(--gray-dark);font-size:14px">
    <p>© 2026 — Громова Анна, ИНТЕРАКТИВНАЯ ШКОЛА МУДРО</p>
  </footer>

  <script src="js/auth.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', async () => {
      await AUTH.init();

      if (AUTH.getAccessType() !== 'admin') {
        document.getElementById('admin-loading').innerHTML = `
          <h2>🚫 Доступ запрещён</h2>
          <p>Только администратор может управлять кодами.</p>
          <a href="index.html" class="btn btn-primary">На главную</a>
        `;
        return;
      }

      document.getElementById('admin-loading').style.display = 'none';
      document.getElementById('admin-content').style.display = 'block';

      // Generate code
      document.getElementById('generate-btn').addEventListener('click', async () => {
        const label = document.getElementById('new-label').value.trim();
        if (!label) {
          document.getElementById('generate-error').textContent = 'Введите метку';
          document.getElementById('generate-error').style.display = 'block';
          return;
        }
        document.getElementById('generate-error').style.display = 'none';

        const type = document.getElementById('new-type').value;
        const expiresIn = document.getElementById('new-expires').value;
        const code = Math.random().toString(36).toUpperCase().slice(2, 8) + '-' +
                     Math.random().toString(36).toUpperCase().slice(2, 8);

        const buf = new TextEncoder().encode(code);
        const hashBuf = await crypto.subtle.digest('SHA-256', buf);
        const hash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');

        document.getElementById('generated-code').textContent = code;
        document.getElementById('generated-hash').textContent = hash;
        document.getElementById('generated-result').style.display = 'block';
      });

      // Copy button
      document.getElementById('copy-btn').addEventListener('click', () => {
        const code = document.getElementById('generated-code').textContent;
        navigator.clipboard.writeText(code).catch(() => {});
        document.getElementById('copy-btn').textContent = '✅ Скопировано!';
        setTimeout(() => { document.getElementById('copy-btn').textContent = '📋 Скопировать код'; }, 2000);
      });

      // Load existing codes
      (async function loadCodes() {
        const resp = await fetch('data/access-codes.json');
        const codes = await resp.json();
        const tbody = document.getElementById('codes-tbody');
        tbody.innerHTML = codes.map(c => {
          const expiresLabel = c.expires_in ? c.expires_in.replace('P', '').replace('Y', ' г.').replace('M', ' мес.') : 'Навсегда';
          const statusLabel = c.active ? '✅ Активен' : '❌ Деактивирован';
          const statusStyle = c.active ? 'color:var(--success)' : 'color:var(--gray-dark)';
          const createdDate = new Date(c.created_at).toLocaleDateString('ru-RU');
          const typeLabel = { demo: 'Демо', full: 'Полный', admin: 'Админ' }[c.type] || c.type;
          return '<tr>' +
            '<td>' + c.label + '</td>' +
            '<td>' + typeLabel + '</td>' +
            '<td>' + expiresLabel + '</td>' +
            '<td style="' + statusStyle + '">' + statusLabel + '</td>' +
            '<td>' + createdDate + '</td>' +
            '<td>' + (c.active
              ? '<button class="btn btn-secondary" style="font-size:13px;padding:6px 12px" onclick="deactivateCode(\'' + c.hash + '\')">Деактивировать</button>'
              : '—') + '</td>' +
            '</tr>';
        }).join('');
      })();
    });

    window.deactivateCode = function(hash) {
      if (!confirm('Деактивировать этот код? Его больше нельзя будет использовать.')) return;
      fetch('data/access-codes.json')
        .then(r => r.json())
        .then(codes => {
          const updated = codes.map(c => c.hash === hash ? { ...c, active: false } : c);
          const blob = new Blob([JSON.stringify(updated, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'access-codes.json';
          a.click();
          URL.revokeObjectURL(url);
          alert('Файл access-codes.json скачан. Закоммитьте его в репозиторий.\n\nЛибо откройте GitHub → Actions → Manage Codes → Run workflow → Mode: deactivate → введите хеш: ' + hash);
          location.reload();
        });
    };
  </script>
</body>
</html>
```

- [ ] **Step 2: Verify**

Login with admin code → click "Управление кодами" → should see admin panel. Generate a code → should show plaintext code + hash. Click deactivate → should download updated JSON.

- [ ] **Step 3: Commit**

```bash
git add admin.html
git commit -m "feat: add admin panel for code generation and management"
```

---

### Task 7: Create `.github/workflows/manage-codes.yml`

**Files:**
- Create: `.github/workflows/manage-codes.yml`

- [ ] **Step 1: Create workflow file**

Create `.github/workflows/manage-codes.yml`:

```yaml
name: Manage Access Codes

on:
  workflow_dispatch:
    inputs:
      mode:
        description: 'Action mode'
        required: true
        default: 'add'
        type: choice
        options:
          - add
          - deactivate
      code:
        description: 'Plaintext code (for add mode)'
        required: false
        type: string
      type:
        description: 'Access type (for add mode)'
        required: false
        type: choice
        options:
          - demo
          - full
          - admin
      label:
        description: 'Student label (for add mode)'
        required: false
        type: string
      expires_in:
        description: 'Expiration (e.g. P1Y, P1M, or empty for never)'
        required: false
        default: ''
        type: string
      hash:
        description: 'SHA-256 hash to deactivate (for deactivate mode)'
        required: false
        type: string

jobs:
  manage-codes:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4

      - name: Add code
        if: inputs.mode == 'add'
        run: |
          HASH=$(echo -n "${{ inputs.code }}" | sha256sum | cut -d' ' -f1)
          EXPIRES_LINE=""
          if [ -n "${{ inputs.expires_in }}" ]; then
            EXPIRES_LINE=', "expires_in": "${{ inputs.expires_in }}"'
          else
            EXPIRES_LINE=', "expires_in": null'
          fi
          jq --argjson entry "{
            \"hash\": \"$HASH\",
            \"type\": \"${{ inputs.type }}\",
            \"label\": \"${{ inputs.label }}\",
            \"active\": true,
            \"created_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
          }" '. + [$entry]' data/access-codes.json > tmp.json && mv tmp.json data/access-codes.json

      - name: Deactivate code
        if: inputs.mode == 'deactivate'
        run: |
          jq '(.[] | select(.hash | startswith("${{ inputs.hash }}")) | .active) = false' data/access-codes.json > tmp.json && mv tmp.json data/access-codes.json

      - name: Commit and push
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add data/access-codes.json
          git commit -m "chore: update access codes (${{ inputs.mode }})" || echo "No changes to commit"
          git push
```

- [ ] **Step 2: Verify workflow syntax**

Check the workflow file is valid YAML. Verify `jq` commands are correct for the JSON structure.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/manage-codes.yml
git commit -m "feat: add GitHub Actions workflow for code management"
```

---

### Task 8: Modify `css/style.css` — auth styles

**Files:**
- Modify: `css/style.css`

- [ ] **Step 1: Add auth and admin CSS rules**

Append to `css/style.css`:

```css
/* Auth */
.auth-card {
  max-width: 400px;
  margin: 60px auto;
  padding: 32px;
  background: #fff;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
.auth-input {
  width: 100%;
  padding: 12px;
  margin: 8px 0;
  border: 2px solid var(--gray);
  border-radius: 8px;
  font-size: 16px;
  box-sizing: border-box;
}
.auth-input:focus {
  outline: none;
  border-color: var(--primary);
}
.auth-error {
  background: #fee;
  color: #c00;
  padding: 8px 12px;
  border-radius: 8px;
  margin: 8px 0;
  font-size: 14px;
}

/* Locked dialogs */
.dialog-link--locked {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  margin: 4px 0;
  opacity: 0.5;
  cursor: not-allowed;
  text-decoration: none;
  color: var(--gray-dark);
  border-radius: 8px;
}
.dialog-link--locked .status.locked {
  font-size: 16px;
}
select.auth-input {
  cursor: pointer;
}

/* Admin panel */
.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.admin-table th {
  text-align: left;
  padding: 10px 12px;
  background: var(--gray);
  font-weight: 600;
  white-space: nowrap;
}
.admin-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--gray);
}
.admin-table tr:hover {
  background: #fef0e6;
}
```

- [ ] **Step 2: Commit**

```bash
git add css/style.css
git commit -m "style: add auth, locked dialog, and admin panel styles"
```

---

### Task 9: Verify end-to-end

- [ ] **Step 1: Check all files are tracked**

```bash
git status
```

Expected: all new/modified files tracked, nothing unexpected.

- [ ] **Step 2: Open index.html in browser**

Test:
1. See auth form (no course content visible)
2. Enter invalid code → see error message
3. Enter demo code → see only lesson 1 available, others locked (🔒)
4. Click lesson 1 → loads normally
5. Try lesson 2 URL directly → see "Доступ запрещён"
6. Logout → see auth form again
7. Enter admin code → all lessons available + admin link
8. Click admin link → admin panel loads

- [ ] **Step 3: Verify progress isolation**

1. With demo code, complete lesson 1 → progress saved
2. Logout, login with admin code → progress resets (different code hash → different localStorage key)
3. Logout, login with demo code again → progress from step 1 preserved
