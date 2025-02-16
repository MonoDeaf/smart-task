export function requestNotificationPermission() {
  if (Notification.permission !== 'granted') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        sendWelcomeNotification();
      }
    });
  }
}

export function sendWelcomeNotification() {
  if (Notification.permission === 'granted') {
    new Notification('Smart Task', {
      body: 'Ready to get locked in?',
      icon: '/3079254-512.png'
    });
  }
}

export function sendTaskCompleteNotification(taskTitle) {
  if (Notification.permission === 'granted') {
    new Notification('Timer Complete!', {
      body: `Time's up for task: ${taskTitle}`,
      icon: '/3079254-512.png'
    });
  }
}