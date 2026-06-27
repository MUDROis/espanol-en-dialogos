# Español en Diálogos — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build landing page + full interactive lesson for Dialogue 1 (Javier conoce a Ana)

**Architecture:** Hybrid static site — `index.html` is the landing page, `lesson.html?id=1` loads `dialog-01.json` and renders all 7 lesson steps client-side. Progress saved to localStorage. Audio via Web Speech API (TTS + SpeechRecognition).

**Tech Stack:** Vanilla HTML/CSS/JS, GitHub Pages, Web Speech API, localStorage

## Global Constraints

- No build tools, no npm, no external dependencies
- All exercises must work without a server (static files only)
- Must work in Chrome/Edge (for SpeechRecognition); basic read/quiz in all browsers
- Mobile-responsive (flexbox/grid, no horizontal scroll)
- Russian interface for instructions, Spanish for dialogue content
- No placeholder/TODO code — every exercise type must be fully functional

---

### Task 1: Project scaffolding + CSS design system

**Files:**
- Create: `index.html`
- Create: `lesson.html`
- Create: `css/style.css`
- Create: `js/app.js`
- Create: `js/progress.js`
- Create: `js/speech.js`
- Create: `js/games.js`
- Create: `js/lesson-player.js`
- Create: `data/dialogs.json`
- Create: `data/dialog-01.json`
- Create: `.gitignore`

**Interfaces:**
- Consumes: nothing
- Produces: file structure, CSS variables & reset, base layout

- [ ] **Step 1: Create empty project files and .gitignore**

Create all files listed above with minimal boilerplate. `.gitignore` with:
```
.DS_Store
Thumbs.db
*.log
```

- [ ] **Step 2: Write CSS design system**

```css
/* style.css */

:root {
  --primary: #E63946;
  --primary-hover: #d12e3b;
  --bg: #FFF8F0;
  --accent: #F4A261;
  --text: #264653;
  --success: #2A9D8F;
  --error: #e76f51;
  --gray: #e9ecef;
  --gray-dark: #6c757d;
  --radius: 12px;
  --shadow: 0 2px 8px rgba(0,0,0,0.08);
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border: none;
  border-radius: var(--radius);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.btn-primary {
  background: var(--primary);
  color: #fff;
}
.btn-primary:hover { background: var(--primary-hover); }

.btn-secondary {
  background: var(--gray);
  color: var(--text);
}
.btn-secondary:hover { background: #d4d4d4; }

.btn-success {
  background: var(--success);
  color: #fff;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Cards */
.card {
  background: #fff;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 24px;
}

/* Progress bar */
.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--gray);
  border-radius: 4px;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  background: var(--success);
  transition: width 0.3s ease;
}

/* Step indicator */
.step-indicator {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin: 20px 0;
}
.step-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--gray);
  transition: background 0.3s;
}
.step-dot.active { background: var(--primary); }
.step-dot.done { background: var(--success); }

/* Grid layouts */
.two-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* Responsive */
@media (max-width: 768px) {
  .two-column { grid-template-columns: 1fr; }
  .container { padding: 0 12px; }
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.fade-in { animation: fadeIn 0.3s ease; }

/* Vocabulary cards */
.vocab-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border: 1px solid var(--gray);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.vocab-card:hover { border-color: var(--primary); }
.vocab-card .es { font-weight: 600; }
.vocab-card .ru { color: var(--gray-dark); }

/* Dialogue lines */
.dialogue-line {
  display: grid;
  grid-template-columns: 100px 1fr 1fr;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid var(--gray);
  align-items: start;
}
.dialogue-line .speaker { font-weight: 700; color: var(--primary); }
.dialogue-line .es { font-style: italic; }
.dialogue-line .ru { color: var(--gray-dark); }

/* Memory game */
.memory-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.memory-column { display: flex; flex-direction: column; gap: 8px; }
.memory-item {
  padding: 12px 16px;
  background: #fff;
  border: 2px solid var(--gray);
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
  user-select: none;
}
.memory-item:hover { border-color: var(--accent); }
.memory-item.selected { border-color: var(--primary); background: #fff0f0; }
.memory-item.matched { border-color: var(--success); background: #f0fff4; opacity: 0.6; cursor: default; }
.memory-item.wrong { border-color: var(--error); animation: shake 0.3s; }

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

/* Quiz */
.quiz-option {
  display: block;
  width: 100%;
  padding: 12px 16px;
  margin: 8px 0;
  background: #fff;
  border: 2px solid var(--gray);
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  font-size: 16px;
  transition: all 0.2s;
}
.quiz-option:hover { border-color: var(--accent); }
.quiz-option.selected { border-color: var(--primary); background: #fff0f0; }
.quiz-option.correct { border-color: var(--success); background: #f0fff4; }
.quiz-option.incorrect { border-color: var(--error); background: #fff0f0; }

/* Create dialogue */
.create-dialogue-field {
  margin: 16px 0;
}
.create-dialogue-field label {
  display: block;
  margin-bottom: 4px;
  font-weight: 600;
}
.create-dialogue-field input {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid var(--gray);
  border-radius: 8px;
  font-size: 16px;
}
.create-dialogue-field input:focus {
  outline: none;
  border-color: var(--primary);
}

/* Header */
.header {
  background: var(--primary);
  color: #fff;
  padding: 16px 0;
  margin-bottom: 24px;
}
.header h1 { font-size: 20px; }
.header a { color: #fff; text-decoration: none; }

/* Part card on landing */
.part-card {
  background: #fff;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  margin-bottom: 16px;
  overflow: hidden;
}
.part-header {
  padding: 16px 24px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg);
  border-bottom: 1px solid var(--gray);
  font-weight: 700;
  font-size: 18px;
}
.part-header:hover { background: #fef0e6; }
.part-body { padding: 8px 24px 16px; }

/* Dialog link */
.dialog-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  margin: 4px 0;
  border-radius: 8px;
  text-decoration: none;
  color: var(--text);
  transition: background 0.2s;
}
.dialog-link:hover { background: #fef0e6; }
.dialog-link .status {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}
.dialog-link .status.locked { background: var(--gray); color: var(--gray-dark); }
.dialog-link .status.available { background: var(--accent); color: #fff; content: "→"; }
.dialog-link .status.done { background: var(--success); color: #fff; content: "✓"; }

/* Nav buttons */
.nav-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--gray);
}

/* Fill gap */
.gap-sentence {
  font-size: 18px;
  margin: 12px 0;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
}
.gap-sentence select {
  padding: 4px 8px;
  font-size: 16px;
  border: 2px solid var(--gray);
  border-radius: 6px;
  margin: 0 4px;
}
.gap-sentence select.correct { border-color: var(--success); }
.gap-sentence select.incorrect { border-color: var(--error); }

/* Score display */
.score-display {
  text-align: center;
  padding: 32px;
}
.score-display .score-number {
  font-size: 64px;
  font-weight: 800;
  color: var(--primary);
}
.score-display .score-label {
  font-size: 18px;
  color: var(--gray-dark);
}

/* Recording button */
.record-btn {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 4px solid var(--primary);
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  margin: 16px auto;
}
.record-btn.recording {
  background: var(--error);
  border-color: var(--error);
  animation: pulse 1s infinite;
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
.record-btn .icon { font-size: 32px; }

/* Shadowing */
.shadowing-phrase {
  font-size: 24px;
  text-align: center;
  padding: 24px;
  margin: 16px 0;
  background: #fff;
  border-radius: var(--radius);
  border: 2px solid var(--gray);
}
```

