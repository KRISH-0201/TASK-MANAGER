import React, { useState, useEffect } from 'react';
import { getAiStatus, generateAiDescription, previewSanitization, createTask } from '../api';
import { toast } from 'react-toastify';

export default function AiLab() {
  const [aiStatus, setAiStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Form State
  const [taskTitle, setTaskTitle] = useState('Optimize database queries and add indexing for task search');
  const [isGenerating, setIsGenerating] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);

  // AI Response State
  const [suggestion, setSuggestion] = useState(null);
  const [editedDescription, setEditedDescription] = useState('');
  const [editedPriority, setEditedPriority] = useState('medium');

  // Rate Limit Cooldown State
  const [cooldown, setCooldown] = useState(0);

  // Responsible AI Sanitizer State
  const [piiSampleText, setPiiSampleText] = useState('Urgent: Call customer at +1 415-555-2671 or email alice@corp.com regarding card 4532 8901 2345 6789 with secret: apikey_live_9981');
  const [sanitizedPreview, setSanitizedPreview] = useState(null);
  const [isSanitizing, setIsSanitizing] = useState(false);

  useEffect(() => {
    fetchAiStatus();
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const fetchAiStatus = async () => {
    try {
      setStatusLoading(true);
      const data = await getAiStatus();
      setAiStatus(data);
    } catch (err) {
      console.warn('Could not fetch AI status:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleGenerate = async (triggerFailure = false) => {
    if (!taskTitle.trim()) {
      toast.error('Please enter a task title first');
      return;
    }

    if (cooldown > 0 && !triggerFailure) {
      toast.warning(`Rate limit cooldown active. Please wait ${cooldown} seconds.`);
      return;
    }

    setIsGenerating(true);
    setSimulateFailure(triggerFailure);

    try {
      const data = await generateAiDescription({
        title: taskTitle,
        simulateFailure: triggerFailure,
      });

      setSuggestion(data);
      setEditedDescription(data.description || '');
      setEditedPriority(data.suggestedPriority || 'medium');

      if (data.fallback) {
        toast.info(triggerFailure ? 'Demonstrating Graceful Fallback (Simulated API Failure)' : 'Generated via Resilient Fallback Heuristics');
      } else {
        toast.success('AI description generated successfully!');
        setCooldown(60); // 60s cooldown for actual cloud API call
      }
    } catch (err) {
      if (err.status === 429) {
        setCooldown(err.remainingSeconds || 60);
        toast.error(`Rate limited! Please wait ${err.remainingSeconds || 60}s.`);
      } else {
        toast.error(err.message || 'AI request failed');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInsertAsTask = async () => {
    try {
      const created = await createTask({
        title: taskTitle.trim(),
        status: editedPriority === 'high' ? 'ongoing' : 'pending',
      });
      toast.success(`Task "${taskTitle.slice(0, 25)}..." added to Kanban board!`);
    } catch (err) {
      toast.error(err.message || 'Failed to add task');
    }
  };

  const handleRunSanitizer = async () => {
    setIsSanitizing(true);
    try {
      const data = await previewSanitization(piiSampleText);
      setSanitizedPreview(data);
      toast.info('PII redaction completed!');
    } catch (err) {
      toast.error('Failed to run PII sanitizer');
    } finally {
      setIsSanitizing(false);
    }
  };

  const quickSamples = [
    'Fix critical memory leak in node server cluster',
    'Design user profile avatar uploader in React',
    'Write integration tests for payment webhook',
    'Review GDPR and data privacy terms with legal',
  ];

  return (
    <div className="page-container page-ai-lab">
      {/* Header */}
      <header className="page-header glass-panel">
        <div>
          <span className="badge-pill badge-ai">Practical 13: AI API Integration</span>
          <h1>AI Assistant & Responsible AI Lab</h1>
          <p className="subtitle">
            Secure Server-Side LLM Orchestration with Graceful Degradation & Ethical Data Governance
          </p>
        </div>

        {/* Telemetry Chips */}
        <div className="header-actions">
          <div className="telemetry-chip">
            <span className="chip-label">AI Engine</span>
            <span className="chip-val highlight">
              {aiStatus?.provider || 'Google Gemini 1.5 Flash'}
            </span>
          </div>
          <div className="telemetry-chip">
            <span className="chip-label">Key Storage</span>
            <span className="chip-val secure">🔒 Server-Side (.env)</span>
          </div>
          <div className="telemetry-chip">
            <span className="chip-label">Fail-Safe</span>
            <span className="chip-val active">🛡️ Graceful Degradation</span>
          </div>
        </div>
      </header>

      {/* Main Dual Grid */}
      <div className="ai-lab-grid">
        {/* Left Column: Interactive Generation Form */}
        <div className="glass-panel ai-card">
          <div className="card-header-styled">
            <span className="card-icon">✨</span>
            <div>
              <h3>AI Task Enhancer</h3>
              <p>Type a task title or select a preset to auto-generate structured descriptions & priority</p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="quick-presets">
            <span className="preset-label">Quick Presets:</span>
            <div className="preset-chips">
              {quickSamples.map((sample, idx) => (
                <button
                  key={idx}
                  className="btn-preset-chip"
                  onClick={() => setTaskTitle(sample)}
                >
                  {sample.length > 32 ? sample.slice(0, 32) + '...' : sample}
                </button>
              ))}
            </div>
          </div>

          {/* Task Title Input */}
          <div className="form-group-styled">
            <label htmlFor="task-title-input">Task Title</label>
            <input
              id="task-title-input"
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g. Implement OAuth2 login with refresh tokens"
              className="styled-text-input"
            />
          </div>

          {/* Action Buttons */}
          <div className="ai-button-row">
            <button
              id="btn-ai-generate"
              className="btn-primary btn-generate"
              onClick={() => handleGenerate(false)}
              disabled={isGenerating || (cooldown > 0 && !simulateFailure)}
            >
              {isGenerating && !simulateFailure ? (
                <>
                  <span className="spinner-mini"></span> Contacting Cloud AI...
                </>
              ) : cooldown > 0 ? (
                `⏳ Cooldown (${cooldown}s)`
              ) : (
                '✨ Generate Description & Priority'
              )}
            </button>

            <button
              id="btn-ai-fail-test"
              className="btn-secondary btn-simulate-failure"
              onClick={() => handleGenerate(true)}
              disabled={isGenerating}
              title="Demonstrates graceful degradation when third-party AI fails or times out"
            >
              {isGenerating && simulateFailure ? (
                <>
                  <span className="spinner-mini"></span> Testing Fallback...
                </>
              ) : (
                '🧪 Demonstrate Graceful Fallback'
              )}
            </button>
          </div>

          {/* Rate Limit Alert */}
          {cooldown > 0 && (
            <div className="rate-limit-banner">
              <span className="banner-icon">⏱️</span>
              <div>
                <strong>Rate Limit Active:</strong> 1 request per minute per user enforced to prevent cloud quota exhaustion.
                <span className="cooldown-badge">{cooldown}s remaining</span>
              </div>
            </div>
          )}

          {/* Generated Result Card */}
          {suggestion && (
            <div className={`ai-result-box ${suggestion.fallback ? 'fallback-mode' : 'success-mode'}`}>
              <div className="result-header">
                <div className="result-source-wrap">
                  <span className={`source-tag ${suggestion.fallback ? 'tag-fallback' : 'tag-ai'}`}>
                    {suggestion.fallback ? '🛡️ Graceful Fallback Engine' : '⚡ Google Gemini 1.5 Flash'}
                  </span>
                  {suggestion.simulatedFailure && (
                    <span className="source-tag tag-simulated">Simulated API Failure</span>
                  )}
                </div>

                <div className="priority-pill-wrap">
                  <span className="pill-label">Priority:</span>
                  <select
                    value={editedPriority}
                    onChange={(e) => setEditedPriority(e.target.value)}
                    className={`priority-select priority-${editedPriority}`}
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>

              {/* Editable Description Suggestion */}
              <div className="result-body">
                <label className="suggestion-label">
                  Suggested Description (Editable):
                </label>
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  rows={4}
                  className="editable-description-area"
                />

                <div className="deadline-chip">
                  <span>📅 Suggested Deadline:</span>{' '}
                  <strong>{suggestion.suggestedDeadlineDays || 3} days from today</strong>
                </div>

                {/* Responsible AI Disclaimer (Supplementary Requirement) */}
                <div className="ai-disclaimer-box">
                  <span className="disclaimer-icon">⚠️</span>
                  <span className="disclaimer-text">{suggestion.disclaimer}</span>
                </div>
              </div>

              <div className="result-footer">
                <button
                  className="btn-success btn-insert-task"
                  onClick={handleInsertAsTask}
                >
                  ✓ Accept & Save as Kanban Task
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Responsible AI & Architecture Deep Dive */}
        <div className="ai-right-column">
          {/* Responsible AI PII Redaction Inspector */}
          <div className="glass-panel ai-card">
            <div className="card-header-styled">
              <span className="card-icon">🛡️</span>
              <div>
                <h3>Responsible AI & Privacy Guard</h3>
                <p>Automatic client-side PII sanitization before prompt transmission</p>
              </div>
            </div>

            <p className="section-explain">
              Responsible AI principle: <strong>Never send sensitive user credentials, payment data, or contact info to external AI models</strong>. The backend sanitizes prompts before making API calls:
            </p>

            <div className="form-group-styled">
              <label>Sample Prompt with Sensitive PII:</label>
              <textarea
                value={piiSampleText}
                onChange={(e) => setPiiSampleText(e.target.value)}
                rows={3}
                className="styled-text-input text-mono"
              />
            </div>

            <button
              className="btn-secondary btn-sanitize"
              onClick={handleRunSanitizer}
              disabled={isSanitizing}
            >
              {isSanitizing ? 'Sanitizing...' : '🔍 Scan & Redact PII'}
            </button>

            {sanitizedPreview && (
              <div className="sanitizer-output">
                <div className="output-row">
                  <span className="tag-red">Redacted Output Sent to Cloud:</span>
                  <div className="sanitized-box">{sanitizedPreview.sanitized}</div>
                </div>
                <div className="privacy-badge">
                  ✅ Emails, Credit Cards, Phone Numbers & API Secrets Protected
                </div>
              </div>
            )}
          </div>

          {/* Architecture & Security Comparison */}
          <div className="glass-panel ai-card">
            <div className="card-header-styled">
              <span className="card-icon">🏛️</span>
              <div>
                <h3>Architecture: Client vs Server Calling Pattern</h3>
                <p>Why backend gateway architecture is non-negotiable for AI APIs</p>
              </div>
            </div>

            <div className="comparison-cards">
              <div className="comp-card unsafe">
                <h4>❌ Direct Client-Side (Frontend)</h4>
                <ul>
                  <li>API Key exposed in browser DevTools Network tab</li>
                  <li>Anyone can extract key and run up thousands in billing</li>
                  <li>No centralized rate limiting or token auditing</li>
                  <li>If API fails, browser receives raw CORS error and crashes</li>
                </ul>
              </div>

              <div className="comp-card safe">
                <h4>✅ Secure Express Gateway (Backend)</h4>
                <ul>
                  <li>API Key stored exclusively in server <code>.env</code></li>
                  <li>Centralized rate limit (1 req/min) protects cloud quota</li>
                  <li>Sanitizes sensitive PII before forwarding to Gemini</li>
                  <li>Try/Catch graceful fallback keeps core app 100% operational</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
