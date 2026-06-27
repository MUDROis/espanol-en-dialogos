# Task 7: Grammar step with Fill-Gap game

**Files:**
- Modify: `js/lesson-player.js` (add renderGrammar)
- Modify: `js/games.js` (add fillGap)

### Step 1: Add fillGap to games.js

Append to `js/games.js` (after the memory game closing brace):

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

Note: add a comma after the `memoryGame` closing brace `}` before adding this new method.

### Step 2: Replace renderGrammar stub in lesson-player.js

Replace:
```javascript
  renderGrammar() { document.getElementById('app').innerHTML = '<div class="container card fade-in"><p>Грамматика...</p></div>'; },
```

With:
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

    const grammarEx = d.exercises.find(e => e.type === 'fill-gap');
    if (grammarEx) {
      Games.fillGap('fill-gap', grammarEx.sentences);
    }
  },
```

### Step 3: Test
1. Open `lesson.html?id=1`, navigate to step 3
2. See grammar tables with TTS buttons
3. Fill gaps, click "Проверить" — see correct/incorrect feedback