- [ ] **Step 3: Verify CSS loads**
Open `index.html` in browser, confirm body background is `#FFF8F0`.

---

### Task 2: Progress module (progress.js)

**Files:**
- Modify: `js/progress.js`

**Interfaces:**
- Consumes: nothing
- Produces: `Progress.get(dialogId)` → `{ completed, score, lastStep }`, `Progress.set(dialogId, data)`, `Progress.getAll()` → `{ [dialogId]: ... }`, `Progress.getStats()` → `{ total, completed }`

- [ ] **Step 1: Write progress.js**

```javascript
/* js/progress.js */
const Progress = {
  STORAGE_KEY: 'espanol_progress',

  _load() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  },

  _save(data) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
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

- [ ] **Step 2: Test manually**
Open browser console, run:
```javascript
Progress.set('dialog-1', { completed: true, score: 85, lastStep: 7 });
console.log(Progress.get('dialog-1')); // { completed: true, score: 85, lastStep: 7 }
console.log(Progress.getStats()); // { total: 1, completed: 1 }
Progress.set('dialog-1', { completed: false });
console.log(Progress.get('dialog-1').completed); // false
```

---

### Task 3: Speech module (speech.js)

**Files:**
- Modify: `js/speech.js`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `Speech.say(text, lang, rate)` — TTS
  - `Speech.getVoice(lang)` — returns available voice for lang
  - `Speech.recognize(expectedText, callback)` — starts mic, calls `callback(matchPercent, recognizedText)`
  - `Speech.isSupported` — bool
  - `Speech.isRecognitionSupported` — bool

- [ ] **Step 1: Write speech.js**

```javascript
/* js/speech.js */
const Speech = {
  isSupported: 'speechSynthesis' in window,
  isRecognitionSupported: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,

  getVoice(lang) {
    const voices = speechSynthesis.getVoices();
    // Prefer a voice matching the language
    return voices.find(v => v.lang.startsWith(lang)) || voices[0] || null;
  },

  say(text, lang = 'es-ES', rate = 0.9) {
    return new Promise((resolve) => {
      if (!this.isSupported) { resolve(); return; }
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.onend = resolve;
      utterance.onerror = resolve;
      speechSynthesis.speak(utterance);
    });
  },

  recognize(expectedText, callback) {
    if (!this.isRecognitionSupported) {
      callback(null, 'Распознавание не поддерживается в этом браузере');
      return;
    }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognizer = new Recognition();
    recognizer.lang = 'es-ES';
    recognizer.interimResults = false;
    recognizer.maxAlternatives = 3;

    recognizer.onresult = (event) => {
      const results = event.results[0];
      const topText = results[0].transcript.toLowerCase().trim();
      const confidence = results[0].confidence;

      // Calculate word match
      const expectedWords = expectedText.toLowerCase().split(/\s+/);
      const recognizedWords = topText.split(/\s+/);
      const matched = expectedWords.filter(w => recognizedWords.some(rw => rw.includes(w) || w.includes(rw)));
      const percent = expectedWords.length > 0 ? Math.round((matched.length / expectedWords.length) * 100) : 0;

      callback(percent, topText);
    };

    recognizer.onerror = () => {
      callback(null, 'Ошибка микрофона. Разрешите доступ к микрофону.');
    };

    recognizer.start();
  }
};
```

- [ ] **Step 2: Pre-load voices**
In `app.js`, add voice pre-loading:
```javascript
if (Speech.isSupported) {
  speechSynthesis.getVoices(); // Trigger loading
  speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
}
```

- [ ] **Step 3: Test TTS**
```javascript
Speech.say('Hola, ¿qué tal?', 'es-ES');
// Should hear Spanish voice saying "Hola, ¿qué tal?"
```

---

### Task 4: App shell + lesson player scaffold

**Files:**
- Modify: `js/app.js`
- Modify: `js/lesson-player.js`

**Interfaces:**
- Consumes: `Progress`, `Speech`, dialog JSON data
- Produces: `LessonPlayer.init(dialogData)` — renders step 1, handles nav; `App.init()` — router
- `App.renderStep(dialog, stepIndex)` → renders appropriate exercise HTML into `#app` container

