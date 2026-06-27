### Task 4: Modify `index.html` — auth UI + lesson gating

**Files:**
- Modify: `index.html`

**Goal:** Add code authorization UI to the main page. Unauthenticated users see a code input form. Authenticated users see the course with lesson gating (demo → only lesson 1 unlocked).

**Interfaces:**
- Consumes: `AUTH` from `js/auth.js`, `Progress` from `js/progress.js`

**Steps:**

- [ ] **Step 1: Add auth.js script before progress.js**

Change the script order. Before the existing script tags, add:
```html
<script src="js/auth.js"></script>
```

The full script section should be:
```html
  <script src="js/auth.js"></script>
  <script src="js/progress.js"></script>
  <script src="js/speech.js"></script>
  <script src="js/app.js"></script>
  <script>
    // inline script with auth logic (Step 3)
  </script>
```

- [ ] **Step 2: Add auth-section HTML after main opening, before progress-summary**

Replace the entire `<main>` content. The auth section goes BEFORE the progress-summary div:

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
      <div id="progress-summary" style="text-align:center;margin-bottom:24px">
        <p style="font-size:14px;color:var(--gray-dark)">Прогресс: <span id="progress-text">0</span> из <span id="total-text">55</span> диалогов</p>
        <div class="progress-bar" style="margin-top:8px">
          <div id="progress-fill" class="progress-bar-fill" style="width:0%"></div>
        </div>
      </div>

      <div id="course-content">
        <p style="text-align:center;color:var(--gray-dark);padding:40px">Загрузка...</p>
      </div>
    </div>
  </main>
```

- [ ] **Step 3: Add admin link to the header**

Add the admin link after the existing header content:
```html
  <header class="header">
    <div class="container header-inner">
      <div>
        <h1>🇪🇸 Español en Diálogos</h1>
        <p style="opacity:0.8;margin-top:4px">Интерактивный курс испанского языка по книге «Испанский в диалогах»</p>
        <a id="admin-link" href="admin.html" style="color:#fff;font-size:14px;display:none;margin-top:4px">⚙ Управление кодами</a>
      </div>
      <a href="https://xn--80aaagnrcpdkofpu2ae0iuf.xn--p1ai/" target="_blank" rel="noopener"><img src="logo.png" alt="Español en Diálogos" class="header-logo"></a>
    </div>
  </header>
```

- [ ] **Step 4: Replace inline script with auth-gated version**

Replace everything from the last `<script>` (after `app.js`) to `</body>` with:

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

Key behaviors:
- Not authenticated: auth form shown, course hidden
- Demo authenticated: course shown, only lesson 1 clickable, others locked 🔒
- Full authenticated: all lessons clickable
- Admin authenticated: all lessons + "Управление кодами" link visible
- Enter key on code input triggers activation
- Logout clears input field

- [ ] **Step 5: Verify the file is valid HTML**
- [ ] **Step 6: Commit**
