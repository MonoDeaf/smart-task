export class UIManager {
  constructor(taskManager) {
    this.taskManager = taskManager;
    this.currentPage = 'home';
    this.tasksChart = null;
    this.selectedBackground = null;
    this.charts = null;
    this.globalCharts = null;
    this.isMobileMenuOpen = false;

    // Add periodic update check
    this.startUpdateCheck();
    this.loadUserSettings();
    this.setupMobileMenu();
    this.setupThemeToggle();
  }

  initializeUI() {
    this.setupNavigation();
    this.setupEventListeners();
    this.setupGroupModal();
    this.updateHomePage();
  }

  setupNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar a');
    if (sidebarLinks) {
      sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const page = e.currentTarget.dataset.page;
          this.navigateTo(page);
        });
      });
    }
  }

  setupEventListeners() {
    // Add group card click handler
    document.addEventListener('click', (e) => {
      const addGroupCard = e.target.closest('#add-group-card');
      if (addGroupCard) {
        const modal = document.getElementById('new-group-modal');
        if (modal) modal.showModal();
      }
    });

    // We'll use event delegation for the task buttons since they might be recreated
    document.addEventListener('click', (e) => {
      // Add Task button handler
      if (e.target.matches('#add-task')) {
        const modal = document.getElementById('new-task-modal');
        if (modal) modal.showModal();
      }

      // Mark all tasks done button handler
      if (e.target.matches('#mark-all-done')) {
        if (this.taskManager.currentGroup) {
          this.taskManager.markAllTasksComplete(this.taskManager.currentGroup.id);
          this.updateGroupPage(this.taskManager.currentGroup.id);
        }
      }
    });

    // Cancel task button
    const cancelTaskBtn = document.getElementById('cancel-task');
    if (cancelTaskBtn) {
      cancelTaskBtn.addEventListener('click', () => {
        const modal = document.getElementById('new-task-modal');
        if (modal) modal.close();
      });
    }

    // Add due date toggle handler
    const dueDateCheckbox = document.getElementById('has-due-date');
    const dueDateInput = document.getElementById('task-due-date');
    const dueDatePresets = document.querySelector('.due-date-presets');
    
    if (dueDateCheckbox && dueDateInput) {
      dueDateCheckbox.addEventListener('change', (e) => {
        dueDateInput.disabled = !e.target.checked;
        dueDateInput.classList.toggle('active', e.target.checked);
        dueDatePresets.classList.toggle('active', e.target.checked);
        if (!e.target.checked) {
          document.querySelectorAll('.preset-btn').forEach(btn => 
            btn.classList.remove('selected')
          );
        }
      });
    }

    // Add preset buttons handler
    const presetButtons = document.querySelectorAll('.preset-btn');
    presetButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Remove selected class from all buttons
        presetButtons.forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        
        const now = new Date();
        let dueDate = new Date();
        
        // Set time to noon (12:00) for better UX
        dueDate.setHours(12, 0, 0, 0);
        
        switch(button.dataset.preset) {
          case 'today':
            // Keep current date, just set to noon
            break;
          case 'tomorrow':
            dueDate.setDate(dueDate.getDate() + 1);
            break;
          case 'next-week':
            dueDate.setDate(dueDate.getDate() + 7);
            break;
          case 'next-month':
            dueDate.setMonth(dueDate.getMonth() + 1);
            break;
        }
        
        // Format date for datetime-local input
        const formattedDate = dueDate.toISOString().slice(0, 16);
        dueDateInput.value = formattedDate;
      });
    });

    // New task form
    const newTaskForm = document.querySelector('#new-task-modal form');
    if (newTaskForm) {
      newTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('task-title')?.value || '';
        const hasDueDate = document.getElementById('has-due-date')?.checked || false;
        const dueDate = hasDueDate ? document.getElementById('task-due-date')?.value : null;
        
        if (this.taskManager.currentGroup) {
          this.taskManager.createTask(
            this.taskManager.currentGroup.id, 
            title, 
            dueDate
          );
          this.updateGroupPage(this.taskManager.currentGroup.id);
        }
        
        e.target.reset();
        document.getElementById('new-task-modal')?.close();
      });
    }

    // Settings form
    const saveSettingsBtn = document.getElementById('save-settings');
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', () => {
        const username = document.getElementById('username')?.value || 'User';
        localStorage.setItem('username', username);
        const welcomeEl = document.getElementById('welcome');
        if (welcomeEl) welcomeEl.textContent = `Welcome, ${username}`;
      });
    }

    // Setup color picker
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
      option.addEventListener('click', () => {
        colorOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        this.selectedBackground = {
          type: 'color',
          value: option.dataset.color
        };
      });
    });

    // Setup form submission
    const newGroupForm = document.querySelector('#new-group-modal form');
    if (newGroupForm) {
      newGroupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('group-name').value;
        if (name && this.selectedBackground) {
          const newGroup = this.taskManager.createGroup(name, this.selectedBackground);
          this.updateHomePage();
          // Reset form
          e.target.reset();
          document.querySelectorAll('.color-option').forEach(opt => 
            opt.classList.remove('selected')
          );
          document.getElementById('unsplash-images').innerHTML = '';
          this.selectedBackground = null;
          document.getElementById('new-group-modal').close();
        }
      });
    }

    // Setup cancel button
    const cancelBtn = document.getElementById('cancel-group');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        const modal = document.getElementById('new-group-modal');
        if (modal) {
          modal.close();
          newGroupForm.reset();
          document.querySelectorAll('.color-option').forEach(opt => 
            opt.classList.remove('selected')
          );
          document.getElementById('unsplash-images').innerHTML = '';
          this.selectedBackground = null;
        }
      });
    }
  }

  setupGroupModal() {
    const imageGrid = document.getElementById('unsplash-images');
    
    // We'll create a function to initialize/reset the image grid content
    const initializeImageGrid = () => {
      if (!imageGrid.hasChildNodes()) {
        const imageOptions = [
          'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
          'https://images.unsplash.com/photo-1624359136353-f60129a367b9?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
          'https://images.unsplash.com/photo-1634655377962-e6e7b446e7e9?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
          'https://images.unsplash.com/photo-1635776062764-e025521e3df3?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
          'https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
          'https://images.unsplash.com/photo-1635776062360-af423602aff3?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
          'https://images.unsplash.com/photo-1639493115942-a51a4c72f3c3?q=80&w=2080&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
          'https://images.unsplash.com/flagged/photo-1567934150921-7632371abb32?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
          'https://images.unsplash.com/photo-1597423244036-ef5020e83f3c?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
          'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?q=80&w=2666&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
          'https://images.unsplash.com/photo-1541512416146-3cf58d6b27cc?q=80&w=2674&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
          'https://images.unsplash.com/photo-1599054735388-bcb07bdd3574?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
          'https://images.unsplash.com/photo-1604871082903-5458d164167a?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
          'https://images.unsplash.com/photo-1627282058750-2b9ce74b6248?q=80&w=2616&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
          'https://images.unsplash.com/photo-1739477021967-e14dc3938e56?q=80&w=2671&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
          'https://images.unsplash.com/photo-1664309793544-f1d21a3a25d1?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
          'https://images.unsplash.com/photo-1739437455408-66aab68b5c0d?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
          'https://images.unsplash.com/photo-1739367156315-22b8ce82b23b?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
          'https://images.unsplash.com/photo-1728318781902-dc8f23961e95?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
          'https://images.unsplash.com/photo-1739057736231-3577bfc1a1b9?q=80&w=2650&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
        ];

        const imageGridHTML = imageOptions.map(url => `
          <button type="button" class="image-option" data-url="${url}">
            <img src="${url}" alt="Background option">
          </button>
        `).join('');
        
        imageGrid.innerHTML = imageGridHTML;

        // Setup image selection immediately after creating elements
        const imageButtons = imageGrid.querySelectorAll('.image-option');
        imageButtons.forEach(option => {
          option.addEventListener('click', () => {
            imageButtons.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            this.selectedBackground = {
              type: 'image',
              value: option.dataset.url
            };
          });
        });
      }
    };

    // Initialize image grid immediately
    initializeImageGrid();

    // Handle color selection
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
      option.addEventListener('click', () => {
        colorOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        this.selectedBackground = {
          type: 'color',
          value: option.dataset.color
        };
      });
    });

    // Reset selection when modal is opened
    const modal = document.getElementById('new-group-modal');
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.selectedBackground = null;
        document.querySelectorAll('.color-option, .image-option').forEach(opt => 
          opt.classList.remove('selected')
        );
      }
    });

    // Reset the form but preserve the image grid when canceling
    const cancelBtn = document.getElementById('cancel-group');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        const modal = document.getElementById('new-group-modal');
        const form = modal.querySelector('form');
        if (modal) {
          modal.close();
          form.reset();
          document.querySelectorAll('.color-option, .image-option').forEach(opt => 
            opt.classList.remove('selected')
          );
          this.selectedBackground = null;
          // Ensure image grid is initialized when reopening
          initializeImageGrid();
        }
      });
    }

    // Handle reopening the modal
    document.addEventListener('click', (e) => {
      if (e.target.closest('#add-group-card')) {
        initializeImageGrid();
      }
    });
  }

  setupMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const menuIcon = menuToggle.querySelector('img');

    if (menuToggle && sidebar) {
      menuToggle.addEventListener('click', () => {
        this.isMobileMenuOpen = !this.isMobileMenuOpen;
        sidebar.classList.toggle('active', this.isMobileMenuOpen);
        menuToggle.classList.toggle('active', this.isMobileMenuOpen);
        
        // Update icon based on menu state
        menuIcon.src = this.isMobileMenuOpen 
          ? 'https://static-00.iconduck.com/assets.00/sidebar-collapse-icon-512x512-ei3vscn2.png'
          : 'https://static-00.iconduck.com/assets.00/sidebar-expand-icon-512x512-uk1vk52t.png';
      });

      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (this.isMobileMenuOpen && 
            !e.target.closest('.sidebar') && 
            !e.target.closest('.menu-toggle')) {
          this.isMobileMenuOpen = false;
          sidebar.classList.remove('active');
          menuToggle.classList.remove('active');
          // Reset icon when closing menu
          menuIcon.src = 'https://static-00.iconduck.com/assets.00/sidebar-expand-icon-512x512-uk1vk52t.png';
        }
      });

      // Close menu when clicking on a menu item (mobile only)
      const menuItems = sidebar.querySelectorAll('a');
      menuItems.forEach(item => {
        item.addEventListener('click', () => {
          if (window.innerWidth <= 768) {
            this.isMobileMenuOpen = false;
            sidebar.classList.remove('active');
            menuToggle.classList.remove('active');
            // Reset icon when closing menu
            menuIcon.src = 'https://static-00.iconduck.com/assets.00/sidebar-expand-icon-512x512-uk1vk52t.png';
          }
        });
      });
    }
  }

  setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('change', () => {
        document.body.classList.toggle('light-mode', !themeToggle.checked);
        localStorage.setItem('theme', themeToggle.checked ? 'dark' : 'light');
      });
    }
  }

  navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`${page}-page`).classList.add('active');
    
    document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
    document.querySelector(`[data-page="${page}"]`).classList.add('active');
    
    this.currentPage = page;

    // Show/hide group cards based on page
    const groupStats = document.getElementById('group-stats');
    if (groupStats) {
      groupStats.style.display = page === 'home' ? 'flex' : 'none';
    }

    if (page === 'home') {
      this.updateHomePage();
    } else if (page === 'graphs') {
      // Always reinitialize the graphs page when navigating to it
      this.updateGraphsPage();
    } else if (page === 'updates') {
      this.updateUpdatesPage();
    }
  }

  getContrastColor(background) {
    if (!background) return '#ffffff'; // Default to white text
    return background.type === 'image' ? '#ffffff' : '#000000';
  }

  updateHomePage() {
    const groupStats = document.getElementById('group-stats');
    if (!groupStats) return;
    
    groupStats.innerHTML = '';

    const addGroupCard = document.createElement('div');
    addGroupCard.className = 'group-card add-group-card';
    addGroupCard.id = 'add-group-card';
    addGroupCard.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
      </svg>
      <h3>Create New Group</h3>
    `;
    groupStats.appendChild(addGroupCard);

    // Safely check if groups exist and have entries
    if (this.taskManager.groups && this.taskManager.groups.size > 0) {
      this.taskManager.groups.forEach(group => {
        if (!group) return; // Skip if group is undefined
        
        const groupCard = document.createElement('div');
        groupCard.className = 'group-card';
        
        // Safely check for background property
        const background = group.background || { type: 'color', value: '#ffffff' };
        const textColor = background.type === 'image' ? '#ffffff' : '#000000';
        
        if (background) {
          if (background.type === 'color') {
            groupCard.style.backgroundColor = background.value;
          } else if (background.type === 'image') {
            groupCard.style.setProperty('--bg-image', `url(${background.value})`);
            groupCard.style.backgroundImage = 'none';
            groupCard.innerHTML = `
              <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; 
                          background: rgba(0,0,0,0.3); border-radius: inherit; z-index: 1;"></div>
            `;
          }
        }

        groupCard.innerHTML += `
          <div class="dot-menu" style="color: ${textColor};">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
            <div class="dot-menu-content">
              <button class="rename-group" data-group-id="${group.id}">Rename</button>
              <button class="change-background" data-group-id="${group.id}">Change Background</button>
              <button class="delete-group" data-group-id="${group.id}">Delete Group</button>
            </div>
          </div>
          <div class="corner-arrow">
            <span class="iconify" data-icon="material-symbols:arrow-outward" width="24" height="24"></span>
          </div>
          <div style="position: relative; z-index: 1;">
            <h3 style="color: ${textColor}; opacity: 1 !important; font-weight: 600;">${group.name}</h3>
            <p style="color: ${textColor}; opacity: 1 !important;">${group.tasks ? group.tasks.size : 0} tasks</p>
          </div>
        `;
        
        const dotMenu = groupCard.querySelector('.dot-menu');
        const dotMenuContent = groupCard.querySelector('.dot-menu-content');
        
        dotMenu.addEventListener('click', (e) => {
          e.stopPropagation();
          dotMenuContent.classList.toggle('active');
        });

        // Add rename functionality
        const renameBtn = groupCard.querySelector('.rename-group');
        renameBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.showRenameDialog(group.id, group.name);
        });

        // Add change background functionality
        const changeBackgroundBtn = groupCard.querySelector('.change-background');
        changeBackgroundBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.showChangeBackgroundDialog(group.id);
        });

        const deleteBtn = groupCard.querySelector('.delete-group');
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.showDeleteConfirmation(group.id);
        });
        
        document.addEventListener('click', (e) => {
          if (!e.target.closest('.dot-menu')) {
            dotMenuContent.classList.remove('active');
          }
        });

        groupCard.addEventListener('click', (e) => {
          if (!e.target.closest('.dot-menu')) {
            this.taskManager.currentGroup = group;
            this.updateGroupPage(group.id);
            this.navigateTo('groups');
          }
        });
        
        groupStats.appendChild(groupCard);
      });
    }

    groupStats.style.display = 'flex';
    if (this.currentPage === 'graphs') {
      this.updateGraphsPage();
    }
  }

  showRenameDialog(groupId, currentName) {
    const dialog = document.createElement('dialog');
    dialog.className = 'confirmation-dialog';
    dialog.innerHTML = `
      <h3>Rename Group</h3>
      <div class="form-group">
        <input type="text" id="new-group-name" value="${currentName}" placeholder="Enter new name">
      </div>
      <div class="modal-buttons">
        <button class="btn secondary" id="cancel-rename">Cancel</button>
        <button class="btn" id="confirm-rename">Save</button>
      </div>
    `;
    
    document.body.appendChild(dialog);
    dialog.showModal();

    const input = dialog.querySelector('#new-group-name');
    input.select();

    dialog.querySelector('#cancel-rename').addEventListener('click', () => {
      dialog.close();
      dialog.remove();
    });

    dialog.querySelector('#confirm-rename').addEventListener('click', () => {
      const newName = input.value.trim();
      if (newName) {
        const group = this.taskManager.groups.get(groupId);
        if (group) {
          group.name = newName;
          this.taskManager.saveData();
          this.updateHomePage();
          if (this.taskManager.currentGroup && this.taskManager.currentGroup.id === groupId) {
            document.getElementById('group-title').textContent = newName;
          }
        }
      }
      dialog.close();
      dialog.remove();
    });
  }

  showChangeBackgroundDialog(groupId) {
    const dialog = document.createElement('dialog');
    dialog.className = 'confirmation-dialog';
    dialog.innerHTML = `
      <h3>Change Background</h3>
      <div class="group-customization">
        <div class="color-picker">
          <h4>Choose group color</h4>
          <div class="color-options">
            ${this.getColorOptions()}
          </div>
        </div>
        <div class="image-picker">
          <h4>Choose group Image</h4>
          <div class="image-grid" id="change-background-images"></div>
        </div>
      </div>
      <div class="modal-buttons">
        <button class="btn secondary" id="cancel-background">Cancel</button>
        <button class="btn" id="confirm-background">Save</button>
      </div>
    `;
    
    document.body.appendChild(dialog);
    dialog.showModal();

    this.setupImageGrid(dialog.querySelector('#change-background-images'));
    this.setupColorPicker(dialog.querySelector('.color-options'));

    dialog.querySelector('#cancel-background').addEventListener('click', () => {
      dialog.close();
      dialog.remove();
    });

    dialog.querySelector('#confirm-background').addEventListener('click', () => {
      if (this.selectedBackground) {
        const group = this.taskManager.groups.get(groupId);
        if (group) {
          group.background = this.selectedBackground;
          this.taskManager.saveData();
          this.updateHomePage();
        }
      }
      dialog.close();
      dialog.remove();
    });
  }

  getColorOptions() {
    const colors = [
      '#FF6B6B', '#FFC069', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FFB3B3', '#BFACE2', '#A6D1E6', '#FFDEB4', '#B5D5C5',
      '#F8C4B4', '#E8A0BF', '#B4E4FF', '#95BDFF', '#B4CDE6'
    ];
    
    return colors.map(color => `
      <button type="button" class="color-option" data-color="${color}" style="background-color: ${color}"></button>
    `).join('');
  }

  setupImageGrid(imageGrid) {
    const imageOptions = [
      'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1624359136353-f60129a367b9?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1634655377962-e6e7b446e7e9?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1635776062764-e025521e3df3?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1635776062360-af423602aff3?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1639493115942-a51a4c72f3c3?q=80&w=2080&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/flagged/photo-1567934150921-7632371abb32?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1597423244036-ef5020e83f3c?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?q=80&w=2666&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1541512416146-3cf58d6b27cc?q=80&w=2674&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1599054735388-bcb07bdd3574?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1604871082903-5458d164167a?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1627282058750-2b9ce74b6248?q=80&w=2616&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1739477021967-e14dc3938e56?q=80&w=2671&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1664309793544-f1d21a3a25d1?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1739437455408-66aab68b5c0d?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1739367156315-22b8ce82b23b?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1728318781902-dc8f23961e95?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1739057736231-3577bfc1a1b9?q=80&w=2650&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    ];

    const imageGridHTML = imageOptions.map(url => `
      <button type="button" class="image-option" data-url="${url}">
        <img src="${url}" alt="Background option">
      </button>
    `).join('');
    
    imageGrid.innerHTML = imageGridHTML;

    // Setup image selection immediately after creating elements
    const imageButtons = imageGrid.querySelectorAll('.image-option');
    imageButtons.forEach(option => {
      option.addEventListener('click', () => {
        imageButtons.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        this.selectedBackground = {
          type: 'image',
          value: option.dataset.url
        };
      });
    });
  }

  setupColorPicker(colorOptions) {
    const colors = [
      '#FF6B6B', '#FFC069', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FFB3B3', '#BFACE2', '#A6D1E6', '#FFDEB4', '#B5D5C5',
      '#F8C4B4', '#E8A0BF', '#B4E4FF', '#95BDFF', '#B4CDE6'
    ];
    
    const colorOptionsHTML = colors.map(color => `
      <button type="button" class="color-option" data-color="${color}" style="background-color: ${color}"></button>
    `).join('');
    
    colorOptions.innerHTML = colorOptionsHTML;

    const colorButtons = colorOptions.querySelectorAll('.color-option');
    colorButtons.forEach(option => {
      option.addEventListener('click', () => {
        colorButtons.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        this.selectedBackground = {
          type: 'color',
          value: option.dataset.color
        };
      });
    });
  }

  showDeleteConfirmation(groupId) {
    const dialog = document.createElement('dialog');
    dialog.className = 'confirmation-dialog';
    dialog.innerHTML = `
      <h3>Delete Group</h3>
      <p>Are you sure you want to delete this group? This action cannot be undone and all tasks within the group will be permanently deleted.</p>
      <div class="modal-buttons">
        <button class="btn secondary" id="cancel-delete">Cancel</button>
        <button class="btn danger" id="confirm-delete">Delete</button>
      </div>
    `;
    
    document.body.appendChild(dialog);
    dialog.showModal();

    dialog.querySelector('#cancel-delete').addEventListener('click', () => {
      dialog.close();
      dialog.remove();
    });

    dialog.querySelector('#confirm-delete').addEventListener('click', () => {
      this.taskManager.deleteGroup(groupId);
      this.updateHomePage();
      dialog.close();
      dialog.remove();
    });
  }

  setupNotesPanel() {
    // Create notes panel if it doesn't exist
    if (!document.querySelector('.notes-panel')) {
      const notesPanel = document.createElement('div');
      notesPanel.className = 'notes-panel';
      notesPanel.innerHTML = `
        <div class="notes-panel-header">
          <h3>Task Notes</h3>
          <button class="close-notes">
            <span class="iconify" data-icon="mdi:close" width="24" height="24"></span>
          </button>
        </div>
        <div class="notes-content">
          <textarea class="notes-textarea" placeholder="Add your notes here..."></textarea>
          <button class="save-notes">Save Notes</button>
        </div>
      `;
      document.body.appendChild(notesPanel);

      // Add event listeners
      const closeBtn = notesPanel.querySelector('.close-notes');
      closeBtn.addEventListener('click', () => {
        notesPanel.classList.remove('active');
      });

      // Close panel when clicking outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.notes-panel') && 
            !e.target.closest('.task-notes-btn')) {
          notesPanel.classList.remove('active');
        }
      });
    }
  }

  showNotesPanel(groupId, taskId, taskTitle) {
    this.setupNotesPanel();
    const notesPanel = document.querySelector('.notes-panel');
    const textarea = notesPanel.querySelector('.notes-textarea');
    const saveBtn = notesPanel.querySelector('.save-notes');
    const header = notesPanel.querySelector('h3');
    
    // Update panel title to show just the task title
    header.textContent = taskTitle;
    
    // Load existing notes
    textarea.value = this.taskManager.getTaskNotes(groupId, taskId);
    
    // Show panel
    notesPanel.classList.add('active');
    
    // Remove existing event listener if any
    saveBtn.replaceWith(saveBtn.cloneNode(true));
    
    // Add new event listener
    notesPanel.querySelector('.save-notes').addEventListener('click', () => {
      this.taskManager.saveTaskNotes(groupId, taskId, textarea.value);
      notesPanel.classList.remove('active');
    });
  }

  updateGroupPage(groupId) {
    const group = this.taskManager.groups.get(groupId);
    if (!group) return;

    // Create audio elements for completion sounds
    const partySound = new Audio('/notification-2-269292.mp3'); 
    const messageSound = new Audio('/Windows Notify System Generic.wav'); 
    const achievementSound = new Audio('/best-notification-1-286672.mp3'); 
    const notifySound = new Audio('/new message.mp3'); 

    const groupHeader = document.querySelector('.group-header');
    groupHeader.style.backgroundColor = 'var(--bg-secondary)';
    
    // Set the background based on group's background settings
    if (group.background) {
      if (group.background.type === 'image') {
        groupHeader.style.backgroundImage = `url(${group.background.value})`;
        groupHeader.style.backgroundSize = 'cover';
        groupHeader.style.backgroundPosition = 'center';
      } else {
        groupHeader.style.backgroundColor = group.background.value;
        // Remove any existing background image
        groupHeader.style.backgroundImage = 'none';
      }
    }

    document.getElementById('group-title').textContent = group.name;
    
    const tasksContainer = document.querySelector('.tasks-container');
    tasksContainer.innerHTML = ''; // Clear existing content
    
    const tasksListDiv = document.createElement('div');
    tasksListDiv.className = 'tasks-list';
    tasksListDiv.innerHTML = `
      <div class="tasks-header">
        <h3>Tasks</h3>
        <div class="tasks-actions">
          <button id="add-task" class="btn">Add Task</button>
          <button id="mark-all-done" class="btn">Mark All Tasks Done For Today</button>
        </div>
      </div>
      <div id="incomplete-tasks"></div>
      
      <h3>Completed</h3>
      <div id="complete-tasks"></div>
    `;
    tasksContainer.appendChild(tasksListDiv);

    const incompleteTasks = document.getElementById('incomplete-tasks');
    const completeTasks = document.getElementById('complete-tasks');
    
    incompleteTasks.innerHTML = '';
    completeTasks.innerHTML = '';

    let totalTasks = 0;
    let completedCount = 0;
    let uncompletedCount = 0;

    if (group.tasks.size === 0) {
      incompleteTasks.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: left; padding: 3rem; color: var(--text-secondary);">
          <svg viewBox="0 0 24 24" width="48" height="48" style="margin-bottom: 1rem; opacity: 0.5;">
            <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            <path fill="currentColor" d="M12 7c-.55 0-1 .45-1 1v3H8c-.55 0-1 .45-1 1s.45 1 1 1h3v3c0 .55.45 1 1 1s1-.45 1-1v-3h3c.55 0 1-.45 1-1s-.45-1-1-1h-3V8c0-.55-.45-1-1-1z"/>
          </svg>
          <h3 style="margin-bottom: 0.5rem; color: var(--text-secondary);">No tasks yet</h3>
          <p style="margin: 0; opacity: 0.7;">Click the "Add Task" button to create your first task</p>
        </div>
      `;
      completeTasks.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: left; padding: 3rem; color: var(--text-secondary);">
          <p style="margin: 0; opacity: 0.7;">Completed tasks will appear here</p>
        </div>
      `;
    } else {
      group.tasks.forEach(task => {
        totalTasks++;
        if (task.completed) {
          completedCount++;
        } else {
          uncompletedCount++;
        }

        const taskElement = document.createElement('div');
        
        let taskClasses = ['task-item'];
        if (task.completed) {
          taskClasses.push('completed');
        }
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate);
          const today = new Date();
          
          // Reset time parts to compare just the dates
          today.setHours(0, 0, 0, 0);
          dueDate.setHours(0, 0, 0, 0);
          
          if (dueDate < today) {
            taskClasses.push('overdue');
          } else if (dueDate.getTime() === today.getTime()) {
            taskClasses.push('due-today');
          }
        }
        
        taskElement.className = taskClasses.join(' ');

        taskElement.innerHTML = `
          <input type="checkbox" ${task.completed ? 'checked' : ''}>
          <div class="task-content">
            <div class="task-header">
              <h4>${task.title}</h4>
              ${task.dueDate ? `
                <span class="due-date ${new Date(task.dueDate) < new Date() ? 'overdue' : ''}">
                  Due: ${this.getRelativeDateDisplay(task.dueDate)}
                </span>
              ` : ''}
            </div>
            <div class="task-actions">
              ${!task.completed ? `
                <button class="task-view-btn" data-task-id="${task.id}" title="View task">
                  <span class="iconify" data-icon="material-symbols:select-window-2" width="20" height="20"></span>
                  Open
                </button>
                <button class="task-notes-btn" data-task-id="${task.id}" title="Task notes">
                  <span class="iconify" data-icon="mdi:note-edit-outline" width="20" height="20"></span>
                  Notes
                </button>
              ` : ''}
              <button class="task-delete-btn" data-task-id="${task.id}" title="Delete task">
                <svg viewBox="0 0 24 24">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
              </button>
            </div>
          </div>
        `;

        taskElement.querySelector('input').addEventListener('change', (e) => {
          if (e.target.checked) {
            const selectedSound = localStorage.getItem('completionSound') || 'achievement';
            if (selectedSound === 'party') {
              partySound.currentTime = 0;
              partySound.play().catch(err => console.log('Error playing sound:', err));
            } else if (selectedSound === 'message') {
              messageSound.currentTime = 0;
              messageSound.play().catch(err => console.log('Error playing sound:', err));
            } else if (selectedSound === 'achievement') {
              achievementSound.currentTime = 0;
              achievementSound.play().catch(err => console.log('Error playing sound:', err));
            } else if (selectedSound === 'notify') {
              notifySound.currentTime = 0;
              notifySound.play().catch(err => console.log('Error playing sound:', err));
            }
          }
          this.taskManager.toggleTask(groupId, task.id);
          taskElement.classList.toggle('completed', e.target.checked);
          setTimeout(() => this.updateGroupPage(groupId), 300);
        });

        const viewBtn = taskElement.querySelector('.task-view-btn');
        if (viewBtn) {
          viewBtn.addEventListener('click', () => {
            this.showTaskView(task);
          });
        }

        const notesBtn = taskElement.querySelector('.task-notes-btn');
        if (notesBtn) {
          notesBtn.addEventListener('click', () => {
            this.showNotesPanel(groupId, task.id, task.title);
          });
        }

        taskElement.querySelector('.task-delete-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          this.showDeleteTaskConfirmation(groupId, task.id);
        });

        if (task.completed) {
          completeTasks.appendChild(taskElement);
        } else {
          incompleteTasks.appendChild(taskElement);
        }
      });
    }

    this.updateCharts(groupId);
  }

  showDeleteTaskConfirmation(groupId, taskId) {
    const dialog = document.createElement('dialog');
    dialog.className = 'confirmation-dialog';
    dialog.innerHTML = `
      <h3>Delete Task</h3>
      <p>Are you sure you want to delete this task? This action cannot be undone.</p>
      <div class="modal-buttons">
        <button class="btn secondary" id="cancel-delete">Cancel</button>
        <button class="btn danger" id="confirm-delete">Delete</button>
      </div>
    `;
    
    document.body.appendChild(dialog);
    dialog.showModal();

    dialog.querySelector('#cancel-delete').addEventListener('click', () => {
      dialog.close();
      dialog.remove();
    });

    dialog.querySelector('#confirm-delete').addEventListener('click', () => {
      this.taskManager.deleteTask(groupId, taskId);
      this.updateGroupPage(groupId);
      dialog.close();
      dialog.remove();
    });
  }

  showTaskView(task) {
    const params = new URLSearchParams({
      title: task.title,
      description: task.description || 'No description provided',
      status: task.completed ? 'Completed' : 'In Progress',
      created: new Date(task.createdAt).toLocaleString(),
      completed: task.completedAt ? new Date(task.completedAt).toLocaleString() : 'Not completed',
      dueDate: task.dueDate ? new Date(task.dueDate).toLocaleString() : 'No due date set'
    });

    const taskWindow = window.open(
      `/task-view.html?${params.toString()}`,
      '_blank',
      'width=300,height=400,resizable=yes,scrollbars=yes,alwaysOnTop=yes'
    );
  }

  updateCharts(groupId) {
    const stats = this.taskManager.getGroupStats(groupId);
  
    if (this.charts) {
      Object.values(this.charts).forEach(chart => chart.destroy());
    }
  
    this.charts = {};

    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-grid';
    chartContainer.innerHTML = `
      <div class="chart-card">
        <h3>Completed Tasks</h3>
        <canvas id="groupCompletedChart"></canvas>
      </div>
      <div class="chart-card">
        <h3>Uncompleted Tasks</h3>
        <canvas id="groupUncompletedChart"></canvas>
      </div>
      <div class="chart-card">
        <h3>Created Tasks</h3>
        <canvas id="groupCreatedChart"></canvas>
      </div>
    `;

    document.querySelector('.tasks-container').appendChild(chartContainer);

    const chartConfig = {
      type: 'line',
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    };

    // Calculate total tasks and uncompleted tasks for each date
    const uncompletedData = stats.map(stat => {
      const totalTasksAtDate = Array.from(this.taskManager.groups.get(groupId).tasks.values())
        .filter(task => new Date(task.createdAt) <= new Date(stat.date)).length;
      return totalTasksAtDate - stat.completed;
    });

    this.charts.completed = new Chart('groupCompletedChart', {
      ...chartConfig,
      data: {
        labels: stats.map(stat => stat.date),
        datasets: [{
          data: stats.map(stat => stat.completed),
          borderColor: '#43b581',
          backgroundColor: 'rgba(67, 181, 129, 0.2)',
          tension: 0.4,
          fill: true
        }]
      }
    });

    this.charts.uncompleted = new Chart('groupUncompletedChart', {
      ...chartConfig,
      data: {
        labels: stats.map(stat => stat.date),
        datasets: [{
          data: uncompletedData,
          borderColor: '#f04747',
          backgroundColor: 'rgba(240, 71, 71, 0.2)',
          tension: 0.4,
          fill: true
        }]
      }
    });

    this.charts.created = new Chart('groupCreatedChart', {
      ...chartConfig,
      data: {
        labels: stats.map(stat => stat.date),
        datasets: [{
          data: stats.map(stat => stat.created),
          borderColor: '#7289da',
          backgroundColor: 'rgba(114, 137, 218, 0.2)',
          tension: 0.4,
          fill: true
        }]
      }
    });
  }

  updateGraphsPage() {
    const stats = this.taskManager.getTotalStats();

    // Update stat cards
    document.getElementById('total-tasks').textContent = stats.total;
    document.getElementById('total-completed').textContent = stats.completed;
    document.getElementById('total-uncompleted').textContent = stats.uncompleted;
    document.getElementById('completion-rate').textContent = `${stats.completionRate}%`;
    document.getElementById('most-active-day').textContent = stats.mostActiveDay || 'N/A';
    document.getElementById('avg-completion-time').textContent = stats.avgCompletionTime || 'N/A';
    document.getElementById('peak-activity-time').textContent = stats.peakActivityTime || 'N/A';
    document.getElementById('longest-streak').textContent = `${stats.longestStreak} days`;

    const allStats = this.taskManager.getAllTaskStats();

    // Create new charts if they don't exist, otherwise update existing ones
    const chartConfig = {
      type: 'line',
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    };

    // Update or create each chart
    ['allTasksChart', 'completionRateChart', 'creationTrendChart', 'activityHeatChart', 'weekdayActivityChart'].forEach(chartId => {
      const ctx = document.getElementById(chartId);
      if (!ctx) return;

      // Destroy existing chart if it exists
      if (this.globalCharts?.[chartId]) {
        this.globalCharts[chartId].destroy();
      }

      let data;
      switch(chartId) {
        case 'allTasksChart':
          data = {
            labels: allStats.map(stat => stat.date),
            datasets: [{
              data: allStats.map(stat => stat.total),
              borderColor: '#7289da',
              backgroundColor: 'rgba(114, 137, 218, 0.2)',
              tension: 0.4,
              fill: true
            }]
          };
          break;
        case 'completionRateChart':
          data = {
            labels: allStats.map(stat => stat.date),
            datasets: [{
              data: allStats.map(stat => 
                stat.total > 0 ? (stat.completed / stat.total * 100).toFixed(1) : 0
              ),
              borderColor: '#faa61a',
              backgroundColor: 'rgba(250, 166, 26, 0.2)',
              tension: 0.4,
              fill: true
            }]
          };
          break;
        case 'creationTrendChart':
          data = {
            labels: allStats.map(stat => stat.date),
            datasets: [{
              data: allStats.map(stat => stat.created),
              borderColor: '#ff6b6b',
              backgroundColor: 'rgba(255, 107, 107, 0.2)',
              tension: 0.4,
              fill: true
            }]
          };
          break;
        case 'activityHeatChart':
          data = {
            labels: ['12am', '3am', '6am', '9am', '12pm', '3pm', '6pm', '9pm'],
            datasets: [{
              data: stats.hourlyActivity,
              borderColor: '#43b581',
              backgroundColor: 'rgba(67, 181, 129, 0.2)',
              tension: 0.4,
              fill: true
            }]
          };
          break;
        case 'weekdayActivityChart':
          data = {
            labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            datasets: [{
              data: stats.weekdayActivity,
              borderColor: '#7289da',
              backgroundColor: 'rgba(114, 137, 218, 0.2)',
              tension: 0.4,
              fill: true
            }]
          };
          break;
      }

      if (!this.globalCharts) this.globalCharts = {};
      this.globalCharts[chartId] = new Chart(ctx, {
        ...chartConfig,
        data
      });
    });
  }

  loadUserSettings() {
    if (!localStorage.getItem('completionSound')) {
      localStorage.setItem('completionSound', 'message');
    }

    if (!localStorage.getItem('theme')) {
      localStorage.setItem('theme', 'dark');
    }

    const selectedSound = localStorage.getItem('completionSound');
    const soundInput = document.querySelector(`input[name="completion-sound"][value="${selectedSound}"]`);
    if (soundInput) {
      soundInput.checked = true;
    }

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.checked = localStorage.getItem('theme') !== 'light';
      document.body.classList.toggle('light-mode', localStorage.getItem('theme') === 'light');
    }

    const soundOptions = document.querySelectorAll('input[name="completion-sound"]');
    soundOptions.forEach(option => {
      option.addEventListener('change', (e) => {
        if (e.target.checked) {
          localStorage.setItem('completionSound', e.target.value);
        }
      });
    });

    const playButtons = document.querySelectorAll('.play-button');
    playButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const soundType = button.dataset.sound;
        if (soundType === 'party') {
          const audio = new Audio('/notification-2-269292.mp3');
          audio.play().catch(err => console.log('Error playing sound:', err));
        } else if (soundType === 'message') {
          const audio = new Audio('/Windows Notify System Generic.wav');
          audio.play().catch(err => console.log('Error playing sound:', err));
        } else if (soundType === 'achievement') {
          const audio = new Audio('/best-notification-1-286672.mp3');
          audio.play().catch(err => console.log('Error playing sound:', err));
        } else if (soundType === 'notify') {
          const audio = new Audio('/new message.mp3');
          audio.play().catch(err => console.log('Error playing sound:', err));
        }
      });
    });
  }

  getRelativeDateDisplay(dateStr) {
    const dueDate = new Date(dateStr);
    const today = new Date();
    
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    // Check if the dates match our presets
    if (dueDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (dueDate.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else if (dueDate > today && dueDate <= nextWeek) {
      return 'Next Week';
    } else if (dueDate > today && dueDate <= nextMonth) {
      return 'Next Month';
    }
    
    // If it doesn't match any preset, return the formatted date
    return new Date(dateStr).toLocaleString();
  }

  updateUpdatesPage() {
    const updatesContainer = document.querySelector('.updates-container');
    if (!updatesContainer) return;

    import('./updates.js').then(({ updates, setLastSeenVersion, getLatestVersion }) => {
      // Update the container with updates
      updatesContainer.innerHTML = updates.map(update => `
        <div class="update-card">
          <div class="version">Version ${update.version}</div>
          <div class="date">${update.date}</div>
          <h3>${update.title}</h3>
          <ul>
            ${update.changes.map(change => `
              <li>${change}</li>
            `).join('')}
          </ul>
        </div>
      `).join('');

      // Mark updates as seen
      setLastSeenVersion(getLatestVersion());
      
      // Remove the indicator
      const indicator = document.querySelector('.update-indicator');
      if (indicator) {
        indicator.classList.remove('active');
      }
    });
  }

  updateUpdatesIndicator() {
    import('./updates.js').then(({ hasNewUpdates }) => {
      const updateIcon = document.querySelector('[data-page="updates"]');
      const indicator = updateIcon.querySelector('.update-indicator') || (() => {
        const div = document.createElement('div');
        div.className = 'update-indicator';
        updateIcon.appendChild(div);
        return div;
      })();
      
      indicator.classList.toggle('active', hasNewUpdates());
    });
  }

  startUpdateCheck() {
    // Check immediately on load
    this.updateUpdatesIndicator();
    
    // Then check every 30 minutes
    setInterval(() => {
      this.updateUpdatesIndicator();
    }, 30 * 60 * 1000);
  }
}