- [ ] **Step 1: Write app.js (router)**

```javascript
/* js/app.js */
document.addEventListener('DOMContentLoaded', () => {
  // Pre-load speech voices
  if (Speech.isSupported) {
    speechSynthesis.getVoices();
    speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
  }

  // Simple router
  const params = new URLSearchParams(window.location.search);
  const dialogId = params.get('id');

  if (window.location.pathname.endsWith('lesson.html') && dialogId) {
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

- [ ] **Step 2: Write lesson.html**

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Español en Diálogos — Урок</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <header class="header">
    <div class="container">
      <a href="index.html">← Español en Diálogos</a>
      <h1 id="lesson-title">Урок</h1>
    </div>
  </header>

  <main>
    <div class="container">
      <div id="step-indicator" class="step-indicator"></div>
      <div id="step-title" style="font-size:24px;font-weight:700;margin-bottom:16px"></div>
    </div>
    <div id="app"></div>
    <div class="container">
      <div id="nav-buttons" class="nav-buttons"></div>
    </div>
  </main>

  <footer style="text-align:center;padding:24px;color:var(--gray-dark);font-size:14px">
    <p>Español en Diálogos — интерактивный курс испанского</p>
  </footer>

  <script src="js/progress.js"></script>
  <script src="js/speech.js"></script>
  <script src="js/games.js"></script>
  <script src="js/lesson-player.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 3: Write lesson-player.js (step definitions + navigation)**

```javascript
/* js/lesson-player.js */
const LessonPlayer = {
  dialog: null,
  currentStep: 0,
  steps: [],

  init(dialog) {
    this.dialog = dialog;
    const saved = Progress.get(`dialog-${dialog.id}`);
    this.currentStep = saved.lastStep || 0;

    document.getElementById('lesson-title').textContent = `${dialog.id}. ${dialog.title}`;

    this.steps = [
      { id: 'preparation', title: 'Подготовка', render: this.renderPreparation },
      { id: 'vocabulary', title: 'Словарный запас', render: this.renderVocabulary },
      { id: 'grammar', title: 'Грамматика', render: this.renderGrammar },
      { id: 'dialogue', title: 'Диалог', render: this.renderDialogue },
      { id: 'speaking', title: 'Практика говорения', render: this.renderSpeaking },
      { id: 'test', title: 'Тестирование', render: this.renderTest },
      { id: 'reflection', title: 'Рефлексия', render: this.renderReflection }
    ];

    this.goToStep(this.currentStep);
  },

  goToStep(index) {
    if (index < 0) index = 0;
    if (index >= this.steps.length) {
      // Lesson complete
      Progress.set(`dialog-${this.dialog.id}`, { completed: true, lastStep: this.steps.length - 1 });
      return;
    }
    this.currentStep = index;
    Progress.set(`dialog-${this.dialog.id}`, { lastStep: index });
    this.renderStepIndicator();
    this.renderStepContent();
  },

  renderStepIndicator() {
    const container = document.getElementById('step-indicator');
    container.innerHTML = this.steps.map((step, i) =>
      `<div class="step-dot ${i < this.currentStep ? 'done' : ''} ${i === this.currentStep ? 'active' : ''}"></div>`
    ).join('');
  },

  renderStepContent() {
    const step = this.steps[this.currentStep];
    document.getElementById('step-title').textContent = `Шаг ${this.currentStep + 1}: ${step.title}`;
    step.render.call(this);

    // Navigation buttons
    const nav = document.getElementById('nav-buttons');
    nav.innerHTML = `
      ${this.currentStep > 0 ? '<button class="btn btn-secondary" onclick="LessonPlayer.goToStep(LessonPlayer.currentStep - 1)">← Назад</button>' : '<div></div>'}
      ${this.currentStep < this.steps.length - 1
        ? '<button class="btn btn-primary" onclick="LessonPlayer.goToStep(LessonPlayer.currentStep + 1)">Далее →</button>'
        : '<button class="btn btn-success" onclick="LessonPlayer.finishLesson()">Завершить урок ✓</button>'
      }
    `;
  },

  finishLesson() {
    Progress.set(`dialog-${this.dialog.id}`, { completed: true, lastStep: this.steps.length - 1 });
    window.location.href = 'index.html';
  },

  // --- Step renderers (filled in Tasks 5-10) ---
  renderPreparation() { /* Task 5 */ },
  renderVocabulary() { /* Task 6 */ },
  renderGrammar() { /* Task 7 */ },
  renderDialogue() { /* Task 8 */ },
  renderSpeaking() { /* Task 9 */ },
  renderTest() { /* Task 10 */ },
  renderReflection() { /* Task 11 */ }
};
```

- [ ] **Step 4: Test manually**
Open `lesson.html?id=1` in browser. Should show "Загрузка...", then "Шаг 1: Подготовка" with empty content and nav buttons. Click "Далее" → goes to step 2 with step dots updating.

---

### Task 5: Landing page (index.html)

**Files:**
- Modify: `index.html`
- Create: `data/dialogs.json`

- [ ] **Step 1: Write dialogs.json (metadata)**

```json
[
  {
    "id": 1,
    "title": "Javier conoce a Ana",
    "titleRu": "Хавьер знакомится с Анной",
    "part": 1,
    "partTitle": "Базовый уровень (A2)",
    "level": "A2",
    "theme": "Presentaciones"
  }
]
```

- [ ] **Step 2: Write index.html**

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Español en Diálogos — интерактивный курс испанского</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <header class="header">
    <div class="container">
      <h1>🇪🇸 Español en Diálogos</h1>
      <p style="opacity:0.8;margin-top:4px">Интерактивный курс испанского языка по книге «Испанский в диалогах»</p>
    </div>
  </header>

  <main>
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

  <footer style="text-align:center;padding:24px;color:var(--gray-dark);font-size:14px">
    <p>На основе книги «Испанский в диалогах» (55 диалогов, уровни A2–C1)</p>
  </footer>

  <script src="js/progress.js"></script>
  <script src="js/app.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', async () => {
      const resp = await fetch('data/dialogs.json');
      const dialogs = await resp.json();

      const stats = Progress.getStats();

      // Group by part
      const parts = {};
      for (const d of dialogs) {
        const key = d.part;
        if (!parts[key]) {
          parts[key] = { part: key, title: d.partTitle, dialogs: [] };
        }
        parts[key].dialogs.push(d);
      }

      const total = 55;
      document.getElementById('total-text').textContent = total;
      document.getElementById('progress-text').textContent = stats.completed;
      const pct = total > 0 ? Math.round((stats.completed / total) * 100) : 0;
      document.getElementById('progress-fill').style.width = pct + '%';

      let html = '';
      for (const key of Object.keys(parts).sort((a,b) => a - b)) {
        const p = parts[key];
        const allLocked = p.dialogs.every(d => {
          const prog = Progress.get(`dialog-${d.id}`);
          return !prog.completed;
        });
        html += `
          <div class="part-card">
            <div class="part-header" onclick="this.nextElementSibling.classList.toggle('part-body--hidden')">
              <span>Parte ${romanize(p.part)}: ${p.title}</span>
              <span style="font-size:14px;color:var(--gray-dark)">${p.dialogs.length} диалогов</span>
            </div>
            <div class="part-body">
              ${p.dialogs.map(d => {
                const prog = Progress.get(`dialog-${d.id}`);
                let statusClass = 'available';
                let statusText = '→';
                if (prog.completed) { statusClass = 'done'; statusText = '✓'; }
                return `<a href="lesson.html?id=${d.id}" class="dialog-link">
                  <span>${d.id}. ${d.title}</span>
                  <span style="font-size:14px;color:var(--gray-dark)">${d.theme}</span>
                  <span class="status ${statusClass}">${statusText}</span>
                </a>`;
              }).join('')}
            </div>
          </div>`;
      }

      document.getElementById('course-content').innerHTML = html;
    });

    function romanize(num) {
      const map = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI' };
      return map[num] || num;
    }
  </script>
</body>
</html>
```

