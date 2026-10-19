/**
 * Event-Driven Architecture (EDA) Event Bus
 * Practical 10: Asynchronous Processing with Event-Driven Architecture
 */

const EventEmitter = require('events');

class AppEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(30);
    this.eventLog = [];
    this.maxLogs = 50;
  }

  logEvent(eventName, payload, consumers = []) {
    const entry = {
      id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      event: eventName,
      payload,
      consumers,
      timestamp: new Date().toISOString(),
      timeFormatted: new Date().toLocaleTimeString(),
    };
    this.eventLog.unshift(entry);
    if (this.eventLog.length > this.maxLogs) {
      this.eventLog.pop();
    }
    return entry;
  }

  getRecentEvents() {
    return this.eventLog;
  }
}

const eventBus = new AppEventBus();

// ==========================================
// ASYNCHRONOUS CONSUMERS (LISTENERS)
// Decoupled from the HTTP request cycle
// ==========================================

// Consumer 1: Asynchronous Audit Logger Service
eventBus.on('task:created', (data) => {
  setImmediate(() => {
    const consumers = ['AuditLogger', 'AnalyticsEngine'];
    console.log(`[Event: task:created] Task ID ${data.task._id} created by user ${data.user?.email || data.user?.id}`);
    eventBus.logEvent('task:created', { title: data.task.title, user: data.user?.email }, consumers);
  });
});

// Consumer 2: Asynchronous Notification Engine
eventBus.on('task:completed', (data) => {
  // Simulate non-blocking async notification dispatch
  setTimeout(() => {
    const consumers = ['NotificationService', 'SlackNotifier', 'AuditLogger'];
    console.log(`[Event: task:completed] 🎉 Task "${data.task.title}" completed! Dispatched email notification to ${data.user?.email || 'user'}`);
    eventBus.logEvent('task:completed', { title: data.task.title, user: data.user?.email, status: 'Notification Dispatched' }, consumers);
  }, 100);
});

// Consumer 3: State Change & Invalidation Tracker
eventBus.on('task:status_changed', (data) => {
  setImmediate(() => {
    const consumers = ['LifecycleTracker', 'CacheInvalidator'];
    console.log(`[Event: task:status_changed] Task "${data.task.title}" shifted to ${data.newStatus}`);
    eventBus.logEvent('task:status_changed', { title: data.task.title, newStatus: data.newStatus }, consumers);
  });
});

// Consumer 4: Task Deletion Tracker
eventBus.on('task:deleted', (data) => {
  setImmediate(() => {
    const consumers = ['AuditLogger', 'CacheInvalidator'];
    console.log(`[Event: task:deleted] Task ID ${data.taskId} removed`);
    eventBus.logEvent('task:deleted', { taskId: data.taskId }, consumers);
  });
});

module.exports = eventBus;
