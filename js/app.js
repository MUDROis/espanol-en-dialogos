/* js/app.js */
window.allCharacters = [];

document.addEventListener('DOMContentLoaded', async () => {
  await AUTH.init();

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
    const id = parseInt(dialogId, 10);
    if (!AUTH.isAuthenticated()) {
      window.location.href = 'index.html';
      return;
    }
    if (!AUTH.canAccessLesson(id)) {
      const container = document.getElementById('app');
      if (container) {
        container.innerHTML = `
          <div class="container" style="text-align:center;padding:40px">
            <h2>Урок недоступен</h2>
            <p>Этот урок не входит в ваш тарифный план.</p>
            <a href="index.html" class="btn btn-primary">На главную</a>
          </div>`;
      }
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