- [ ] **Step 3: Test manually**
Open `index.html`. Should see the header, progress bar, and "Parte I: Базовый уровень (A2)" with "1. Javier conoce a Ana". Click dialog → goes to `lesson.html?id=1`.

---

### Task 6: Preparation step + Vocabulary with Memory game

**Files:**
- Modify: `js/lesson-player.js` (renderPreparation, renderVocabulary)
- Modify: `js/games.js` (memory game)

- [ ] **Step 1: Write renderPreparation in lesson-player.js**

Replace the empty `renderPreparation()`:

```javascript
  renderPreparation() {
    const d = this.dialog;
    const app = document.getElementById('app');
    app.className = 'container';
    app.innerHTML = `
      <div class="card fade-in">
        <h2>🎯 Добро пожаловать в урок!</h2>
        <p style="margin:12px 0">Сегодня вы научитесь <strong>знакомиться на испанском</strong>.
        Представьте: вы на языковых курсах в Малаге и встречаете нового друга...</p>

        <h3 style="margin:20px 0 8px">Цели урока:</h3>
        <ul style="list-style:none">
          ${d.objectives.map(o => `<li style="padding:4px 0">✅ ${o}</li>`).join('')}
        </ul>

        <div style="margin-top:20px;padding:16px;background:var(--gray);border-radius:8px;font-size:14px">
          📖 <strong>Диалог:</strong> ${d.title} (${d.titleRu})<br>
          📚 <strong>Уровень:</strong> ${d.level} &nbsp;|&nbsp; 📂 <strong>Тема:</strong> ${d.theme}
        </div>

        <button class="btn btn-primary" style="margin-top:16px" onclick="LessonPlayer.goToStep(LessonPlayer.currentStep + 1)">
          Начать урок →
        </button>
      </div>
    `;
  }
```

- [ ] **Step 2: Write Memory game in games.js**

