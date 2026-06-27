### Task 1: Create initial `data/access-codes.json`

**Files:**
- Create: `data/access-codes.json`

**Interfaces:**
- Produces: file format consumed by `js/auth.js` `loadCodes()`

- [ ] **Step 1: Compute SHA-256 hashes**

Run in Node.js:
```js
async function sha256(str) {
  const buf = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
```

Compute hashes for these codes:
- `DEMO-2026` → demo type, label "Демо-доступ"
- `ADMIN-MASTER` → admin type, label "Администратор"

- [ ] **Step 2: Create `data/access-codes.json`**

```json
[
  {
    "hash": "<demo_hash_from_step_1>",
    "type": "demo",
    "label": "Демо-доступ",
    "active": true,
    "expires_in": null,
    "created_at": "2026-06-27T00:00:00.000Z"
  },
  {
    "hash": "<admin_hash_from_step_1>",
    "type": "admin",
    "label": "Администратор",
    "active": true,
    "expires_in": null,
    "created_at": "2026-06-27T00:00:00.000Z"
  }
]
```

- [ ] **Step 3: Commit**

```bash
git add data/access-codes.json
git commit -m "feat: add initial access codes (demo + admin)"
```
