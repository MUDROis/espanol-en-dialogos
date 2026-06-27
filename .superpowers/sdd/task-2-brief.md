# Task 2: Progress module (progress.js)

**Files:**
- Modify: `js/progress.js`

**Interfaces:**
- Produces: `Progress.get(dialogId)` → `{ completed, score, lastStep }`, `Progress.set(dialogId, data)`, `Progress.getAll()` → `{ [dialogId]: ... }`, `Progress.getStats()` → `{ total, completed }`

### Step 1: Write progress.js — replace the placeholder with full implementation:

```javascript
/* js/progress.js */
const Progress = {
  STORAGE_KEY: 'espanol_progress',

  _load() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  },

  _save(data) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
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

### Step 2: Test manually
Open browser console on index.html, run:
```
Progress.set('dialog-1', { completed: true, score: 85, lastStep: 7 });
console.log(Progress.get('dialog-1'));
console.log(Progress.getStats());
Progress.set('dialog-1', { completed: false });
console.log(Progress.get('dialog-1').completed);
```
