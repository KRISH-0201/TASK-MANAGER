/**
 * Asynchronous Background Job Queue Manager
 * Practical 10: Asynchronous Processing with Event-Driven Architecture
 * 
 * Demonstrates:
 * - Decoupling long-running tasks from the client HTTP request/response cycle
 * - HTTP 202 Accepted pattern with non-blocking job ID returns
 * - Incremental progress tracking (0% -> 100%)
 * - Event emission across job lifecycle
 */

const eventBus = require('./eventBus');

class AsyncQueue {
  constructor() {
    this.jobs = new Map();
    this.maxJobs = 50;
  }

  /**
   * Enqueue a new background export job
   * Returns immediately with jobId and initial status
   */
  createExportJob(userId, userEmail, tasks = []) {
    const jobId = 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    
    const job = {
      id: jobId,
      type: 'TASK_DATA_EXPORT',
      userId,
      userEmail,
      status: 'queued',
      progress: 0,
      step: 'Job queued in background worker',
      taskCount: tasks.length,
      result: null,
      error: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
    };

    this.jobs.set(jobId, job);
    if (this.jobs.size > this.maxJobs) {
      const oldestKey = this.jobs.keys().next().value;
      this.jobs.delete(oldestKey);
    }

    // Emit event: job created
    eventBus.emit('job:created', { jobId, type: job.type, userEmail });
    eventBus.logEvent('job:created', { jobId, userEmail, taskCount: tasks.length }, ['AsyncJobQueue', 'AuditLogger']);

    // Start background processing without blocking the HTTP thread
    setImmediate(() => {
      this.processExportJob(jobId, tasks);
    });

    return job;
  }

  /**
   * Asynchronous non-blocking worker simulation
   * Simulates staged processing (0% -> 25% -> 50% -> 75% -> 100%)
   */
  processExportJob(jobId, tasks) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'processing';
    job.updatedAt = new Date().toISOString();

    const stages = [
      { progress: 25, step: 'Aggregating task statistics & metadata', delay: 500 },
      { progress: 50, step: 'Generating structured JSON & CSV export payloads', delay: 600 },
      { progress: 75, step: 'Validating cryptographic checksum & data integrity', delay: 500 },
      { progress: 100, step: 'Export report finalized and ready for download', delay: 400 },
    ];

    let currentStage = 0;

    const runNextStage = () => {
      if (currentStage >= stages.length) {
        // Complete job
        job.status = 'completed';
        job.progress = 100;
        job.completedAt = new Date().toISOString();
        job.updatedAt = job.completedAt;

        // Generate output artifact payload
        const completedTasks = tasks.filter(t => t.status === 'completed' || t.completed).length;
        const ongoingTasks = tasks.filter(t => t.status === 'ongoing').length;
        const pendingTasks = tasks.filter(t => t.status === 'pending').length;

        job.result = {
          fileName: `tasks_export_${Date.now()}.json`,
          summary: {
            totalTasks: tasks.length,
            completed: completedTasks,
            ongoing: ongoingTasks,
            pending: pendingTasks,
            completionRate: tasks.length ? `${Math.round((completedTasks / tasks.length) * 100)}%` : '0%',
            exportedAt: new Date().toISOString(),
          },
          downloadPayload: tasks,
        };

        eventBus.emit('job:completed', { jobId, userEmail: job.userEmail });
        eventBus.logEvent('job:completed', { jobId, summary: job.result.summary }, ['AsyncJobQueue', 'NotificationService', 'AuditLogger']);
        return;
      }

      const stage = stages[currentStage];
      setTimeout(() => {
        job.progress = stage.progress;
        job.step = stage.step;
        job.updatedAt = new Date().toISOString();
        
        eventBus.emit('job:progress', { jobId, progress: job.progress, step: job.step });
        currentStage++;
        runNextStage();
      }, stage.delay);
    };

    runNextStage();
  }

  getJob(jobId) {
    return this.jobs.get(jobId) || null;
  }

  getUserJobs(userId) {
    const userJobs = [];
    for (const job of this.jobs.values()) {
      if (job.userId === userId) {
        userJobs.unshift(job);
      }
    }
    return userJobs;
  }

  /**
   * Benchmark comparison utility
   * Synchronously blocks thread vs Asynchronously dispatches
   */
  async runBenchmarkComparison(tasksCount = 10) {
    // 1. Synchronous Simulation (blocking response cycle)
    const syncStart = Date.now();
    // Simulate synchronous heavy computation / blocking email dispatch (1200ms)
    await new Promise(resolve => setTimeout(resolve, 1200));
    const syncLatency = Date.now() - syncStart;

    // 2. Asynchronous Event-Driven Simulation (immediate return)
    const asyncStart = Date.now();
    // Non-blocking dispatch
    setImmediate(() => {
      eventBus.emit('benchmark:event_processed', { timestamp: Date.now() });
    });
    const asyncLatency = Math.max(1, Date.now() - asyncStart);

    const improvementPercent = (((syncLatency - asyncLatency) / syncLatency) * 100).toFixed(1);

    return {
      sync: {
        pattern: 'Synchronous / Blocking Execution',
        description: 'Server blocks HTTP response thread until background audit and notifications finish',
        durationMs: syncLatency,
        statusCode: 200,
        threadBlocked: true,
      },
      async: {
        pattern: 'Asynchronous Event-Driven Execution (EDA)',
        description: 'Server immediately responds with 202 Accepted / 200 OK while workers process asynchronously',
        durationMs: asyncLatency,
        statusCode: 202,
        threadBlocked: false,
      },
      improvement: `${improvementPercent}% faster response time`,
      throughputMultiplier: `${Math.round(syncLatency / asyncLatency)}x improvement`,
    };
  }
}

const asyncQueue = new AsyncQueue();
module.exports = asyncQueue;