```javascript
/* js/games.js */
const Games = {
  memoryState: {},

  memoryGame(containerId, pairs) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const stateId = 'memory_' + Date.now();
    this.memoryState[stateId] = {
      pairs,
      selected: null, // 'es' or 'ru' index
      selectedEs: null,
      selectedRu: null,
      matched: new Set()
    };
    const state = this.memoryState[stateId];

    container.innerHTML = `
      <p style="margin-bottom:16px;color:var(--gray-dark)">Кликните на испанское слово, затем на его перевод</p>
      <div class="memory-grid">
        <div class="memory-column" id="memory-es-${stateId}">
          <h3 style="font-size:14px;color:var(--gray-dark);margin-bottom:8px">Español</h3>
          ${pairs.map((p, i) => `<div class="memory-item" data-id="${i}" data-side="es" data-key="${i}">${p.es}</div>`).join('')}
        </div>
        <div class="memory-column" id="memory-ru-${stateId}">
          <h3 style="font-size:14px;color:var(--gray-dark);margin-bottom:8px">Русский</h3>
          ${pairs.map((p, i) => `<div class="memory-item" data-id="${i}" data-side="ru" data-key="${i}">${p.ru}</div>`).join('')}
        </div>
      </div>
      <div id="memory-status-${stateId}" style="text-align:center;margin-top:12px;font-weight:600">
        Найдено пар: 0 / ${pairs.length}
      </div>
    `;

    // Event delegation
    container.querySelectorAll('.memory-item').forEach(el => {
      el.addEventListener('click', () => {
        const side = el.dataset.side;
        const key = parseInt(el.dataset.key);
        const id = parseInt(el.dataset.id);

        if (state.matched.has(id)) return;

        if (side === 'es') {
          // Deselect previous ES
          container.querySelectorAll('.memory-item[data-side="es"]').forEach(e => e.classList.remove('selected'));
          el.classList.add('selected');
          state.selectedEs = id;

          // Check if both selected
          if (state.selectedRu !== null) {
            this.checkMemoryMatch(stateId, container);
          }
        } else {
          container.querySelectorAll('.memory-item[data-side="ru"]').forEach(e => e.classList.remove('selected'));
          el.classList.add('selected');
          state.selectedRu = id;

          if (state.selectedEs !== null) {
            this.checkMemoryMatch(stateId, container);
          }
        }
      });
    });
  },

  checkMemoryMatch(stateId, container) {
    const state = this.memoryState[stateId];
    if (state.selectedEs === null || state.selectedRu === null) return;

    const isMatch = state.selectedEs === state.selectedRu;
    const esEl = container.querySelector(`.memory-item[data-side="es"][data-id="${state.selectedEs}"]`);
    const ruEl = container.querySelector(`.memory-item[data-side="ru"][data-id="${state.selectedRu}"]`);

    if (isMatch) {
      state.matched.add(state.selectedEs);
      esEl.classList.remove('selected');
      ruEl.classList.remove('selected');
      esEl.classList.add('matched');
      ruEl.classList.add('matched');
    } else {
      esEl.classList.remove('selected');
      ruEl.classList.remove('selected');
      esEl.classList.add('wrong');
      ruEl.classList.add('wrong');
      setTimeout(() => {
        esEl.classList.remove('wrong');
        ruEl.classList.remove('wrong');
      }, 400);
    }

    state.selectedEs = null;
    state.selectedRu = null;

    const status = document.getElementById(`memory-status-${stateId}`);
    if (status) {
      status.textContent = `Найдено пар: ${state.matched.size} / ${state.pairs.length}`;
      if (state.matched.size === state.pairs.length) {
        status.innerHTML = '🎉 Все пары найдены!';
        // Auto-advance after 1.5s
        setTimeout(() => LessonPlayer.goToStep(LessonPlayer.currentStep + 1), 1500);
      }
    }
  }
};
```

- [ ] **Step 3: Write renderVocabulary in lesson-player.js**

```javascript
  renderVocabulary() {
    const d = this.dialog;
    const app = document.getElementById('app');
    app.className = 'container';

    // Collect all vocab items
    const allVocab = [];
    Object.values(d.vocabulary).forEach(group => {
      group.forEach(item => allVocab.push(item));
    });

    app.innerHTML = `
      <div class="card fade-in">
        <h2>📖 ${d.vocabulary.greetings ? d.vocabulary.greetings.map(v => v.es).join(' · ') : ''}</h2>
        <p style="margin:8px 0 16px;color:var(--gray-dark)">Слушайте и повторяйте вслух!</p>
        <div class="two-column">
          ${allVocab.map((v, i) => `
            <div class="vocab-card" onclick="Speech.say('${v.es.replace(/'/g, "\\'")}', 'es-ES')">
              <span class="es">${v.es}</span>
              <span class="ru">${v.ru}</span>
              <span style="font-size:12px;color:var(--accent);cursor:pointer">🔊</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card fade-in" style="margin-top:16px">
        <h3>🎮 Игра: Соедини пары</h3>
        <p style="margin:8px 0;color:var(--gray-dark)">Найди соответствие между испанским словом и переводом</p>
        <div id="memory-game"></div>
      </div>
    `;

    // Start memory game with first 8 items
    const pairs = allVocab.slice(0, 8);
    Games.memoryGame('memory-game', pairs);
  }
```

- [ ] **Step 4: Test manually**
Go to `lesson.html?id=1`, click "Далее" to step 2. See vocabulary cards with 🔊. Click 🔊 — TTS speaks. Play memory game — clicking ES then RU should match or show error.

---

### Task 7: Grammar step with Fill-Gap game

**Files:**
- Modify: `js/lesson-player.js` (renderGrammar)
- Modify: `js/games.js` (fillGap)

- [ ] **Step 1: Write fillGap in games.js**

```javascript
  fillGap(containerId, sentences) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = sentences.map((s, i) => `
      <div class="gap-sentence" data-index="${i}">
        ${s.text.replace('___', `<select data-index="${i}" class="gap-select">
          <option value="">—</option>
          ${s.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
        </select>`)}
        <span class="gap-result" style="margin-left:8px"></span>
      </div>
    `).join('') + `
      <button class="btn btn-primary" id="check-gaps" style="margin-top:12px">Проверить</button>
      <div id="gap-score" style="margin-top:8px;font-weight:600"></div>
    `;

    document.getElementById('check-gaps').addEventListener('click', () => {
      let correct = 0;
      sentences.forEach((s, i) => {
        const select = container.querySelector(`select[data-index="${i}"]`);
        const result = container.querySelector(`.gap-sentence[data-index="${i}"] .gap-result`);
        if (select.value === s.answer) {
          select.className = 'gap-select correct';
          result.textContent = '✓';
          result.style.color = 'var(--success)';
          correct++;
        } else {
          select.className = 'gap-select incorrect';
          result.textContent = `✗ (${s.answer})`;
          result.style.color = 'var(--error)';
        }
      });
      document.getElementById('gap-score').textContent = `Правильно: ${correct} из ${sentences.length}`;
    });
  }
```

- [ ] **Step 2: Write renderGrammar in lesson-player.js**

```javascript
  renderGrammar() {
    const d = this.dialog;
    const app = document.getElementById('app');
    app.className = 'container';

    app.innerHTML = `
      <div class="card fade-in">
        <h2>📚 Грамматика диалога</h2>

        ${Object.entries(d.grammar).map(([verb, forms]) => `
          <div style="margin:16px 0">
            <h3>Глагол <em>${verb}</em> (${verb === 'ser' ? 'быть' : verb === 'estar' ? 'находиться' : verb === 'llamarse' ? 'называться' : verb})</h3>
            <table style="width:100%;border-collapse:collapse;margin:8px 0">
              ${Object.entries(forms).map(([person, form]) => `
                <tr>
                  <td style="padding:6px 12px;border:1px solid var(--gray);font-weight:600">${person}</td>
                  <td style="padding:6px 12px;border:1px solid var(--gray)">${form}</td>
                </tr>
              `).join('')}
            </table>
            <button class="btn btn-secondary" style="font-size:14px" onclick="Speech.say('${Object.values(forms).join(' ').replace(/'/g, "\\'")}', 'es-ES')">
              🔊 Прослушать формы
            </button>
          </div>
        `).join('')}

        <div style="margin-top:24px">
          <p style="margin-bottom:8px;font-weight:600">💡 Запомните:</p>
          <p><strong>SER</strong> — для постоянных характеристик (национальность, профессия, имя)</p>
          <p><strong>ESTAR</strong> — для временных состояний и местоположения</p>
        </div>
      </div>

      <div class="card fade-in" style="margin-top:16px">
        <h3>🎮 Упражнение: Вставь правильную форму</h3>
        <div id="fill-gap"></div>
      </div>
    `;

    // Get grammar exercises from dialog data
    const grammarEx = d.exercises.find(e => e.type === 'fill-gap');
    if (grammarEx) {
      Games.fillGap('fill-gap', grammarEx.sentences);
    }
  }
