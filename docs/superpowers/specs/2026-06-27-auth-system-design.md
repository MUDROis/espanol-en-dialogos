# Español en Diálogos — Authorization System Design

## Overview

Add individual student authorization to the static Spanish course using Supabase (free tier). Students register via email/password, get demo access (lesson 1), and can be upgraded to full access (all 55 lessons) by the teacher after manual payment confirmation.

## Constraints

- Minimally invasive to existing course code — auth is a thin layer
- No changes to lesson content (dialog JSON files)
- Supabase free tier (50k MAU, 500MB DB)
- Teacher upgrades students manually via Supabase Dashboard

## Architecture

```
┌──────────────────────┐     Supabase JS SDK      ┌──────────────────┐
│   index.html         │ ◄──────────────────────►  │  Supabase Auth   │
│   lesson.html        │                          │  (email/password)│
│   js/auth.js (new)   │                          ├──────────────────┤
│                      │                          │  Supabase DB     │
│   Progress (existing)│                          │  ┌────────────┐  │
│   localStorage key   │                          │  │ enrollments│  │
│   per user_id        │                          │  └────────────┘  │
└──────────────────────┘                          └──────────────────┘
```

## Database: `enrollments` table

| Column | Type | Description |
|---|---|---|
| id | uuid (PK) | Auto-generated |
| user_id | uuid (FK → auth.users.id) | Supabase Auth user |
| email | text | User's email |
| access_type | text | `demo` or `full` |
| access_expires_at | timestamptz | Null = never expires |
| created_at | timestamptz | When registered |
| updated_at | timestamptz | Last status change |

**RLS Policy:** Users can only read their own enrollment row. Teacher (admin) can read/write all.

## Auth Flow

### First visit (unauthenticated)
1. User opens `index.html` → sees login/register form (not course content)
2. Options: "Войти" / "Попробовать бесплатно"

### Demo registration
1. User clicks "Попробовать бесплатно"
2. Form: email + password (or just email + magic link)
3. Supabase Auth creates account
4. After signup: `enrollments` row created with `access_type: "demo"`
5. User redirected to course → only lesson 1 is accessible

### Full access (after payment)
1. User pays via link/QR code provided by teacher
2. Teacher opens Supabase Dashboard → Table Editor → `enrollments`
3. Changes `access_type` from `demo` to `full`
4. Sets `access_expires_at` if time-limited
5. On next page reload, student sees all lessons

### Returning user
1. Opens site → sees login form
2. Enters email + password
3. Auth check → enrollment check → access granted or denied

## Access Rules

| Role | Lessons | Progress |
|---|---|---|
| Unauthenticated | None (login page) | — |
| `demo` | Lesson 1 only | localStorage key: `espanol_progress_{user_id}` |
| `full` (active) | All 55 lessons | localStorage key: `espanol_progress_{user_id}` |
| `full` (expired) | None (renewal notice) | localStorage key: `espanol_progress_{user_id}` |

## Frontend Changes

### New file: `js/auth.js`
- Supabase client initialization (`@supabase/supabase-js` via CDN)
- Login / Register / Logout functions
- Access check: reads `enrollments` table for current user
- Auth UI rendering (login form, register form, user menu)

### Modified: `index.html`
- On load: check auth state
- If not authenticated: show auth UI instead of course content
- If demo: show course with lessons 2-55 locked (grayed out with "Доступно после покупки" label)
- If full: show all lessons

### Modified: `lesson.html`
- On load: verify user has access to requested lesson
- If demo trying to access lesson > 1: redirect to index with error
- If expired: redirect to index with renewal notice

### Modified: `js/progress.js`
- Change localStorage key from `espanol_progress` to `espanol_progress_{user_id}`
- Progress is now per-user, even on the same device

## Dependencies

- Supabase JS SDK v2 (CDN: `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`)
- Supabase project URL and anon key (from project settings)

## Teacher Workflow

1. Student expresses interest → sends payment via link/QR
2. Teacher receives notification (manual — no webhook)
3. Teacher opens Supabase Dashboard → Authentication → finds user by email
4. Teacher opens Table Editor → `enrollments` → updates `access_type` to `full`
5. Optionally sets `access_expires_at` for time-limited access
6. Done

## Future Options (not implementing now)

- Automatic upgrade via Stripe webhook
- Admin panel UI (instead of Supabase Dashboard)
- Progress sync to Supabase (instead of localStorage)
- Email notifications
