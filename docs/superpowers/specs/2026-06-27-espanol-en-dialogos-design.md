# Español en Diálogos — Interactive Course Design

## Overview

Interactive Spanish language course based on the book "Испанский в диалогах" (55 dialogues, 6 parts, A2-C1). Self-hosted on GitHub Pages as a static SPA, with all progress stored in browser localStorage.

## Tech Stack

- **Runtime:** Vanilla HTML/CSS/JS (no build tools)
- **Hosting:** GitHub Pages (static)
- **Audio:** Web Speech API (SpeechSynthesis for TTS, SpeechRecognition for pronunciation check)
- **Storage:** localStorage
- **Content:** JSON data files per dialogue

## Architecture

### Hybrid approach
- `index.html` — static landing page with course structure
- `lesson.html?id=N` — single lesson player rendering any dialogue from JSON
- `data/dialog-XX.json` — content files per dialogue

### File Structure
```
espanol-en-dialogos/
├── index.html              # Landing page
├── lesson.html             # Lesson player
├── css/
│   └── style.css           # All styles
├── js/
│   ├── app.js              # Router, state
│   ├── lesson-player.js    # Step rendering
│   ├── speech.js           # TTS + SpeechRecognition
│   ├── progress.js         # localStorage
│   └── games.js            # Exercise logic
├── data/
│   ├── dialogs.json        # Metadata (all dialogue list)
│   ├── dialog-01.json      # Dialogue 1 content
│   └── ...
└── assets/
    └── icons/              # SVG icons
```

## Data Format

Each `dialog-XX.json` is self-contained:

```json
{
  "id": 1,
  "title": "Javier conoce a Ana",
  "titleRu": "Хавьер знакомится с Анной",
  "part": 1,
  "level": "A2",
  "theme": "Presentaciones",
  "objectives": [...],
  "grammar": {
    "ser": { "yo": "soy", "tu": "eres", ... }
  },
  "vocabulary": {
    "greetings": [{ "es": "Hola", "ru": "Привет" }, ...]
  },
  "dialogue": [
    { "speaker": "Javier", "es": "...", "ru": "..." }
  ],
  "exercises": [...],
  "homework": [...]
}
```

Dialogue lines have built-by-line Spanish → Russian translation.

## Design

### Color scheme
- Primary: #E63946 (Spanish red)
- Background: #FFF8F0 (warm white)
- Accent: #F4A261 (orange)
- Text: #264653 (dark blue)
- Success: #2A9D8F (green)

### Layout
- Responsive: 3-column desktop → 1-column mobile
- CSS Grid + Flexbox, no external frameworks

## Lesson Flow (7 steps)

1. **Preparation** — goals, instructions (Russian)
2. **Vocabulary** — word blocks + Memory match game
3. **Grammar** — tables + Fill-gap game
4. **Dialogue** — listen, shadowing, roleplay
5. **Speaking practice** — create-your-dialogue
6. **Testing** — quiz (vocab, listening, grammar)
7. **Reflection** — results, homework

## Exercise Types

| Type | Method |
|---|---|
| memory | Click-to-match (2 columns, no drag-drop) |
| fill-gap | Select from options |
| shadowing | TTS → record → playback |
| roleplay | TTS for opponent → SpeechRecognition to check user |
| create-dialogue | Text inputs → save to localStorage |
| quiz | Radio buttons → auto-check |

## Audio (Web Speech API)

- **TTS:** `SpeechSynthesisUtterance` with Spanish voice for dialogue, Russian voice for instructions
- **Recording:** `MediaRecorder` for user's voice (saved locally)
- **Pronunciation check:** `SpeechRecognition` compares recognized text to expected phrase, shows match %

## Progress (localStorage)

```json
{
  "dialog-1": { "completed": true, "score": 85, "lastStep": 7 },
  "dialog-2": { "completed": false, "score": null, "lastStep": 3 }
}
```

## Content Plan

- **Phase 1 (current):** Landing page + Dialogue 1 (full exercises)
- **Phase 2+:** Add dialogues gradually (new JSON files)
- **Total:** 55 dialogues, 6 parts (A2–C1)

## Deployment

- GitHub Pages from root or `/docs` folder
- No build step — push and serve

## Constraints

- No server-side code
- No external APIs (except browser built-ins)
- No build tools
- SpeechRecognition — Chrome/Edge only, requires internet
- TTS — works offline with system voices (limited selection)
- MediaRecorder — Chrome/Edge/Firefox (modern browsers)
- Course core (reading, quizzes, progress) works fully offline
