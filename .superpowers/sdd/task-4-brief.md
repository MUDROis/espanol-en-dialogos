# Task 4: App shell + lesson player scaffold

**Files:**
- Modify: `js/app.js` (replace placeholder)
- Modify: `js/lesson-player.js` (replace placeholder)
- Modify: `lesson.html` (update with proper title/step elements)
- Modify: `index.html` (link JS files)

**Interfaces:**
- Produces: `LessonPlayer.init(dialog)` — renders step 1, handles nav; `App` router
- Consumes: `Progress`, `Speech`, dialog JSON (`data/dialog-XX.json`)

### Step 1: Write app.js (router)

Replace `js/app.js` content:

```javascript
/* js/app.js */
document.addEventListener('DOMContentLoaded', () => {
  if (Speech.isSupported) {
    speechSynthesis.getVoices();
    speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
  }

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

### Step 2: Update lesson.html

Replace entire content of `lesson.html`:

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

### Step 3: Write lesson-player.js (7 step stubs + navigation)

Replace `js/lesson-player.js`:

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
    if (!container) return;
    container.innerHTML = this.steps.map((step, i) =>
      `<div class="step-dot ${i < this.currentStep ? 'done' : ''} ${i === this.currentStep ? 'active' : ''}"></div>`
    ).join('');
  },

  renderStepContent() {
    const step = this.steps[this.currentStep];
    document.getElementById('step-title').textContent = `Шаг ${this.currentStep + 1}: ${step.title}`;
    step.render.call(this);

    const nav = document.getElementById('nav-buttons');
    if (!nav) return;
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

  // Step renderers — filled in later tasks
  renderPreparation() { document.getElementById('app').innerHTML = '<div class="container card fade-in"><p>Подготовка...</p></div>'; },
  renderVocabulary() { document.getElementById('app').innerHTML = '<div class="container card fade-in"><p>Словарный запас...</p></div>'; },
  renderGrammar() { document.getElementById('app').innerHTML = '<div class="container card fade-in"><p>Грамматика...</p></div>'; },
  renderDialogue() { document.getElementById('app').innerHTML = '<div class="container card fade-in"><p>Диалог...</p></div>'; },
  renderSpeaking() { document.getElementById('app').innerHTML = '<div class="container card fade-in"><p>Практика говорения...</p></div>'; },
  renderTest() { document.getElementById('app').innerHTML = '<div class="container card fade-in"><p>Тестирование...</p></div>'; },
  renderReflection() { document.getElementById('app').innerHTML = '<div class="container card fade-in"><p>Рефлексия...</p></div>'; }
};
```

### Step 4: Update index.html to link JS

Add these before `</body>` in `index.html`:
```html
  <script src="js/progress.js"></script>
  <script src="js/speech.js"></script>
  <script src="js/games.js"></script>
  <script src="js/lesson-player.js"></script>
  <script src="js/app.js"></script>
```

### Step 5: Test
Open `lesson.html?id=1` in browser. Should show "Загрузка...", then step 1 with "Подготовка" placeholder. Click "Далее" → step 2 "Словарный запас". Step dots should update.
