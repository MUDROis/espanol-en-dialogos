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
