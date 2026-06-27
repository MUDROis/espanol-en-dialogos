# Task 8: Dialogue step (shadowing + roleplay)

**Files:**
- Modify: `js/games.js` (add shadowingPlayer)
- Modify: `js/lesson-player.js` (add renderDialogue)

### Step 1: Add shadowingPlayer to games.js

After the fillGap method (add comma after its closing `}`), add:

```javascript
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

### Step 2: Replace renderDialogue stub in lesson-player.js

Replace:
```javascript
  renderDialogue() { document.getElementById('app').innerHTML = '<div class="container card fade-in"><p>Диалог...</p></div>'; },
```

With:
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
```

### Step 3: Test
1. Open `lesson.html?id=1`, go to step 4
2. See full dialogue with built-by-line translation
3. Click "Прослушать весь диалог" — should read everything
4. Use shadowing player: listen → repeat → see recognition %
