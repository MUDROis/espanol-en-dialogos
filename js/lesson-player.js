/* js/lesson-player.js */
const LessonPlayer = {
  dialog: null,
  currentStep: 0,
  steps: [],

  init(dialog) {
    this.dialog = dialog;
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset') === 'true') {
      Progress.set(`dialog-${dialog.id}`, { completed: false, score: null, lastStep: 0 });
    }
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
    window.scrollTo(0, 0);
    this.renderStepIndicator();
    this.renderStepContent();
  },

  renderStepIndicator() {
    const container = document.getElementById('step-indicator');
    if (!container) return;
    container.innerHTML = this.steps.map((step, i) =>
      `<div class="step-dot ${i < this.currentStep ? 'done' : ''} ${i === this.currentStep ? 'active' : ''}" data-step="${i}" title="Шаг ${i+1}: ${step.title}"></div>`
    ).join('');
    container.querySelectorAll('.step-dot').forEach(el => {
      el.addEventListener('click', (e) => {
        const step = parseInt(e.currentTarget.dataset.step);
        LessonPlayer.goToStep(step);
      });
    });
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
    const themeIntro = {
      "Presentaciones": "Сегодня вы научитесь <strong>знакомиться на испанском</strong>. Представьте: вы на языковых курсах в Малаге и встречаете нового друга...",
      "La escuela, la familia, la vida diaria": "Продолжаем общение! Сегодня вы научитесь <strong>говорить о своих чувствах, учёбе и семье</strong>. Хавьер и Анна встретились в кафе после занятий..."
    };
    const intro = themeIntro[d.theme] || `Сегодня вы будете работать с диалогом: <strong>${d.title}</strong>.`;

    app.innerHTML = `
      <div class="card fade-in">
        <h2>🎯 Добро пожаловать в урок!</h2>
        <p style="margin:12px 0">${intro}</p>

        <h3 style="margin:20px 0 8px">Цели урока:</h3>
        <ul style="list-style:none">
          ${d.objectives.map(o => `<li style="padding:4px 0">✅ ${o}</li>`).join('')}
        </ul>

        <div style="margin-top:20px;padding:16px;background:var(--gray);border-radius:8px;font-size:14px">
          📖 <strong>Диалог:</strong> ${d.title} (${d.titleRu})<br>
          📚 <strong>Уровень:</strong> ${d.level} &nbsp;|&nbsp; 📂 <strong>Тема:</strong> ${d.theme}
          ${d.characters ? `<br><br><strong>🎭 Персонажи:</strong><br><small style="display:block;margin-top:4px">${d.characters.map(cId => {
            const ch = window.allCharacters.find(c => c.id === cId);
            return ch ? `${ch.es}<br>${ch.ru}` : '';
          }).join('<br>')}</small>` : ''}
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

    const verbRu = { ser: 'быть', estar: 'находиться', llamarse: 'называться', estar_adjectives: 'estar + прилагательные', estar_acostumbrado: 'estar acostumbrado a', tener: 'tener (иметь, возраст)', vivir: 'vivir (жить)' };

    const app = document.getElementById('app');
    app.className = 'container';

    app.innerHTML = `
      <div class="card fade-in">
        <h2>📚 Грамматика диалога</h2>

        ${Object.entries(d.grammar).map(([verb, forms]) => {
          const ttsPerson = { yo: 'yo', tu: 'tú', el_ella: 'él', nosotros: 'nosotros', vosotros: 'vosotros', ellos_ellas: 'ellos' };
          const fullPhrases = Object.entries(forms).map(([p, f]) =>
            `${ttsPerson[p] || p.replace('_', '/')} ${typeof f === 'string' ? f : f.es}`
          ).join(', ');
          return `
          <div style="margin:16px 0">
            <h3>Глагол <em>${verb}</em> (${verbRu[verb] || verb})</h3>
            <table style="width:100%;border-collapse:collapse;margin:8px 0">
              <tr style="background:var(--gray)">
                <th style="padding:6px 12px;border:1px solid var(--gray);text-align:left">Лицо</th>
                <th style="padding:6px 12px;border:1px solid var(--gray);text-align:left">Español</th>
                <th style="padding:6px 12px;border:1px solid var(--gray);text-align:left">Русский</th>
              </tr>
              ${Object.entries(forms).map(([person, form]) => {
                const es = typeof form === 'string' ? form : form.es;
                const ru = typeof form === 'string' ? '—' : form.ru;
                return `
                <tr>
                  <td style="padding:6px 12px;border:1px solid var(--gray);font-weight:600">${person.replace('_', '/')}</td>
                  <td style="padding:6px 12px;border:1px solid var(--gray)">${es}</td>
                  <td style="padding:6px 12px;border:1px solid var(--gray);color:var(--gray-dark)">${ru}</td>
                </tr>`;
              }).join('')}
            </table>
            <button class="btn btn-secondary" style="font-size:14px" onclick="Speech.say('${fullPhrases.replace(/'/g, "\\'")}', 'es-ES')">
              🔊 Прослушать формы
            </button>
          </div>`;
        }).join('')}

        <div style="margin-top:24px">
          <p style="margin-bottom:8px;font-weight:600">💡 Запомните:</p>
          ${d.id === 1 ? `
          <p><strong>SER</strong> — для постоянных характеристик (национальность, профессия, имя)</p>
          <p><strong>ESTAR</strong> — для временных состояний и местоположения</p>` : `
          <p><strong>ESTAR + прилагательное</strong> — для временных состояний и чувств: <em>estoy contento, estoy cansado</em></p>
          <p><strong>Окончание женского рода</strong> — прилагательные меняют <em>-o</em> на <em>-a</em>: <em>contento → contenta, cansado → cansada, enamorado → enamorada</em></p>
          <p><strong>ESTAR acostumbrado a</strong> — «быть привыкшим к»: <em>estoy acostumbrado a la vida aquí</em></p>
          <p><strong>TENER + возраст</strong> — для указания возраста: <em>tiene 17 años</em></p>
          <p><strong>VIVIR</strong> — спряжение: <em>vivo, vives, vive, vivimos, vivís, viven</em></p>`}
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
    const roleplayExs = d.exercises.filter(e => e.type === 'roleplay');

    app.innerHTML = `
      <div class="card fade-in">
        <h2>🗣 Практика говорения</h2>
        <p style="margin:8px 0;color:var(--gray-dark)">Теперь твоя очередь! Создай свой собственный диалог.</p>
        <div id="create-dialogue"></div>
      </div>
      ${roleplayExs.map((ex, i) => `
        <div class="card fade-in" style="margin-top:16px">
          <h3>🎭 ${ex.title}</h3>
          <p style="margin:8px 0;color:var(--gray-dark)">${ex.description || 'Сыграй роль и произнеси свои реплики'}</p>
          <div id="roleplay-${i}"></div>
        </div>
      `).join('')}
    `;

    if (createEx) {
      Games.createDialogue('create-dialogue', createEx.template);
    }
    roleplayExs.forEach((ex, i) => {
      Games.roleplayGame(`roleplay-${i}`, d.dialogue, ex.role);
    });
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
      Games.quiz('quiz-container', quizEx.questions, `dialog-${d.id}`);
    }
  },
  renderReflection() {
    const d = this.dialog;
    const app = document.getElementById('app');
    app.className = 'container';

    app.innerHTML = `
      <div class="card fade-in" style="text-align:center">
        <h2>🎉 Урок завершён!</h2>
        <p style="margin:12px 0;color:var(--gray-dark)">Поздравляю! Ты успешно прошёл диалог "${d.title}"</p>

        <div class="score-display">
          <div class="score-number">✅</div>
          <div class="score-label">Диалог ${d.id} пройден</div>
        </div>

        <div style="max-width:400px;margin:16px auto">
          <h3 style="margin-bottom:12px">✅ Чек-лист достижений:</h3>
          <div style="text-align:left">
            <p>✅ Выучил(а) ${Object.values(d.vocabulary).flat().length} новых слов</p>
            <p>✅ Прослушал(а) и повторил(а) диалог</p>
            <p>✅ Выполнил(а) грамматические упражнения</p>
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
          <a href="lesson.html?id=${d.id}&reset=true" class="btn btn-secondary">🔄 Пройти заново</a>
          <a href="index.html" class="btn btn-primary">🏠 На главную</a>
        </div>
      </div>
    `;
  }
};
