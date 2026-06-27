# Task 7: Grammar step with Fill-Gap game

## Summary

Implemented grammar renderer and fill-gap exercise.

## Changes

### `js/games.js`
- Added `fillGap(containerId, sentences)` method after `checkMemoryMatch`
- Renders gap-sentences with `<select>` dropdowns and a "Проверить" button
- Checks answers on click, marks correct/incorrect with visual feedback, shows score

### `js/lesson-player.js`
- Replaced `renderGrammar` stub with full implementation:
  - Renders grammar tables for each verb (ser, estar, llamarse) with conjugation forms
  - TTS button to pronounce all forms via `Speech.say()`
  - Explanation block for SER vs ESTAR usage
  - Fill-gap exercise card calling `Games.fillGap`

## Verification

- `dialog-01.json` confirmed to have `grammar` (ser/estar/llamarse with forms) and `exercises` with `fill-gap` type containing 4 sentences with options

## Commit

`6ff0123` — Task 7: Grammar step with fill-gap game
