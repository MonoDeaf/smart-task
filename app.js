import { TaskManager } from './taskManager.js';
import { UIManager } from './uiManager.js';
import { StorageManager } from './storageManager.js';

class App {
  constructor() {
    // Wait for DOM to be fully loaded before initializing
    document.addEventListener('DOMContentLoaded', () => {
      this.storage = new StorageManager();
      this.taskManager = new TaskManager(this.storage);
      this.taskManager.loadData(); // Load data before creating UI
      this.ui = new UIManager(this.taskManager);
      this.init();
    });
  }

  init() {
    this.ui.initializeUI();
  }
}

// Start the application
new App();