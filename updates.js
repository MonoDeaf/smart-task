export const updates = [
  {
    version: "0.8.0",
    date: "February 2025",
    title: "UI Improvements & Changes",
    changes: [
      "Launch of Smart Task with core features",
      "Task group management system",
      "Basic task tracking functionality",
      "Light mode support",
      "Removal of task window - Internal widgets will replace task window"
    ]
    title: "Known Issues",
    changes: [
      "Tasks delete buttons overlap task blocks",
      "Notifications not working"
    ]
  }
];

export function getLatestVersion() {
  return updates[0].version;
}

export function getLastSeenVersion() {
  return localStorage.getItem('lastSeenVersion') || '0.0.0';
}

export function setLastSeenVersion(version) {
  localStorage.setItem('lastSeenVersion', version);
}

export function hasNewUpdates() {
  const lastSeen = getLastSeenVersion();
  const latest = getLatestVersion();
  return lastSeen !== latest;
}
