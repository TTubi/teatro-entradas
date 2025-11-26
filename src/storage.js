const storage = {
  async get(key) {
    const value = localStorage.getItem(key);
    return value ? { key, value } : null;
  },
  
  async set(key, value) {
    localStorage.setItem(key, value);
    return { key, value };
  },
  
  async delete(key) {
    localStorage.removeItem(key);
    return { key, deleted: true };
  },
  
  async list(prefix = '') {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(prefix)) {
        keys.push(key);
      }
    }
    return { keys };
  }
};

window.storage = storage;