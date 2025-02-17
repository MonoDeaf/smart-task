export function sendWelcomeNotification() {
  if (Notification.permission === 'granted') {
    new Notification('Smart Task', {
      body: 'Ready to get locked in?',
      icon: '/smart-task/3079254-512.png'
    });
  }
}

export function sendTaskCompleteNotification(taskTitle) {
  // Play a notification sound
  const audio = new Audio('/message.wav');
  audio.play().catch(err => console.log('Error playing sound:', err));
  
  if (Notification.permission === 'granted') {
    new Notification('Timer Complete!', {
      body: `Time's up for task: ${taskTitle}`,
      icon: '/smart-task/3079254-512.png'
    });
  }
}