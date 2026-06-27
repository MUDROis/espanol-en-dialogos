# Auth System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) for syntax tracking.

**Goal:** Add Supabase-based individual authorization with demo/full access tiers to the Spanish course.

**Architecture:** Thin auth layer — Supabase JS SDK (CDN) + `js/auth.js` module. On `index.html`: inline script handles auth UI. On `lesson.html`: `js/app.js` guards access before loading content. New `enrollments` table in existing Supabase project. Progress isolated per user via `espanol_progress_{user_id}` key.

**Tech Stack:** Supabase (Auth + PostgreSQL), Supabase JS SDK v2 (CDN), Vanilla JS

## Global Constraints

- Supabase project URL: `https://hsxnjgvcvdvjzgxzztov.supabase.co`
- No build tools — CDN-based Supabase SDK only
- Minimal changes to existing course JavaScript
- localStorage key changes from `espanol_progress` to `espanol_progress_{user_id}`

---

### Task 1: Supabase — Create enrollments table + RLS

**Files:** Database migration (no project files)

- [ ] **Step 1: Create enrollments table**

```sql
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  access_type text not null default 'demo' check (access_type in ('demo', 'full')),
  access_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.enrollments enable row level security;
```

- [ ] **Step 2: Create RLS policies**

```sql
create policy "Users read own enrollment"
  on public.enrollments for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own enrollment"
  on public.enrollments for insert
  to authenticated
  with check (auth.uid() = user_id);
```

