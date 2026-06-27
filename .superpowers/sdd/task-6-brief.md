# Task 6: Preparation step + Vocabulary with Memory game

**Files:**
- Modify: `js/lesson-player.js` (add renderPreparation, renderVocabulary)
- Modify: `js/games.js` (add memory game)

**Interfaces:**
- Consumes: `Speech.say()` from Task 3, `LessonPlayer.goToStep()` from Task 4
- Produces: `Games.memoryGame(containerId, pairs)`

### Step 1: Add memoryGame to games.js

Replace `js/games.js`:

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
          ${pairs.map((p, i) => `<div class="memory-item" data-id="${i}" data-side="es">${p.es}</div>`).join('')}
        </div>
        <div class="memory-column" id="memory-ru-${stateId}">
          <h3 style="font-size:14px;color:var(--gray-dark);margin-bottom:8px">Русский</h3>
          ${pairs.map((p, i) => `<div class="memory-item" data-id="${i}" data-side="ru">${p.ru}</div>`).join('')}
        </div>
      </div>
      <div id="memory-status-${stateId}" style="text-align:center;margin-top:12px;font-weight:600">
        Найдено пар: 0 / ${pairs.length}
      </div>
    `;

    container.querySelectorAll('.memory-item').forEach(el => {
      el.addEventListener('click', () => {
        const side = el.dataset.side;
        const id = parseInt(el.dataset.id);

        if (state.matched.has(id)) return;

        if (side === 'es') {
          container.querySelectorAll('.memory-item[data-side="es"]').forEach(e => e.classList.remove('selected'));
          el.classList.add('selected');
          state.selectedEs = id;
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
        status.innerHTML = '🎉 Все пары найдены! Нажмите "Далее" для продолжения.';
      }
    }
  }
};
```

### Step 2: Add renderPreparation and renderVocabulary to lesson-player.js

Replace the stub renderers in `js/lesson-player.js`:

Find these lines:
```javascript
  renderPreparation() { document.getElementById('app').innerHTML = '<div class="container card fade-in"><p>Подготовка...</p></div>'; },
  renderVocabulary() { document.getElementById('app').innerHTML = '<div class="container card fade-in"><p>Словарный запас...</p></div>'; },
```

Replace with:
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
  },

  renderVocabulary() {
    const d = this.dialog;
    const app = document.getElementById('app');
    app.className = 'container';

    const allVocab = [];
    Object.values(d.vocabulary).forEach(group => {
      group.forEach(item => allVocab.push(item));
    });

    app.innerHTML = `
      <div class="card fade-in">
        <h2>📖 Словарный запас</h2>
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

    const pairs = allVocab.slice(0, 8);
    Games.memoryGame('memory-game', pairs);
  },
```

### Step 3: Test
1. Open `lesson.html?id=1` — step 1 should show preparation with objectives
2. Click "Начать урок" or "Далее" → step 2 with vocabulary cards and memory game
3. Click 🔊 on a vocab card → should hear TTS
4. Click ES word then RU word in memory game → match or error
