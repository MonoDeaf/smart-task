export class TaskManager {
  constructor(storage) {
    this.storage = storage;
    this.groups = new Map();
    this.currentGroup = null;
  }

  loadData() {
    const data = this.storage.getData();
    if (data && data.groups) {
      data.groups.forEach(group => {
        const tasksMap = new Map();
        if (Array.isArray(group.tasks)) {
          group.tasks.forEach(task => {
            tasksMap.set(task.id, {
              ...task,
              createdAt: new Date(task.createdAt),
              completedAt: task.completedAt ? new Date(task.completedAt) : null
            });
          });
        }
        
        this.groups.set(group.id, {
          id: group.id,
          name: group.name,
          background: group.background, // Store the background object instead of just color
          tasks: tasksMap,
          stats: group.stats || {
            complete: 0,
            incomplete: 0
          }
        });
      });
    }
  }

  createGroup(name, background) {
    const group = {
      id: Date.now().toString(),
      name,
      background: background || { type: 'color', value: '#ffffff' }, // Provide default if undefined
      tasks: new Map(),
      stats: {
        complete: 0,
        incomplete: 0
      }
    };
    this.groups.set(group.id, group);
    this.saveData();
    return group;
  }

  createTask(groupId, title, description) {
    const task = {
      id: Date.now().toString(),
      title,
      description,
      completed: false,
      createdAt: new Date(),
      completedAt: null
    };
    
    const group = this.groups.get(groupId);
    if (group) {
      group.tasks.set(task.id, task);
      group.stats.incomplete++;
      this.saveData();
    }
    return task;
  }

  toggleTask(groupId, taskId) {
    const group = this.groups.get(groupId);
    if (group) {
      const task = group.tasks.get(taskId);
      if (task) {
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date() : null;
        group.stats[task.completed ? 'complete' : 'incomplete']++;
        group.stats[task.completed ? 'incomplete' : 'complete']--;
        this.saveData();
      }
    }
  }

  markAllTasksComplete(groupId) {
    const group = this.groups.get(groupId);
    if (group) {
      group.tasks.forEach(task => {
        if (!task.completed) {
          task.completed = true;
          task.completedAt = new Date();
          group.stats.complete++;
          group.stats.incomplete--;
        }
      });
      this.saveData();
    }
  }

  getGroupStats(groupId) {
    const group = this.groups.get(groupId);
    if (!group) return null;

    const today = new Date();
    const lastWeek = new Array(7).fill(0).map((_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      return date;
    }).reverse();

    const stats = lastWeek.map(date => {
      const completed = Array.from(group.tasks.values()).filter(task => 
        task.completedAt && 
        task.completedAt.toDateString() === date.toDateString()
      ).length;

      const created = Array.from(group.tasks.values()).filter(task =>
        task.createdAt.toDateString() === date.toDateString()
      ).length;

      return {
        date: date.toLocaleDateString(),
        completed,
        created
      };
    });

    return stats;
  }

  deleteTask(groupId, taskId) {
    const group = this.groups.get(groupId);
    if (group) {
      const task = group.tasks.get(taskId);
      if (task) {
        // Update stats before deleting
        if (task.completed) {
          group.stats.complete--;
        } else {
          group.stats.incomplete--;
        }
        group.tasks.delete(taskId);
        this.saveData();
      }
    }
  }

  saveData() {
    const data = {
      groups: Array.from(this.groups.values()).map(group => ({
        id: group.id,
        name: group.name,
        background: group.background, // Store the background object instead of just color
        stats: group.stats,
        tasks: Array.from(group.tasks.values()).map(task => ({
          ...task,
          createdAt: task.createdAt.toISOString(),
          completedAt: task.completedAt ? task.completedAt.toISOString() : null
        }))
      }))
    };
    this.storage.saveData(data);
  }

  deleteGroup(groupId) {
    this.groups.delete(groupId);
    this.saveData();
  }
}