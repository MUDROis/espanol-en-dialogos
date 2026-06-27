### Task 3: Modify `js/progress.js` — per-code progress isolation

**Files:**
- Modify: `js/progress.js`

**Goal:** Change the localStorage key from a static `STORAGE_KEY` to a dynamic key based on the code hash prefix, so different users on the same device have separate progress.

**Interfaces:**
- Consumes: `AUTH.getActivation()` (optional — works without auth too)

- [ ] **Step 1: Replace entire file content with:**

```js
/* js/progress.js */
const Progress = {
  _getKey() {
    const activation = typeof AUTH !== 'undefined' ? AUTH.getActivation() : null;
    const suffix = activation ? activation.codeHash.slice(0, 12) : 'anonymous';
    return 'espanol_progress_' + suffix;
  },

  _load() {
    try {
      return JSON.parse(localStorage.getItem(this._getKey()) || '{}');
    } catch {
      return {};
    }
  },

  _save(data) {
    localStorage.setItem(this._getKey(), JSON.stringify(data));
  },

  get(dialogId) {
    const data = this._load();
    return data[dialogId] || { completed: false, score: null, lastStep: 0 };
  },

  set(dialogId, updates) {
    const data = this._load();
    data[dialogId] = { ...this.get(dialogId), ...updates };
    this._save(data);
  },

  getAll() {
    return this._load();
  },

  getStats() {
    const data = this._load();
    const entries = Object.values(data);
    return {
      total: Object.keys(data).length,
      completed: entries.filter(e => e.completed).length
    };
  }
};
```

Key changes from current `js/progress.js`:
- Removed `STORAGE_KEY: 'espanol_progress'`
- Added `_getKey()` that uses first 12 chars of code hash (or 'anonymous' if not authenticated)
- All methods now use `this._getKey()` instead of `this.STORAGE_KEY`

- [ ] **Step 2: Verify file is valid JS**
- [ ] **Step 3: Commit**
