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

    const grammarEx = d.exercises.find(e => e.type === 'fill-gap');
    if (grammarEx) {
      Games.fillGap('fill-gap', grammarEx.sentences);
    }
  },
  renderDialogue() {
    const d = this.dialog;
    const app = document.getElementById('app');
    app.className = 'container';

    app.innerHTML = `
      <div class="card fade-in">
        <h2>💬 Диалог: ${d.title}</h2>
        <p style="margin:8px 0;color:var(--gray-dark)">Прочитайте диалог, затем переходите к упражнениям на говорение</p>
        <div style="margin:16px 0">
          <button class="btn btn-primary" id="play-all-btn">🔊 Прослушать весь диалог</button>
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

    document.getElementById('play-all-btn').addEventListener('click', () => {
      Speech.say(d.dialogue.map(l => l.es).join('. '), 'es-ES');
    });

    Games.shadowingPlayer('shadowing-player', d.dialogue);
  },
  renderSpeaking() {
    const d = this.dialog;
    const app = document.getElementById('app');
    app.className = 'container';

    const createEx = d.exercises.find(e => e.type === 'create-dialogue');

    app.innerHTML = `
      <div class="card fade-in">
        <h2>🗣 Практика говорения</h2>
        <p style="margin:8px 0;color:var(--gray-dark)">Теперь твоя очередь! Создай свой собственный диалог.</p>
        <div id="create-dialogue"></div>
      </div>
    `;

    if (createEx) {
      Games.createDialogue('create-dialogue', createEx.template);
    }
  },
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
  },
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
};
