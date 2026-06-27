# Español en Diálogos — Authorization via Access Codes

## Overview

Replace Supabase-based auth with offline code-based authorization. Access codes are stored as SHA-256 hashes in a static JSON file. No database, no network calls for auth. Admin panel for generating and managing codes, with automatic commits via GitHub Actions.

## Architecture

```
┌──────────────────────┐     fetch             ┌──────────────────────────┐
│   index.html         │ ──────────────────►   │  data/access-codes.json  │
│   admin.html         │ ◄──────────────────   │  (SHA-256 hashes)        │
│   js/auth.js         │                       └──────────────────────────┘
│   js/progress.js     │                              │
└──────────────────────┘                              │ git commit
                                                      ▼
                                           ┌──────────────────────────┐
                                           │  .github/workflows/      │
                                           │  add-access-code.yml     │
                                           └──────────────────────────┘
```

**Key principle:** Codes are never stored in plaintext in the repository. Only SHA-256 hashes. The admin sees the plaintext code once upon generation.

## Data: `data/access-codes.json`

```json
[
  {
    "hash": "c06eb9f7e1ac0c877d6ca986ee1981decc241410d580ad5cdc103d083a9350d5",
    "type": "demo",
    "label": "Демо-доступ",
    "active": true,
    "expires_in": null,
    "created_at": "2026-06-27T00:00:00.000Z"
  },
  {
    "hash": "6643631c26607f801caaa528712f9df71e7896b27481c72d96520970da1c35f0",
    "type": "full",
    "label": "Иван Петров",
    "active": true,
    "expires_in": "P1Y",
    "created_at": "2026-06-27T00:00:00.000Z"
  }
]
```

| Field | Type | Description |
|---|---|---|
| `hash` | string | SHA-256 hex digest of the plaintext code |
| `type` | enum | `demo`, `full`, or `admin` |
| `label` | string | Human-readable name (student name or description) |
| `active` | boolean | `true` = usable, `false` = deactivated |
| `expires_in` | string\|null | ISO 8601 duration (e.g. `P1Y`, `P1M`) or `null` = never |
| `created_at` | string | ISO 8601 timestamp of creation |

## Access Tiers

| Type | Lessons | Expiration | Features |
|---|---|---|---|
| `demo` | Lesson 1 only | Never expires | Free trial |
| `full` | All 55 lessons | Configurable (null/P1M/P6M/P1Y) | After payment |
| `admin` | All 55 + admin panel | Never expires | Code management |

## Files

### New: `js/auth.js`

Auth module with:
- `init()` — load session from localStorage
- `activate(code)` — SHA-256 hash → match against loaded codes → save session
- `canAccessLesson(lessonId)` — `demo` → only id===1; `full` → check `expires_at`; `admin` → all
- `getAccessType()` — returns current type or null
- `logout()` — clear session
- `onChange(fn)` — subscribe to auth state changes
- Session stored in localStorage key `espanol_activation`

### Modified: `js/progress.js`

- `_getKey()` — progress keyed by `espanol_progress_{hashPrefix}` (first 12 chars of code hash)
- Isolates progress per user even on the same device

### Modified: `index.html`

- On load: check auth state via `AUTH.init()`
- Not authenticated → show code input form (course hidden)
- Authenticated → show course with lesson gating
  - Locked lessons (🔒): grayed out, not clickable, show "Доступно после оплаты курса"
  - Available lessons (→): clickable
  - Completed lessons (✓): clickable with green checkmark
- Admin user → show "Управление кодами" link in header
- Script order: `auth.js` → `progress.js` → inline script

### New: `admin.html`

Accessible only to admin users. Redirects non-admin to `index.html`.
- Header with back link to main page
- **Section 1: Existing codes** — table loaded from `access-codes.json`, columns: label, type, expires_in, status (active/deactivated), created_at. Each row has "Деактивировать" button that triggers a download of updated JSON (with `active: false`) for manual commit, plus a link to the GitHub Actions workflow for automated deactivation.
- **Section 2: Generate code** — form with: label (text input), type (select: demo/full/admin), expires_in (select: навсегда/null, 1 месяц/P1M, 6 месяцев/P6M, 1 год/P1Y). Button "Сгенерировать код".
- **Result:** Shows plaintext code (large monospace font), copy button, hash value, links to GitHub Actions workflows (add + deactivate).

### New: `.github/workflows/manage-codes.yml`

A single GitHub Actions workflow triggered by `workflow_dispatch` with two modes:

**Mode `add`:**
- Inputs: `mode=add`, `code` (string), `type` (enum), `label` (string), `expires_in` (string, optional)
- Computes SHA-256 hash of the code
- Reads current `data/access-codes.json`
- Appends new entry with `active: true`
- Commits and pushes

**Mode `deactivate`:**
- Inputs: `mode=deactivate`, `hash` (string, first 12+ chars to match)
- Reads current `data/access-codes.json`
- Finds matching entry, sets `active: false`
- Commits and pushes

### Modified: `css/style.css`

New styles for:
- `.auth-card` — auth form container
- `.auth-input` — code input field
- `.auth-error` — error message
- `.dialog-link--locked` — locked lesson style
- `.admin-table` — code management table
- `.generated-code` — generated code display

## Auth Flow

```
User opens index.html
  → AUTH.init() checks localStorage
  → No session → show code input form
  → User enters code
  → SHA-256 hash
  → Fetch access-codes.json, find match
  → If not found / inactive / expired → show error
  → If found → save session to localStorage
  → Show course with appropriate lesson access
```

## Admin Flow

```
Admin enters admin code on index.html
  → AUTH detects type === 'admin'
  → "Управление кодами" link appears in header
  → Admin clicks → navigates to admin.html
  → admin.html loads, calls AUTH.getAccessType()
  → Not admin → redirect to index.html
  → Is admin → show management panel
  → Generate code → show plaintext + hash
  → Deactivate code → mark active: false
  → Copy code button
  → Open GitHub Actions to commit
```

## Edge Cases

- **Expired code:** During `activate()`, if `expires_in` is set, compute `expires_at` from current time + duration. Store in session. On each page load, check `expires_at` — if expired, clear session and prompt renewal.
- **Deactivated code:** If a code was deactivated after a user activated it — the stored session still works until the user logs out or the session is cleared. This is acceptable for a client-only system.
- **Same device, multiple users:** Progress is scoped by code hash prefix, so different users on the same device have separate progress.