```

- [ ] **Step 3: Test manually**
Go to step 3. See grammar tables with 🔊 buttons. Fill in forms, click "Проверить" → see correct/incorrect feedback.

---

### Task 8: Dialogue step (shadowing + roleplay)

**Files:**
- Modify: `js/lesson-player.js` (renderDialogue)
- Modify: `js/speech.js` (already done)
- Modify: `js/games.js` (shadowing + roleplay helpers)

- [ ] **Step 1: Write shadowing+roleplay helpers in games.js**

```javascript
  // Shadowing helper — show each line with TTS, record button
  shadowingPlayer(containerId, lines) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let currentIndex = 0;

    const renderLine = () => {
      const line = lines[currentIndex];
      container.innerHTML = `
        <div class="shadowing-phrase">${line.es}</div>
        <p style="text-align:center;color:var(--gray-dark)">${line.ru}</p>
        <div style="text-align:center;margin:16px 0">
          <button class="btn btn-primary" id="listen-btn">🔊 Слушать</button>
          <button class="btn btn-secondary" id="repeat-btn">🎤 Повторить</button>
        </div>
        <div id="shadowing-result" style="text-align:center"></div>
        <div style="text-align:center;margin-top:12px">
          <span style="color:var(--gray-dark)">${currentIndex + 1} / ${lines.length}</span>
        </div>
      `;

      document.getElementById('listen-btn').addEventListener('click', async () => {
        await Speech.say(line.es, 'es-ES');
      });

      document.getElementById('repeat-btn').addEventListener('click', () => {
        const resultDiv = document.getElementById('shadowing-result');
        resultDiv.innerHTML = '🎤 Говорите...';
        Speech.recognize(line.es, (percent, text) => {
          if (percent === null) {
            resultDiv.innerHTML = `<span style="color:var(--error)">${text}</span>`;
          } else {
            const grade = percent >= 80 ? 'Отлично!' : percent >= 50 ? 'Хорошо' : 'Попробуйте ещё';
            resultDiv.innerHTML = `
              <div>Распознано: ${percent}% (${grade})</div>
              <div style="font-size:14px;color:var(--gray-dark)">Вы сказали: "${text}"</div>
              ${percent < 80 ? '<button class="btn btn-secondary" style="margin-top:8px;font-size:14px" onclick="document.getElementById(\'repeat-btn\').click()">Повторить ещё</button>' : ''}
            `;
          }
        });
      });
    };

    renderLine();

    // Navigation within shadowing
    const navDiv = document.createElement('div');
    navDiv.style.cssText = 'display:flex;justify-content:space-between;margin-top:12px';
    navDiv.innerHTML = `
      <button class="btn btn-secondary" id="prev-line" ${currentIndex === 0 ? 'disabled' : ''}>← Назад</button>
      <button class="btn btn-primary" id="next-line" ${currentIndex === lines.length - 1 ? 'disabled' : ''}>Далее →</button>
    `;
    container.appendChild(navDiv);

    document.getElementById('prev-line')?.addEventListener('click', () => {
      if (currentIndex > 0) { currentIndex--; renderLine(); }
    });
    document.getElementById('next-line')?.addEventListener('click', () => {
      if (currentIndex < lines.length - 1) { currentIndex++; renderLine(); }
    });
  }
