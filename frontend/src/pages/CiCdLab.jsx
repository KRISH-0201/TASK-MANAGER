import React, { useState } from 'react';
import { toast } from 'react-toastify';

export default function CiCdLab() {
  const [pipelineState, setPipelineState] = useState('passed'); // 'passed' | 'failed'
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' | 'workflow'

  const handleRunSimulation = (targetState) => {
    setIsSimulating(true);
    setPipelineState('running');
    toast.info(`🚀 GitHub Actions triggered: running CI Pipeline (${targetState === 'passed' ? 'Passing run' : 'Deliberately broken test run'})...`);

    setTimeout(() => {
      setPipelineState(targetState);
      setIsSimulating(false);
      if (targetState === 'passed') {
        toast.success('✅ CI Pipeline PASSED: All 7 automated tests passed and build verified!');
      } else {
        toast.error('❌ CI Pipeline FAILED: Deliberately broken test failed with exit code 1 (Red X)!');
      }
    }, 1200);
  };

  const workflowYaml = `# .github/workflows/ci.yml - Automated CI/CD Pipeline
name: CI Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  # Job 1: Code Quality & Syntax Validation
  lint-and-audit:
    name: Code Quality & Syntax Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install Backend Dependencies
        working-directory: backend
        run: npm ci || npm install

      - name: Validate Server Syntax
        working-directory: backend
        run: node --check server.js

  # Job 2: Automated Testing & Build Validation
  build-and-test:
    name: Automated Tests & Production Build
    needs: lint-and-audit
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install Backend Dependencies
        working-directory: backend
        run: npm ci || npm install

      - name: Run Backend Automated Tests
        working-directory: backend
        run: npm test

      - name: Install Frontend Dependencies
        working-directory: frontend
        run: npm ci || npm install

      - name: Run Frontend Production Build
        working-directory: frontend
        run: npm run build`;

  return (
    <div className="caching-lab-container cicd-lab-container">
      {/* Header Banner */}
      <div className="glass-panel lab-header-card">
        <div className="lab-header-content">
          <div className="lab-tag-wrapper">
            <span className="lab-tag cicd-tag">Practical 12: CI/CD Pipeline</span>
            <span className="lab-subtag">GitHub Actions Automated Testing & Build Pipeline</span>
          </div>
          <h1 className="lab-title">GitHub Actions CI/CD Pipeline & Test Inspector</h1>
          <p className="lab-description">
            Automating multi-job testing and deployment pipelines on every <code>git push</code>. 
            Runs backend syntax linting, executes automated unit tests with <code>node:test</code>, 
            verifies frontend production builds, and reports real-time pass/fail statuses.
          </p>
        </div>

        <div className="lab-quick-actions">
          <button 
            id="btn-simulate-pass"
            className="btn btn-primary"
            onClick={() => handleRunSimulation('passed')}
            disabled={isSimulating}
          >
            {isSimulating && pipelineState === 'running' ? 'Running CI...' : '✔ Simulate Passing Pipeline (Green)'}
          </button>
          <button 
            id="btn-simulate-fail"
            className="btn btn-outline-danger"
            onClick={() => handleRunSimulation('failed')}
            disabled={isSimulating}
          >
            ✖ Demonstrate Broken Test (Red X)
          </button>
        </div>
      </div>

      {/* KPI Telemetry Cards */}
      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <div className="stat-icon-wrapper blue">⚙️</div>
          <div className="stat-meta">
            <span className="stat-label">CI Orchestrator</span>
            <h3 className="stat-value">GitHub Actions</h3>
            <span className="stat-detail">Runner: ubuntu-latest (Node 20)</span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon-wrapper purple">🎯</div>
          <div className="stat-meta">
            <span className="stat-label">Automated Triggers</span>
            <h3 className="stat-value">push & PR</h3>
            <span className="stat-detail">Branch: [main]</span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon-wrapper orange">🧪</div>
          <div className="stat-meta">
            <span className="stat-label">Automated Test Suite</span>
            <h3 className="stat-value">7 Assertions</h3>
            <span className="stat-detail">Auth, Health, Validation</span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className={`stat-icon-wrapper ${pipelineState === 'passed' ? 'green' : pipelineState === 'failed' ? 'red' : 'yellow'}`}>
            {pipelineState === 'passed' ? '✔' : pipelineState === 'failed' ? '✖' : '⏳'}
          </div>
          <div className="stat-meta">
            <span className="stat-label">Pipeline Status</span>
            <h3 className={`stat-value ${pipelineState === 'passed' ? 'text-success' : pipelineState === 'failed' ? 'text-danger' : 'text-warning'}`}>
              {pipelineState === 'passed' ? 'PASSED (200)' : pipelineState === 'failed' ? 'FAILED (Exit 1)' : 'RUNNING...'}
            </h3>
            <span className="stat-detail">
              {pipelineState === 'passed' ? 'All checks succeeded' : pipelineState === 'failed' ? 'AssertionError in tests' : 'Executing steps...'}
            </span>
          </div>
        </div>
      </div>

      {/* Visual CI/CD Multi-Stage Flow Diagram */}
      <div className="glass-panel cicd-flow-card">
        <div className="panel-header">
          <div>
            <h3>🔄 Automated CI Pipeline Stage Progression</h3>
            <p className="panel-subtitle">Sequential multi-job workflow executed in isolated Ubuntu cloud virtual environments</p>
          </div>
          <span className={`status-pill ${pipelineState === 'passed' ? 'hit' : pipelineState === 'failed' ? 'miss' : 'neutral'}`}>
            {pipelineState === 'passed' ? 'WORKFLOW SUCCEEDED' : pipelineState === 'failed' ? 'WORKFLOW FAILED' : 'IN PROGRESS'}
          </span>
        </div>

        <div className="pipeline-flow-diagram">
          {/* Stage 1 */}
          <div className="flow-stage completed">
            <div className="stage-circle">1</div>
            <div className="stage-info">
              <span className="stage-title">Trigger Event</span>
              <span className="stage-desc">git push to main</span>
            </div>
          </div>
          <div className="flow-arrow">➔</div>

          {/* Stage 2 */}
          <div className="flow-stage completed">
            <div className="stage-circle">2</div>
            <div className="stage-info">
              <span className="stage-title">Code Quality</span>
              <span className="stage-desc">node --check syntax</span>
            </div>
          </div>
          <div className="flow-arrow">➔</div>

          {/* Stage 3 */}
          <div className={`flow-stage ${pipelineState === 'passed' ? 'completed' : pipelineState === 'failed' ? 'failed' : 'running'}`}>
            <div className="stage-circle">3</div>
            <div className="stage-info">
              <span className="stage-title">Automated Tests</span>
              <span className="stage-desc">node:test suite</span>
            </div>
          </div>
          <div className="flow-arrow">➔</div>

          {/* Stage 4 */}
          <div className={`flow-stage ${pipelineState === 'passed' ? 'completed' : pipelineState === 'failed' ? 'blocked' : 'pending'}`}>
            <div className="stage-circle">4</div>
            <div className="stage-info">
              <span className="stage-title">Production Build</span>
              <span className="stage-desc">Vite React bundle</span>
            </div>
          </div>
          <div className="flow-arrow">➔</div>

          {/* Stage 5 */}
          <div className={`flow-stage ${pipelineState === 'passed' ? 'completed' : pipelineState === 'failed' ? 'failed' : 'pending'}`}>
            <div className="stage-circle">{pipelineState === 'passed' ? '✔' : pipelineState === 'failed' ? '✖' : '5'}</div>
            <div className="stage-info">
              <span className="stage-title">Commit Status</span>
              <span className="stage-desc">{pipelineState === 'passed' ? 'Green Checkmark' : 'Red Failure'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Runner & Workflow Tabs */}
      <div className="glass-panel benchmark-card benchmark-full-width">
        <div className="panel-header">
          <div>
            <h3>🖥️ GitHub Actions Runner Output & Pipeline Logs</h3>
            <p className="panel-subtitle">Real-time step-by-step stdout/stderr execution log from Ubuntu runner</p>
          </div>
          <div className="spec-tabs">
            <button 
              className={`spec-tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
              onClick={() => setActiveTab('logs')}
            >
              Runner Terminal Logs
            </button>
            <button 
              className={`spec-tab-btn ${activeTab === 'workflow' ? 'active' : ''}`}
              onClick={() => setActiveTab('workflow')}
            >
              .github/workflows/ci.yml
            </button>
          </div>
        </div>

        {activeTab === 'logs' ? (
          <div className="terminal-container">
            <div className="terminal-header">
              <div className="terminal-controls">
                <span className="term-dot red"></span>
                <span className="term-dot yellow"></span>
                <span className="term-dot green"></span>
              </div>
              <span className="terminal-title">
                GitHub Actions Runner — {pipelineState === 'passed' ? 'Run #14 (Passed)' : 'Run #15 (Deliberate Test Failure)'}
              </span>
              <span className="terminal-branch">branch: main (commit 441e238)</span>
            </div>

            <pre className="terminal-body">
              <div className="term-line step-header">##[group]Run actions/checkout@v4</div>
              <div className="term-line success">Syncing repository: KRISH-0201/TASK-MANAGER</div>
              <div className="term-line">Getting Git version info</div>
              <div className="term-line success">✔ Checked out refs/heads/main commit 441e238 (120ms)</div>
              <div className="term-line step-header">##[group]Run actions/setup-node@v4</div>
              <div className="term-line">Attempting to resolve Node.js version '20'</div>
              <div className="term-line success">Resolved as '20.18.0' with npm 10.8.2</div>
              <div className="term-line step-header">##[group]Run npm ci in backend</div>
              <div className="term-line">added 24 packages in 1.14s</div>
              <div className="term-line step-header">##[group]Run npm test (Automated Unit Tests)</div>
              <div className="term-line">> backend@1.0.0 test</div>
              <div className="term-line">> node --test</div>
              
              {pipelineState === 'passed' ? (
                <>
                  <div className="term-line test-pass">✔ Healthcheck response model validates expected schema (1.8ms)</div>
                  <div className="term-line test-pass">✔ Task status validation ensures permitted states (1.2ms)</div>
                  <div className="term-line test-pass">✔ Cache key naming convention matches pattern (0.7ms)</div>
                  <div className="term-line test-pass">✔ normalizeEmail lowercases and trims Gmail addresses (1.1ms)</div>
                  <div className="term-line test-pass">✔ accepts a valid Gmail email address (0.9ms)</div>
                  <div className="term-line test-pass">✔ rejects invalid email addresses (0.6ms)</div>
                  <div className="term-line test-pass">✔ creates a usable reset token and password strength (1.4ms)</div>
                  <div className="term-line">ℹ tests 7 | pass 7 | fail 0 | cancelled 0 | duration_ms 42.6</div>
                  <div className="term-line step-header">##[group]Run npm run build in frontend</div>
                  <div className="term-line">> vite build</div>
                  <div className="term-line success">vite v8.2.1 building for production...</div>
                  <div className="term-line success">✓ 84 modules transformed.</div>
                  <div className="term-line success">dist/index.html                   0.45 kB │ gzip:  0.28 kB</div>
                  <div className="term-line success">dist/assets/index.css            14.20 kB │ gzip:  3.65 kB</div>
                  <div className="term-line success">dist/assets/index.js            182.10 kB │ gzip: 58.40 kB</div>
                  <div className="term-line success">✓ built in 1.48s</div>
                  <div className="term-line step-header">##[section]Post job execution status</div>
                  <div className="term-line final-success">🎉 Job 'build-and-test' completed with status: SUCCESS (exit code 0)</div>
                </>
              ) : (
                <>
                  <div className="term-line test-pass">✔ Healthcheck response model validates expected schema (1.8ms)</div>
                  <div className="term-line test-fail">✖ Task status validation ensures permitted states (3.4ms)</div>
                  <div className="term-line error-highlight">
                    AssertionError [ERR_ASSERTION]: Expected 'completed' to strictly equal 'done'
                  </div>
                  <div className="term-line error-trace">
                    at TestContext.&lt;anonymous&gt; (backend/tests/apiHealth.test.js:22:10)
                  </div>
                  <div className="term-line error-trace">
                    at Test.run (node:internal/test_runner/test:546:25)
                  </div>
                  <div className="term-line test-pass">✔ normalizeEmail lowercases and trims Gmail addresses (1.1ms)</div>
                  <div className="term-line test-pass">✔ accepts a valid Gmail email address (0.9ms)</div>
                  <div className="term-line">ℹ tests 7 | pass 6 | fail 1 | cancelled 0 | duration_ms 48.1</div>
                  <div className="term-line error-highlight">npm error Test failed. See above for more details.</div>
                  <div className="term-line error-highlight">Error: Process completed with exit code 1.</div>
                  <div className="term-line step-header">##[section]Post job execution status</div>
                  <div className="term-line final-fail">❌ Job 'build-and-test' failed with exit code 1</div>
                  <div className="term-line error-highlight">##[error]Pipeline failed: Subsequent step 'Run Frontend Production Build' was skipped.</div>
                </>
              )}
            </pre>
          </div>
        ) : (
          <div className="code-block-wrapper">
            <pre className="docker-code-block">
              <code>{workflowYaml}</code>
            </pre>
          </div>
        )}

        {/* Status Callout Bar */}
        <div className={`benchmark-summary-bar ${pipelineState === 'passed' ? 'green-border' : 'red-border'}`}>
          <span className="summary-highlight">
            {pipelineState === 'passed' ? (
              <>
                ⚡ <strong>CI Status: PASSED (Green Checkmark)</strong> — Automated regression tests & Vite bundle builds passed successfully. Safe to merge/deploy!
              </>
            ) : (
              <>
                ⚠️ <strong>CI Status: FAILED (Red X)</strong> — Deliberate assertion failure detected. Automated CI prevented broken code from being deployed into production.
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
