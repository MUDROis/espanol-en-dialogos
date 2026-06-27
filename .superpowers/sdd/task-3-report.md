# Task 3 Report: Speech Module

## Summary
Replaced the placeholder in `js/speech.js` with a full Web Speech API wrapper.

## What was implemented
- `Speech.isSupported` — feature-detects `speechSynthesis`
- `Speech.isRecognitionSupported` — feature-detects `SpeechRecognition` / `webkitSpeechRecognition`
- `Speech.say(text, lang, rate)` — TTS via `SpeechSynthesisUtterance`, returns a Promise
- `Speech.recognize(expectedText, callback)` — starts microphone, computes word-level match % (0–100), calls `callback(percent, text)` on success or `callback(null, errorMessage)` on failure

## Verification
- Code matches the brief exactly (49 lines)
- Feature detection guards against unsupported browsers
- No lint/typecheck tools exist for this project

## Commit
`53329fa` feat: implement Speech module with TTS (say) and recognition (recognize) via Web Speech API