```

- [ ] **Step 2: Write renderDialogue in lesson-player.js**

```javascript
  renderDialogue() {
    const d = this.dialog;
    const app = document.getElementById('app');
    app.className = 'container';

    app.innerHTML = `
      <div class="card fade-in">
        <h2>💬 Диалог: ${d.title}</h2>
        <p style="margin:8px 0;color:var(--gray-dark)">Прочитайте диалог, затем переходите к упражнениям на говорение</p>
        <div style="margin:16px 0">
          <button class="btn btn-primary" onclick="Speech.say('${d.dialogue.map(l => l.es).join('. ').replace(/'/g, "\\'").replace(/"/g, '')}', 'es-ES')">
            🔊 Прослушать весь диалог
          </button>
        </div>
        <div id="dialogue-text">
          ${d.dialogue.map(line => `
            <div class="dialogue-line">
              <span class="speaker">${line.speaker}:</span>
              <span class="es">${line.es}</span>
              <span class="ru">${line.ru}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card fade-in" style="margin-top:16px">
        <h3>🎤 Shadowing — повторяй за диктором</h3>
        <p style="margin:8px 0;color:var(--gray-dark)">Слушай фразу, затем нажми "Повторить" и произнеси вслух</p>
        <div id="shadowing-player"></div>
      </div>
    `;

    // Shadowing for all dialogue lines
    Games.shadowingPlayer('shadowing-player', d.dialogue);
  }
```

- [ ] **Step 3: Test manually**
Go to step 4. See dialogue with built-by-line translation. Click "Прослушать весь диалог" → TTS reads everything. In shadowing section, click "Слушать" then "Повторить" and speak → see recognition result.

---

### Task 9: Speaking practice (create-your-dialogue)

**Files:**
- Modify: `js/lesson-player.js` (renderSpeaking)
- Modify: `js/games.js` (createDialogue)

- [ ] **Step 1: Write createDialogue in games.js**

```javascript
  createDialogue(containerId, template) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <p style="margin-bottom:16px">Заполни пропуски своей информацией, затем нажми «Записать»</p>
      ${template.map((field, i) => `
        <div class="create-dialogue-field">
          <label>${field.label}</label>
          <input type="text" id="cd-${i}" placeholder="${field.es}" data-es="${field.es}">
          <p style="font-size:14px;color:var(--gray-dark);margin-top:2px">${field.es}</p>
        </div>
      `).join('')}
      <button class="btn btn-success" id="save-dialogue">💾 Сохранить мой диалог</button>
      <div id="my-dialogue-result" style="margin-top:16px"></div>
    `;

    document.getElementById('save-dialogue').addEventListener('click', () => {
      const values = template.map((_, i) => document.getElementById(`cd-${i}`).value.trim());
      const resultDiv = document.getElementById('my-dialogue-result');

      if (values.some(v => !v)) {
        resultDiv.innerHTML = '<span style="color:var(--error)">Заполните все поля!</span>';
        return;
      }

      const dialogue = `
Hola, me llamo ${values[0]}.
Soy de ${values[1]}.
Estoy aquí porque ${values[2]}.
      `.trim();

      // Save to localStorage
      const saved = JSON.parse(localStorage.getItem('espanol_my_dialogues') || '[]');
      saved.push({ date: new Date().toISOString(), text: dialogue, template: template.map((f, i) => ({ label: f.label, value: values[i] })) });
      localStorage.setItem('espanol_my_dialogues', JSON.stringify(saved));

      resultDiv.innerHTML = `
        <div style="padding:16px;background:#f0fff4;border-radius:8px">
          <p style="font-weight:600">✅ Твой диалог сохранён!</p>
          <p style="margin:8px 0">${dialogue}</p>
          <button class="btn btn-secondary" style="font-size:14px" onclick="Speech.say('${dialogue.replace(/'/g, "\\'").replace(/\n/g, ' ')}', 'es-ES')">🔊 Прослушать</button>
        </div>
      `;
    });
  }
```

- [ ] **Step 2: Write renderSpeaking in lesson-player.js**

```javascript
  renderSpeaking() {
    const d = this.dialog;
    const app = document.getElementById('app');
    app.className = 'container';

    const createEx = d.exercises.find(e => e.type === 'create-dialogue');
    const roleplayEx = d.exercises.filter(e => e.type === 'roleplay');

    app.innerHTML = `
      <div class="card fade-in">
        <h2>🗣 Практика говорения</h2>
        <p style="margin:8px 0;color:var(--gray-dark)">Теперь твоя очередь! Создай свой собственный диалог.</p>
        <div id="create-dialogue"></div>
      </div>

      ${roleplayEx.length > 0 ? `
      <div class="card fade-in" style="margin-top:16px">
        <h3>🎭 Ролевая игра</h3>
        <p style="margin:8px 0;color:var(--gray-dark)">Выбери персонажа и отвечай на реплики собеседника</p>
        <div id="roleplay-section"></div>
      </div>` : ''}
    `;

    if (createEx) {
      Games.createDialogue('create-dialogue', createEx.template);
    }
  }
```

- [ ] **Step 3: Test manually**
Go to step 5. Fill in name, city, reason. Click "Сохранить". See dialogue generated with TTS button. Check localStorage for `espanol_my_dialogues`.

---

### Task 10: Test step (quiz)

**Files:**
- Modify: `js/lesson-player.js` (renderTest)
- Modify: `js/games.js` (quiz)

- [ ] **Step 1: Write quiz in games.js**

```javascript
  quiz(containerId, questions) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let currentQ = 0;
    let score = 0;
    let answered = false;

    const renderQuestion = () => {
      const q = questions[currentQ];
      container.innerHTML = `
        <p style="margin-bottom:12px;color:var(--gray-dark)">Вопрос ${currentQ + 1} из ${questions.length}</p>
        <p style="font-size:18px;font-weight:600;margin-bottom:12px">${q.question}</p>
        <div class="quiz-options">
          ${q.options.map((opt, i) => `
            <button class="quiz-option" data-index="${i}">${opt}</button>
          `).join('')}
        </div>
        <div id="quiz-feedback" style="margin-top:12px"></div>
        <div style="display:flex;justify-content:space-between;margin-top:16px">
          <button class="btn btn-secondary" id="quiz-prev" ${currentQ === 0 ? 'disabled' : ''}>← Назад</button>
          <span style="color:var(--gray-dark)">Правильно: ${score}</span>
          <button class="btn btn-primary" id="quiz-next" ${currentQ === questions.length - 1 ? 'disabled' : ''}>Далее →</button>
        </div>
      `;

      container.querySelectorAll('.quiz-option').forEach(btn => {
        btn.addEventListener('click', () => {
          if (answered) return;
          const selected = parseInt(btn.dataset.index);
          const isCorrect = selected === q.answer;

          container.querySelectorAll('.quiz-option').forEach((b, i) => {
            b.classList.remove('selected', 'correct', 'incorrect');
            if (i === q.answer && isCorrect) b.classList.add('correct');
            else if (i === selected) b.classList.add(isCorrect ? 'correct' : 'incorrect');
          });

          if (isCorrect) score++;
          answered = true;
          document.getElementById('quiz-feedback').innerHTML = isCorrect
            ? '<span style="color:var(--success);font-weight:600">✅ Верно!</span>'
            : `<span style="color:var(--error);font-weight:600">❌ Неверно. Правильный ответ: ${q.options[q.answer]}</span>`;
        });
      });

      document.getElementById('quiz-prev')?.addEventListener('click', () => {
        if (currentQ > 0) { currentQ--; answered = false; renderQuestion(); }
      });
      document.getElementById('quiz-next')?.addEventListener('click', () => {
        if (currentQ < questions.length - 1) { currentQ++; answered = false; renderQuestion(); }
      });
    };

    renderQuestion();
  }
