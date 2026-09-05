import { useEffect, useState } from 'react';

type ApiState = 'checking' | 'online' | 'offline';

type AnalysisJob = {
  id: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  progress: number;
  repositoryId: string;
  pullRequestNumber: number;
};

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export function App() {
  const [apiState, setApiState] = useState<ApiState>('checking');
  const [repositoryId, setRepositoryId] = useState('');
  const [pullRequestNumber, setPullRequestNumber] = useState('');
  const [job, setJob] = useState<AnalysisJob | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${apiUrl}/health`)
      .then((response) => {
        if (!response.ok) throw new Error('API unavailable');
        setApiState('online');
      })
      .catch(() => setApiState('offline'));
  }, []);

  async function startAnalysis(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await fetch(`${apiUrl}/v1/analyses`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          repositoryId,
          pullRequestNumber: Number(pullRequestNumber),
          requestedBy: 'dashboard-user',
        }),
      });
      const result = await response.json() as AnalysisJob | { error: string };
      if (!response.ok) throw new Error('error' in result ? result.error : 'Unable to queue analysis');
      setJob(result as AnalysisJob);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to queue analysis');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">F</span><span>ForgeFlow</span></div>
        <div className="workspace-label">WORKSPACE</div>
        <nav>
          <a className="active" href="#overview"><span>◈</span> Overview</a>
          <a href="#repositories"><span>⌘</span> Repositories</a>
          <a href="#pull-requests"><span>↗</span> Pull requests</a>
          <a href="#findings"><span>!</span> Findings</a>
          <a href="#security"><span>盾</span> Security</a>
          <a href="#analytics"><span>◒</span> Analytics</a>
        </nav>
        <div className="sidebar-footer"><a href="#settings"><span>⚙</span> Settings</a><a href="#audit"><span>◷</span> Audit log</a></div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar"><div><span className="eyebrow">ENGINEERING INTELLIGENCE</span><h1>Good morning, engineer.</h1></div><div className="topbar-actions"><span className={`api-status ${apiState}`}><i /> API {apiState}</span><button className="avatar">DF</button></div></header>

        <section className="hero-row"><div><p className="section-kicker">Review control center</p><h2>Ship with evidence.</h2><p className="hero-copy">Connect a pull request and let ForgeFlow trace the change from diff to decision.</p></div><div className="hero-signal"><span className="signal-dot" /><div><strong>Pipeline ready</strong><small>Deterministic checks first, AI second</small></div></div></section>

        <section className="metrics" aria-label="Review metrics">
          <Metric label="Open findings" value="--" note="Connect a repository to begin" />
          <Metric label="Average risk" value="--" note="No reviews recorded" />
          <Metric label="Test pass rate" value="--" note="No test runs recorded" />
          <Metric label="Repositories" value="--" note="No repositories connected" />
        </section>

        <section className="content-grid">
          <div className="panel queue-panel"><div className="panel-heading"><div><span className="panel-label">ANALYSIS QUEUE</span><h3>Start a review</h3></div><span className="stage-count">01 / 06</span></div><p className="panel-description">Queue a pull request for diff extraction, static analysis, security scanning, tests, and controlled AI review.</p><form onSubmit={startAnalysis}><label>Repository ID<input value={repositoryId} onChange={(event) => setRepositoryId(event.target.value)} placeholder="repo_123" required /></label><label>Pull request number<input type="number" min="1" value={pullRequestNumber} onChange={(event) => setPullRequestNumber(event.target.value)} placeholder="42" required /></label><button className="primary-button" disabled={submitting || apiState !== 'online'}>{submitting ? 'Queueing...' : 'Queue analysis'} <span>→</span></button></form>{error && <p className="form-error">{error}</p>}{job && <div className="job-result"><span className="job-icon">✓</span><div><strong>Analysis queued</strong><small>{job.repositoryId} · PR #{job.pullRequestNumber} · {job.status}</small></div><span className="job-progress">{job.progress}%</span></div>}</div>
          <div className="panel activity-panel"><div className="panel-heading"><div><span className="panel-label">SYSTEM ACTIVITY</span><h3>Latest signal</h3></div><button className="icon-button" aria-label="Refresh activity">↻</button></div><div className="empty-state"><div className="empty-icon">◌</div><strong>Nothing has run yet</strong><p>Your first analysis will appear here with stage-by-stage progress and evidence.</p></div></div>
        </section>
        <footer className="page-footer"><span>ForgeFlow v0.1 · Local workspace</span><span>Evidence over intuition</span></footer>
      </main>
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="metric"><span className="metric-label">{label}</span><strong>{value}</strong><small>{note}</small></div>;
}
