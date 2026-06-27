# Task 4 Report: App shell + lesson player scaffold

## Files modified
- `js/app.js` — replaced placeholder with router: listens for DOMContentLoaded, parses `?id=` param, fetches `data/dialog-XX.json`, passes to `LessonPlayer.init()`, handles errors with "not found" UI
- `js/lesson-player.js` — `LessonPlayer` object with 7-step navigation (preparation, vocabulary, grammar, dialogue, speaking, test, reflection), step indicator rendering, nav buttons, progress persistence via `Progress`, and stub renderers for each step
- `lesson.html` — restructured with header, step-indicator, step-title, app container, nav-buttons, footer; loads all 5 JS files
- `index.html` — added script tags for `progress.js`, `speech.js`, `games.js`, `lesson-player.js`, `app.js` before `</body>`

## Committed
Commit `6ae16b0` — "Task 4: App shell + lesson player scaffold"

## Verification
- All referenced CSS classes (`.step-dot`, `.step-indicator`, `.nav-buttons`, `.fade-in`) exist in `css/style.css`
- Step renderers are stubs matching brief — will be filled in Tasks 5-11
- `lesson.html?id=1` will show loading state, then step 1 if `data/dialog-01.json` exists
