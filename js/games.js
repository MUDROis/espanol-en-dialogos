/* js/games.js */
const Games = {
  memoryState: {},

  memoryGame(containerId, pairs) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const stateId = 'memory_' + Date.now();
    // Create shuffled index arrays so columns don't match in order
    const shuffle = (arr) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
    const esOrder = shuffle(pairs.map((_, i) => i));
    const ruOrder = shuffle(pairs.map((_, i) => i));

    this.memoryState[stateId] = {
      pairs,
      esOrder,
      ruOrder,
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
          ${esOrder.map(i => `<div class="memory-item" data-id="${i}" data-side="es">${pairs[i].es}</div>`).join('')}
        </div>
        <div class="memory-column" id="memory-ru-${stateId}">
          <h3 style="font-size:14px;color:var(--gray-dark);margin-bottom:8px">Русский</h3>
          ${ruOrder.map(i => `<div class="memory-item" data-id="${i}" data-side="ru">${pairs[i].ru}</div>`).join('')}
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
  },

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
  },

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
        <div style="display:flex;justify-content:space-between;margin-top:12px">
          <button class="btn btn-secondary" id="prev-line" ${currentIndex === 0 ? 'disabled' : ''}>← Назад</button>
          <button class="btn btn-primary" id="next-line" ${currentIndex === lines.length - 1 ? 'disabled' : ''}>Далее →</button>
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

      document.getElementById('prev-line')?.addEventListener('click', () => {
        if (currentIndex > 0) { currentIndex--; renderLine(); }
      });
      document.getElementById('next-line')?.addEventListener('click', () => {
        if (currentIndex < lines.length - 1) { currentIndex++; renderLine(); }
      });
    };

    renderLine();
  },

  roleplayGame(containerId, dialogue, role) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const userLines = dialogue.filter(l => l.speaker === role);
    const allLines = dialogue;
    let currentIndex = 0;
    let score = 0;

    const renderLine = () => {
      const line = userLines[currentIndex];
      const lineIndex = allLines.findIndex(l => l === line);
      const prevLine = lineIndex > 0 ? allLines[lineIndex - 1] : null;

      container.innerHTML = `
        <div style="text-align:center;margin-bottom:12px">
          <span style="font-weight:700;color:var(--primary)">Твоя роль: ${role}</span>
          <span style="color:var(--gray-dark);margin-left:12px">${currentIndex + 1} / ${userLines.length}</span>
        </div>
        ${prevLine ? `
          <div style="padding:12px;background:var(--gray);border-radius:8px;margin-bottom:12px">
            <p style="font-size:14px;color:var(--gray-dark)">${prevLine.speaker} говорит:</p>
            <p style="font-weight:600">${prevLine.es}</p>
            <p style="font-size:14px;color:var(--gray-dark)">${prevLine.ru}</p>
          </div>
        ` : '<p style="text-align:center;color:var(--gray-dark);margin:12px 0">Ты начинаешь диалог!</p>'}
        <div style="padding:12px;border:2px solid var(--primary);border-radius:8px;background:#fff0f0">
          <p style="font-size:14px;color:var(--primary)">Твоя реплика (${role}):</p>
          <p style="font-weight:600;font-size:18px;margin:4px 0">${line.es}</p>
          <p style="font-size:14px;color:var(--gray-dark)">${line.ru}</p>
        </div>
        <div style="text-align:center;margin:12px 0">
          <button class="btn btn-primary" id="roleplay-listen">🔊 Прослушать контекст</button>
          <button class="btn btn-secondary" id="roleplay-speak">🎤 Скажи это</button>
        </div>
        <div id="roleplay-result" style="text-align:center"></div>
        <div style="display:flex;justify-content:space-between;margin-top:12px">
          <button class="btn btn-secondary" id="roleplay-prev" ${currentIndex === 0 ? 'disabled' : ''}>← Назад</button>
          <span style="color:var(--gray-dark)">Очки: ${score}</span>
          <button class="btn btn-primary" id="roleplay-next" ${currentIndex === userLines.length - 1 ? 'disabled' : ''}>Далее →</button>
        </div>
      `;

      document.getElementById('roleplay-listen')?.addEventListener('click', () => {
        const text = prevLine ? prevLine.es : line.es;
        Speech.say(text, 'es-ES');
      });

      document.getElementById('roleplay-speak')?.addEventListener('click', () => {
        const resultDiv = document.getElementById('roleplay-result');
        resultDiv.innerHTML = '🎤 Говорите...';
        Speech.recognize(line.es, (percent, text) => {
          if (percent === null) {
            resultDiv.innerHTML = `<span style="color:var(--error)">${text}</span>`;
          } else {
            resultDiv.innerHTML = `
              <div>Распознано: ${percent}%</div>
              <div style="font-size:14px;color:var(--gray-dark)">Вы сказали: "${text}"</div>
            `;
            if (percent >= 50) score++;
          }
        });
      });

      document.getElementById('roleplay-prev')?.addEventListener('click', () => {
        if (currentIndex > 0) { currentIndex--; renderLine(); }
      });
      document.getElementById('roleplay-next')?.addEventListener('click', () => {
        if (currentIndex < userLines.length - 1) { currentIndex++; renderLine(); }
        else {
          container.innerHTML = `
            <div style="text-align:center;padding:24px">
              <h3>🎉 Ролевая игра завершена!</h3>
              <p>Правильно произнесено: ${score} из ${userLines.length}</p>
            </div>
          `;
        }
      });
    };

    renderLine();
  },

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

      const dialogue = template.map((f, i) => f.es.replace('___', values[i])).join('. ') + '.';

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

  quiz(containerId, questions, dialogId) {
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
            if (i === selected) b.classList.add('selected');
            if (i === selected && i !== q.answer) b.classList.add('incorrect');
          });

          if (isCorrect) score++;
          if (dialogId) Progress.set(dialogId, { score });
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
};