- [ ] **Step 3: Create auto-enrollment trigger**

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.enrollments (user_id, email, access_type)
  values (new.id, new.email, 'demo');
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
```

---

### Task 2: Create `js/auth.js`

**Files:**
- Create: `js/auth.js`

Contains: Supabase client init, login/register/logout, enrollment check, `canAccessLesson(id)`, `onChange` listener subscription.

<details>
<summary>Content</summary>

```javascript
/* js/auth.js */
const AUTH = (() => {
  const SUPABASE_URL = 'https://hsxnjgvcvdvjzgxzztov.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzeG5qZ3ZjdmR2anpneHp6dG92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2ODYzMTYsImV4cCI6MjA5NjI2MjMxNn0.2pw3uKMHRl8l9PAsrGOsk-MnuZtZ-ZwV-tFgg5glIWA';

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  let currentUser = null;
  let currentEnrollment = null;
  let authListeners = [];
  let initialized = false;

  function notify() {
    authListeners.forEach(fn => fn(currentUser, currentEnrollment));
  }

  async function loadEnrollment() {
    if (!currentUser) { currentEnrollment = null; return; }
    const { data } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', currentUser.id)
      .single();
    currentEnrollment = data || null;
  }

  return {
    async init() {
      if (initialized) return;
      initialized = true;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        currentUser = session.user;
        await loadEnrollment();
      }
      notify();

      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          currentUser = session.user;
          await loadEnrollment();
        } else if (event === 'SIGNED_OUT') {
          currentUser = null;
          currentEnrollment = null;
        }
        notify();
      });
    },

    getUser() { return currentUser; },
    getEnrollment() { return currentEnrollment; },
    isAuthenticated() { return !!currentUser; },

    canAccessLesson(lessonId) {
      if (!currentEnrollment) return false;
      if (currentEnrollment.access_type === 'full') {
        if (currentEnrollment.access_expires_at) {
          return new Date(currentEnrollment.access_expires_at) > new Date();
        }
        return true;
      }
      if (currentEnrollment.access_type === 'demo') {
        return lessonId === 1;
      }
      return false;
    },

    async register(email, password) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      return { data, error };
    },

    async login(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      return { data, error };
    },

    async logout() {
      await supabase.auth.signOut();
    },

    onChange(fn) {
      authListeners.push(fn);
      if (currentUser !== null) {
        setTimeout(() => fn(currentUser, currentEnrollment), 0);
      }
      return () => { authListeners = authListeners.filter(f => f !== fn); };
    },

    getAccessType() {
      return currentEnrollment ? currentEnrollment.access_type : null;
    }
  };
})();
```
</details>

---

### Task 3: Modify `js/progress.js` — per-user progress key

**Files:**
- Modify: `js/progress.js`

Replace `STORAGE_KEY: 'espanol_progress'` with a dynamic key based on user ID:

```javascript
/* js/progress.js */
const Progress = {
  _getKey() {
    const user = typeof AUTH !== 'undefined' ? AUTH.getUser() : null;
    const suffix = user ? user.id : 'anonymous';
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

---

### Task 4: Modify `index.html` — auth UI + lesson gating

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add Supabase SDK + auth.js CDN scripts**

Add before `js/progress.js`:

```html
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="js/auth.js"></script>
```

- [ ] **Step 2: Add auth-section HTML after the header, before progress-summary**

```html
      <div id="auth-section" class="container" style="display:none">
        <div class="auth-card">
          <div id="auth-form-area">
            <h2 id="auth-title">Вход в курс</h2>
            <div id="auth-error" class="auth-error" style="display:none"></div>
            <input type="email" id="auth-email" class="auth-input" placeholder="Email">
            <input type="password" id="auth-password" class="auth-input" placeholder="Пароль">
            <button id="auth-submit" class="btn btn-primary" style="width:100%">Войти</button>
            <p style="text-align:center;margin-top:12px;font-size:14px">
              <a href="#" id="auth-toggle" style="color:var(--primary)">Зарегистрироваться</a>
            </p>
            <p style="text-align:center;margin-top:8px;font-size:14px;color:var(--gray-dark)">
              После регистрации сразу откроется демо-доступ к уроку 1
            </p>
          </div>
          <div id="auth-user-area" style="display:none">
            <p style="text-align:center">Вы вошли как <strong id="auth-user-email"></strong></p>
            <p style="text-align:center;font-size:14px;color:var(--gray-dark)" id="auth-access-info"></p>
            <button id="auth-logout" class="btn btn-secondary" style="width:100%">Выйти</button>
          </div>
        </div>
      </div>
```

- [ ] **Step 3: Replace inline script with auth-gated version**

Replace the existing inline `<script>` block (lines 43-93) with the gated version that checks auth state and locks non-demo lessons.

- [ ] **Step 4: Add auth CSS to `css/style.css`**

```css
.auth-card {
  max-width: 400px;
  margin: 60px auto;
  padding: 32px;
  background: var(--white);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}
.auth-input {
  width: 100%;
  padding: 12px;
  margin: 8px 0;
  border: 1px solid var(--gray);
  border-radius: 8px;
  font-size: 16px;
  box-sizing: border-box;
}
.auth-error {
  background: #fee;
  color: #c00;
  padding: 8px 12px;
  border-radius: 8px;
  margin: 8px 0;
  font-size: 14px;
}
.dialog-link--locked {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  opacity: 0.5;
  cursor: not-allowed;
  text-decoration: none;
  color: var(--gray-dark);
}
.status.locked {
  font-size: 16px;
}
```

---

### Task 5: Modify `lesson.html` + `js/app.js` — lesson access guard

**Files:**
- Modify: `lesson.html`
- Modify: `js/app.js`

- [ ] **Step 1: Add Supabase SDK + auth.js scripts in lesson.html**

Same as index.html — add before `js/progress.js`.

- [ ] **Step 2: Modify `js/app.js` to init auth and check access on lesson.html**

Wrap the existing dialog loading logic with auth init and access check. When the page is `lesson.html`, init auth, verify access, then load dialog or show access denied.

---

### Task 6: Get Supabase project API keys from MCP

- [ ] **Step 1: Get the publishable anon key**

Use the MCP tool to get the anon key that's already referenced in `auth.js`.

---

### Task 7: Verify end-to-end flow

- [ ] **Step 1: Run `git status` and `git diff` to review all changes**
- [ ] **Step 2: Open index.html locally and test:**
  - Unauthenticated → see login form
  - Register → demo access → only lesson 1 clickable
  - Logout → login again → progress preserved
  - Lesson 2 URL → redirected/rejected for demo
