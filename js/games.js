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
  }
};
