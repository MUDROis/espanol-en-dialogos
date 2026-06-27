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
