import { useEffect, useState, type FormEvent } from 'react';
import { checkHealth, queueAnalysis, type AnalysisJob } from './api.ts';

type ApiState = 'checking' | 'online' | 'offline';
const apiUrl = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

export function App() {
  const [apiState, setApiState] = useState<ApiState>('checking');
  const [healthCheck, setHealthCheck] = useState(0);
  const [repositoryId, setRepositoryId] = useState('');
  const [pullRequestNumber, setPullRequestNumber] = useState('');
  const [token, setToken] = useState('');
  const [job, setJob] = useState<AnalysisJob | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    let active = true;
    setApiState('checking');
    checkHealth(apiUrl, controller.signal)
      .then(() => { if (active) setApiState('online'); })
      .catch(() => { if (active) setApiState('offline'); });
    return () => { active = false; window.clearTimeout(timeout); controller.abort(); };
  }, [healthCheck]);

  async function startAnalysis(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      setJob(await queueAnalysis(apiUrl, token, repositoryId, pullRequestNumber));
    } catch (requestError) {
      setError(requestError instanceof Error && /token|account|whole|repository|HTTP|unexpected/.test(requestError.message)
        ? requestError.message : 'Could not reach the API. Check the connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#overview">Skip to workspace</a>
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">F</span><span>ForgeFlow</span></div>
        <div className="workspace-label">WORKSPACE</div>
        <nav aria-label="Workspace navigation">
          <a href="#overview"><span aria-hidden="true">◈</span> Overview</a>
          <a href="#review"><span aria-hidden="true">↗</span> Start a review</a>
          <a href="#activity"><span aria-hidden="true">◷</span> Latest request</a>
          <a href="#pipeline"><span aria-hidden="true">⌘</span> Build status</a>
        </nav>
        <div className="sidebar-footer"><a href="https://github.com/t3hj/ForgeFlow#readme" target="_blank" rel="noreferrer">Project documentation ↗</a></div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar"><div><span className="eyebrow">ENGINEERING INTELLIGENCE</span><h1>Your review workspace.</h1></div><div className="topbar-actions"><span className={`api-status ${apiState}`} role="status"><i aria-hidden="true" /> API {apiState}</span><span className="prototype-badge">Development prototype</span></div></header>
        <section className="hero-row"><div><p className="section-kicker">Review control center</p><h2>Ship with evidence.</h2><p className="hero-copy">A workspace for pull request analysis, evidence-backed findings and transparent risk scoring.</p></div><div className="hero-signal"><span className="signal-dot" aria-hidden="true" /><div><strong>Built in stages</strong><small>Deterministic checks first</small></div></div></section>
        <section className="metrics" aria-label="Review metrics">
          <Metric label="Open findings" value="—" note="Dashboard integration planned" />
          <Metric label="Average risk" value="—" note="No reporting endpoint yet" />
          <Metric label="Test pass rate" value="—" note="Sandbox wiring in progress" />
          <Metric label="Repositories" value="—" note="Connection workflow in progress" />
        </section>
        <section className="content-grid">
          <section className="panel queue-panel" id="review" aria-labelledby="review-title"><div className="panel-heading"><div><span className="panel-label">ANALYSIS QUEUE</span><h3 id="review-title">Start a review</h3></div><span className="stage-count">API / v0.1</span></div><p className="panel-description">Submit a repository ID and pull request number to the queue API. Processing requires a configured worker and repository input loader.</p>
            {apiState === 'offline' && <div className="connection-note" role="status"><p>The API is unavailable. Start the local API or check your deployment configuration.</p><button type="button" onClick={() => setHealthCheck(value => value + 1)}>Retry connection</button></div>}
            <form onSubmit={startAnalysis} aria-busy={submitting}>
              <label className="token-field">Workspace access token<input type="password" autoComplete="off" spellCheck={false} value={token} onChange={event => setToken(event.target.value)} placeholder="Enter your access token" required aria-describedby="token-note" /></label>
              <p id="token-note" className="field-note">Kept in memory for this tab only. Provided by your workspace administrator.</p>
              <label>Repository ID<input value={repositoryId} onChange={event => setRepositoryId(event.target.value)} placeholder="repo_123" required /></label>
              <label>Pull request number<input type="number" min="1" step="1" value={pullRequestNumber} onChange={event => setPullRequestNumber(event.target.value)} placeholder="42" required /></label>
              <button className="primary-button" disabled={submitting || apiState !== 'online' || !token.trim()}>{submitting ? 'Queueing…' : 'Queue analysis'} <span aria-hidden="true">→</span></button>
            </form>
            {error && <p className="form-error" role="alert">{error}</p>}
          </section>
          <section className="panel activity-panel" id="activity" aria-labelledby="activity-title"><div className="panel-heading"><div><span className="panel-label">THIS SESSION</span><h3 id="activity-title">Latest request</h3></div></div><div aria-live="polite" role="status">{job ? <div className="job-result"><span className="job-icon" aria-hidden="true">✓</span><div><strong>Request accepted</strong><small>{job.repositoryId} · PR #{job.pullRequestNumber}</small><small>{job.status} · {job.progress}% at submission</small><small>Job ID: {job.id}</small><p className="field-note">This is the queue receipt. Live progress and results are not connected to this dashboard yet.</p></div></div> : <div className="empty-state"><div className="empty-icon" aria-hidden="true">◌</div><strong>No requests this session</strong><p>Your most recent queue receipt will appear here. Previous requests are not loaded into this view.</p></div>}</div></section>
        </section>
        <section className="panel build-status" id="pipeline" aria-labelledby="build-title"><span className="panel-label">BUILD STATUS</span><h3 id="build-title">What works today. What comes next.</h3><div className="build-columns"><div><h4>Implemented modules</h4><p>Role-checked queue API, Redis queue and worker abstraction, PostgreSQL store, GitHub diff and signature helpers, static security heuristics, deterministic risk scoring and audited finding transitions.</p></div><div><h4>Integration in progress</h4><p>GitHub connection UI, continuous worker deployment, persisted results in the dashboard, dependency-stage wiring, sandbox execution and model-provider review. This prototype does not claim a completed end-to-end review.</p></div></div></section>
        <footer className="page-footer"><span>ForgeFlow v0.1 · Development workspace</span><span>Evidence over intuition</span></footer>
      </main>
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="metric"><span className="metric-label">{label}</span><strong>{value}</strong><small>{note}</small></div>;
}
