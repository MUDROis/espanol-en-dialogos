### Task 5: Modify `js/app.js` + `lesson.html` — lesson access guard

**Files:**
- Modify: `js/app.js`
- Modify: `lesson.html`

**Goal:** Prevent unauthorized access to lessons. When someone opens `lesson.html?id=N`, check if the user has access via `AUTH.canAccessLesson(N)`. If not, show "Доступ запрещён" instead of loading the lesson.

- [ ] **Step 1: Replace `js/app.js` with:**

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

Key change from current `js/app.js`: Added `await AUTH.init()` and `AUTH.canAccessLesson()` guard before loading dialog.

- [ ] **Step 2: Update `lesson.html` script order**

Ensure `lesson.html` script section is:
```html
  <script src="js/auth.js"></script>
  <script src="js/progress.js"></script>
  <script src="js/speech.js"></script>
  <script src="js/games.js"></script>
  <script src="js/lesson-player.js"></script>
  <script src="js/app.js"></script>
```

Add `auth.js` before `progress.js` (it may already have `progress.js`).

- [ ] **Step 3: Verify valid syntax**
- [ ] **Step 4: Commit**
