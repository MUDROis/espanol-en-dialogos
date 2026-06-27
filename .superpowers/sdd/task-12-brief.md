# Task 12: Polish + verification

**Files:**
- Review: all files

### Step 1: Verify full flow

1. Open `index.html` — should show course structure with "1. Javier conoce a Ana" in Part I
2. Click dialogue 1 → `lesson.html?id=1`
3. Navigate through all 7 steps:
   - Step 1: Preparation with objectives
   - Step 2: Vocabulary cards (click 🔊 → TTS), Memory game (match ES↔RU pairs)
   - Step 3: Grammar tables (SER/ESTAR/LLAMARSE), Fill-gap exercise (select → check)
   - Step 4: Full dialogue with built-by-line translation, "Play all" TTS, Shadowing (listen → repeat → recognition %)
   - Step 5: Create dialogue (fill in name/city/reason → save → TTS)
   - Step 6: Quiz (4 questions, prev/next navigation, answer feedback)
   - Step 7: Reflection with checklist, homework, links to redo/return
4. Click "На главную" → back to index, dialogue 1 marked ✓
5. Refresh page — progress persists in localStorage

### Step 2: Test mobile responsiveness

Open Chrome DevTools → toggle device toolbar (iPhone 12/SE):
- Cards should stack vertically (1 column)
- Text should be readable (no overflow)
- Buttons should be tappable (min 44px)
- Memory game 2-column layout should not be squished

### Step 3: Test SpeechRecognition fallback

In Firefox or Safari (no SpeechRecognition support):
- Shadowing step should show message "Распознавание не поддерживается в этом браузере"
- TTS should still work

### Step 4: Clean up

Remove any `console.log` statements from JS files.

### Step 5: Verify no broken links
- `index.html` links to `lesson.html?id=1` → works
- `lesson.html` links back to `index.html` → works
- "Пройти заново" links to `lesson.html?id=N` → works
