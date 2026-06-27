# Task 9 + 10: Speaking practice (create-dialogue) + Test step (quiz)

**Files:**
- Modify: `js/games.js` (add createDialogue, quiz)
- Modify: `js/lesson-player.js` (add renderSpeaking, renderTest)

### Step 1: Add createDialogue and quiz to games.js

Append after shadowingPlayer (with comma after its closing `}`):

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

      const dialogue = `Hola, me llamo ${values[0]}. Soy de ${values[1]}. Estoy aquí porque ${values[2]}.`;

      const saved = JSON.parse(localStorage.getItem('espanol_my_dialogues') || '[]');
      saved.push({ date: new Date().toISOString(), text: dialogue, values });
      localStorage.setItem('espanol_my_dialogues', JSON.stringify(saved));

      resultDiv.innerHTML = `
        <div style="padding:16px;background:#f0fff4;border-radius:8px">
          <p style="font-weight:600">✅ Твой диалог сохранён!</p>
          <p style="margin:8px 0">${dialogue}</p>
          <button class="btn btn-secondary" style="font-size:14px" id="play-my-dialogue">🔊 Прослушать</button>
        </div>
      `;

      document.getElementById('play-my-dialogue').addEventListener('click', () => {
        Speech.say(dialogue, 'es-ES');
      });
    });
  },

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
            if (i === q.answer) b.classList.add('correct');
            else if (i === selected) b.classList.add('incorrect');
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

### Step 2: Replace renderSpeaking and renderTest stubs in lesson-player.js

Replace:
```javascript
  renderSpeaking() { document.getElementById('app').innerHTML = '<div class="container card fade-in"><p>Практика говорения...</p></div>'; },
  renderTest() { document.getElementById('app').innerHTML = '<div class="container card fade-in"><p>Тестирование...</p></div>'; },
```

With:
```javascript
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
```

### Step 3: Replace renderReflection stub

Replace:
```javascript
  renderReflection() { document.getElementById('app').innerHTML = '<div class="container card fade-in"><p>Рефлексия...</p></div>'; }
```

With:
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

### Step 4: Test full flow
1. Open `lesson.html?id=1`, go through all 7 steps
2. Step 5: create dialogue → save → TTS plays it
3. Step 6: answer quiz questions → see score
4. Step 7: reflection with homework, links to redo/return
