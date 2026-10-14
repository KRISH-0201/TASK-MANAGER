import React, { useState } from 'react';
import { toast } from 'react-toastify';

/**
 * Lazy-loaded Contact Route Component (Contact.chunk.js)
 * Only fetched over the network when user navigates to /contact
 */
export default function Contact() {
  const [formData, setFormData] = useState({
    name: 'Student Developer',
    email: '24aiml028@charusat.edu.in',
    subject: 'Practical 8 Performance Evaluation',
    message: 'Testing lazy loading and code-splitting behavior across route chunks.',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success('Feedback submitted successfully! Thank you.');
      setFormData(prev => ({ ...prev, message: '' }));
    }, 600);
  };

  return (
    <div className="page-container page-contact">
      <header className="page-header glass-panel">
        <div>
          <h1>Contact & Developer Support</h1>
          <p className="subtitle">Route: <code>/contact</code> | Lazy Chunk: <code>Contact.chunk.js</code></p>
        </div>
      </header>

      <div className="contact-layout">
        {/* Contact Form */}
        <div className="contact-form-card glass-panel">
          <h2>Send Developer Feedback</h2>
          <p className="contact-intro">
            Submit inquiry, bug reports, or performance profiling feedback directly to the team.
          </p>

          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-group">
              <label>Your Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Subject</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Message</label>
              <textarea
                rows="4"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Enter feedback or performance observations..."
                required
              ></textarea>
            </div>

            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : '📨 Send Message'}
            </button>
          </form>
        </div>

        {/* Academic & Diagnostics Sidebar */}
        <div className="contact-info-card glass-panel">
          <h2>Academic & Team Info</h2>
          <div className="info-block">
            <p className="info-label">Institution</p>
            <p className="info-value">CHARUSAT - CSPIT / DEPSTAR</p>
          </div>
          <div className="info-block">
            <p className="info-label">Student ID</p>
            <p className="info-value">24AIML028</p>
          </div>
          <div className="info-block">
            <p className="info-label">Practical Topic</p>
            <p className="info-value">Practical 8: Performance Optimization & Lazy Loading</p>
          </div>
          <div className="info-block">
            <p className="info-label">Chunk Status</p>
            <p className="info-status">
              <span className="live-dot"></span> <code>Contact.chunk.js</code> successfully mounted via React.lazy()
            </p>
          </div>

          <div className="diagnostic-box">
            <h4>💡 How to Inspect in DevTools</h4>
            <ol>
              <li>Open Chrome DevTools (<code>F12</code>)</li>
              <li>Go to <strong>Network</strong> tab and filter by <strong>JS</strong></li>
              <li>Toggle between <em>Projects</em> and <em>Contact</em></li>
              <li>Observe the dynamic chunk requests on demand!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
