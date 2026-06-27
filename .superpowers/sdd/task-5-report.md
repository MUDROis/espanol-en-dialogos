# Task 5 Report: Landing page (index.html)

## Steps Completed

1. **Fixed `data/dialogs.json`** — Changed from `{"parts": []}` to correct JSON array format `[{id, title, titleRu, part, partTitle, level, theme}]` with dialog 1 "Javier conoce a Ana"
2. **Replaced `index.html`** — Full landing page with:
   - Header with course title and description
   - Progress summary bar (reads from `Progress.getStats()`)
   - Course content area grouped by parts (collapsible part cards)
   - Each dialog link shows title, theme, and status (→ or ✓)
   - Footer with course info
3. **Verified dependencies** — `js/progress.js` and `js/app.js` both exist

## Spec Compliance

- Header shows title + subtitle ✓
- Progress bar displays completed/total with percentage ✓
- Dialogs grouped by part using `d.partTitle` ✓
- Part cards are collapsible via CSS toggle ✓
- Each dialog link goes to `lesson.html?id=<id>` ✓
- Status shown: → for available, ✓ for completed ✓
- Consumes `Progress.getStats()` and `Progress.get(dialogId)` ✓
- Consumes `data/dialogs.json` ✓