```

- [ ] **Step 2: Write renderTest in lesson-player.js**

```javascript
  renderTest() {
    const d = this.dialog;
    const app = document.getElementById('app');
    app.className = 'container';

    const quizEx = d.exercises.find(e => e.type === 'quiz');

    app.innerHTML = `
      <div class="card fade-in">
        <h2>📝 Тестирование</h2>
        <p style="margin:8px 0;color:var(--gray-dark)">Проверь, что ты усвоил в этом уроке</p>
        <div id="quiz-container"></div>
      </div>
    `;

    if (quizEx) {
      Games.quiz('quiz-container', quizEx.questions);
    }
  }
```

- [ ] **Step 3: Test manually**
Go to step 6. Answer each question, see feedback. Navigate back/forth.

---

### Task 11: Reflection step + full integration

**Files:**
- Modify: `js/lesson-player.js` (renderReflection)

- [ ] **Step 1: Write renderReflection in lesson-player.js**

```javascript
  renderReflection() {
    const d = this.dialog;
    const prog = Progress.get(`dialog-${d.id}`);
    const app = document.getElementById('app');
    app.className = 'container';

    app.innerHTML = `
      <div class="card fade-in" style="text-align:center">
        <h2>🎉 Урок завершён!</h2>
        <p style="margin:12px 0;color:var(--gray-dark)">Поздравляю! Ты успешно прошёл диалог "${d.title}"</p>

        <div class="score-display">
          <div class="score-number">${d.id}</div>
          <div class="score-label">Диалог пройден</div>
        </div>

        <div style="max-width:400px;margin:16px auto">
          <h3 style="margin-bottom:12px">✅ Чек-лист достижений:</h3>
          <div style="text-align:left">
            <p>✅ Выучил(а) ${Object.values(d.vocabulary).flat().length} новых слов</p>
            <p>✅ Понимаю диалог на слух</p>
            <p>✅ Могу представиться на испанском</p>
            <p>✅ Различаю ser и estar</p>
            <p>✅ Записал(а) свой диалог</p>
          </div>
        </div>

        <div style="margin:24px 0;padding:16px;background:var(--gray);border-radius:8px;text-align:left">
          <h3>📚 Домашнее задание:</h3>
          <ol style="margin:8px 0 0 20px">
            ${d.homework.map(h => `<li style="padding:4px 0">${h}</li>`).join('')}
          </ol>
        </div>

        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <a href="lesson.html?id=${d.id}" class="btn btn-secondary">🔄 Пройти заново</a>
          <a href="index.html" class="btn btn-primary">🏠 На главную</a>
        </div>
      </div>
    `;
  }
```

- [ ] **Step 2: Full integration test**
1. Open `index.html` — see course structure with 1 dialogue
2. Click dialogue → `lesson.html?id=1`
3. Step 1: See preparation
4. Step 2: Hear vocab, play memory game
5. Step 3: See grammar, fill gaps, check
6. Step 4: Read dialogue, shadowing with recording
7. Step 5: Create own dialogue, save
8. Step 6: Quiz, answer all
9. Step 7: Reflection, see checklist
10. Click "На главную" → see dialogue marked as ✅ completed
11. Refresh → progress persists

---

### Task 12: Polish + accessibility

**Files:**
- Modify: `css/style.css`
- Modify: `index.html`
- Modify: `lesson.html`

- [ ] **Step 1: Add loading states**
Ensure all async operations show feedback:
- `app.js` already shows "Загрузка..." while fetching JSON
- Shadowing shows "🎤 Говорите..." during recognition
- Quiz shows feedback after each answer

- [ ] **Step 2: Test mobile responsiveness**
Open in browser DevTools → iPhone view. Verify:
- Cards stack vertically
- Memory game is 2-column, not squished
- Dialogue lines wrap properly
- Buttons are tappable (min 44px height)

- [ ] **Step 3: Add "no SpeechRecognition" fallback**
In `speech.js`, `recognize()` already handles unsupported browser with callback. Ensure shadowing button shows a message when recognition not available.

- [ ] **Step 4: Verify index page progress tracking**
After completing lesson, go to index. The "Прогресс" should show 1/55 with green bar.

- [ ] **Step 5: Clean up console logs**
Search for any `console.log` left in JS files and remove them.

---

### Files Reference

| File | Purpose |
|---|---|
| `index.html` | Landing page — course structure, progress |
| `lesson.html` | Lesson player shell — header, steps, nav |
| `css/style.css` | Full design system — colors, layouts, animations |
| `js/app.js` | Router, voice pre-load, dialog loading |
| `js/progress.js` | localStorage CRUD for progress |
| `js/speech.js` | TTS + SpeechRecognition wrapper |
| `js/games.js` | All exercise types: memory, fillGap, shadowing, createDialogue, quiz |
| `js/lesson-player.js` | Step management, 7 step renderers |
| `data/dialogs.json` | Metadata for all dialogues |
| `data/dialog-01.json` | Dialogue 1 content (already created) |
