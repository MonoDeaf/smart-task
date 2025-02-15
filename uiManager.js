export class UIManager {
  constructor(taskManager) {
    this.taskManager = taskManager;
    this.currentPage = 'home';
    this.tasksChart = null;
    this.selectedBackground = null;
    this.charts = null;
    this.isMobileMenuOpen = false;
  }

  initializeUI() {
    this.setupNavigation();
    this.setupEventListeners();
    this.setupGroupModal();
    this.updateHomePage();
    this.loadUserSettings();
    this.setupMobileMenu();
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

    // New task form
    const newTaskForm = document.querySelector('#new-task-modal form');
    if (newTaskForm) {
      newTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('task-title')?.value || '';
        const description = document.getElementById('task-description')?.value || '';
        
        if (this.taskManager.currentGroup) {
          this.taskManager.createTask(this.taskManager.currentGroup.id, title, description);
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
            groupCard.style.backgroundImage = `url(${background.value})`;
            groupCard.style.backgroundSize = 'cover';
            groupCard.style.backgroundPosition = 'center';
            groupCard.innerHTML = `
              <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; 
                          background: rgba(0,0,0,0.3); border-radius: inherit;"></div>
            `;
          }
        }

        groupCard.innerHTML += `
          <div class="dot-menu" style="color: ${textColor};">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
            <div class="dot-menu-content">
              <button class="delete-group" data-group-id="${group.id}">Delete Group</button>
            </div>
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

  updateGroupPage(groupId) {
    const group = this.taskManager.groups.get(groupId);
    if (!group) return;

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

    group.tasks.forEach(task => {
      totalTasks++;
      if (task.completed) {
        completedCount++;
      } else {
        uncompletedCount++;
      }

      const taskElement = document.createElement('div');
      taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
      taskElement.innerHTML = `
        <input type="checkbox" ${task.completed ? 'checked' : ''}>
        <div class="task-content">
          <h4>${task.title}</h4>
          ${task.description ? `<p>${task.description}</p>` : ''}
        </div>
        <button class="task-delete-btn" data-task-id="${task.id}" title="Delete task">
          <svg viewBox="0 0 24 24">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
      `;

      // Add checkbox event listener
      taskElement.querySelector('input').addEventListener('change', (e) => {
        this.taskManager.toggleTask(groupId, task.id);
        taskElement.classList.toggle('completed', e.target.checked);
        setTimeout(() => this.updateGroupPage(groupId), 300);
      });

      // Add delete button event listener
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

    // ... rest of existing updateGroupPage code ...
    const statsContainer = document.createElement('div');
    statsContainer.className = 'stats-grid';
    statsContainer.innerHTML = `
      <div class="stat-card">
        <h3>Total Tasks</h3>
        <div class="stat-value">${totalTasks}</div>
      </div>
      <div class="stat-card">
        <h3>Completed Tasks</h3>
        <div class="stat-value">${completedCount}</div>
      </div>
      <div class="stat-card">
        <h3>Uncompleted Tasks</h3>
        <div class="stat-value">${uncompletedCount}</div>
      </div>
    `;

    tasksContainer.appendChild(statsContainer);

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

  updateCharts(groupId) {
    const stats = this.taskManager.getGroupStats(groupId);
  
    if (this.charts) {
      Object.values(this.charts).forEach(chart => chart.destroy());
    }
  
    this.charts = {};

    const chartContainer = document.querySelector('.chart-grid') || document.createElement('div');
    chartContainer.className = 'chart-grid';
    chartContainer.innerHTML = `
      <div class="chart-card">
        <h3>Completed Tasks</h3>
        <canvas id="completedChart"></canvas>
      </div>
      <div class="chart-card">
        <h3>Uncompleted Tasks</h3>
        <canvas id="uncompletedChart"></canvas>
      </div>
      <div class="chart-card">
        <h3>Created Tasks</h3>
        <canvas id="createdChart"></canvas>
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

    this.charts.completed = new Chart('completedChart', {
      ...chartConfig,
      data: {
        labels: stats.map(stat => stat.date),
        datasets: [{
          data: stats.map(stat => stat.completed),
          borderColor: '#43b581',
          tension: 0.4
        }]
      }
    });

    this.charts.uncompleted = new Chart('uncompletedChart', {
      ...chartConfig,
      data: {
        labels: stats.map(stat => stat.date),
        datasets: [{
          data: stats.map(stat => stats[0].total - stat.completed),
          borderColor: '#f04747',
          tension: 0.4
        }]
      }
    });

    this.charts.created = new Chart('createdChart', {
      ...chartConfig,
      data: {
        labels: stats.map(stat => stat.date),
        datasets: [{
          data: stats.map(stat => stat.created),
          borderColor: '#7289da',
          tension: 0.4
        }]
      }
    });
  }

  loadUserSettings() {
    const username = localStorage.getItem('username') || 'User';
    const isDarkMode = localStorage.getItem('darkMode') !== 'light';
    
    document.getElementById('username').value = username;
    document.getElementById('welcome').textContent = `Welcome, ${username}`;
    document.getElementById('theme-toggle').checked = isDarkMode;
    
    // Set initial theme
    document.body.classList.toggle('light-mode', !isDarkMode);
    
    // Add theme toggle listener
    document.getElementById('theme-toggle').addEventListener('change', (e) => {
      const isLight = !e.target.checked;
      document.body.classList.toggle('light-mode', isLight);
      localStorage.setItem('darkMode', isLight ? 'light' : 'dark');
    });
  }
}