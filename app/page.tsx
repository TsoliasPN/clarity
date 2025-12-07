const metrics = [
  { label: 'Base currency', value: 'Configurable per user', hint: 'ISO 4217 aware' },
  { label: 'FX cache', value: '20 currencies', hint: 'Seeded demo data' },
  { label: 'Normalized totals', value: 'Monthly equivalents', hint: 'Weekly/quarterly/yearly handled' },
  { label: 'API ready', value: '/api/subscriptions', hint: 'Supports userId param' }
]

const backlog = [
  'Full CRUD endpoints with validation',
  'CSV import with FX normalization',
  'Auth + session-aware user resolution',
  'Alerts for renewals, budget, and FX drift',
  'Dashboard with category and trend views'
]

export default function HomePage() {
  return (
    <main className="page">
      <div className="hero">
        <span className="pill">Multi-currency ready | AI-first subscription HQ</span>
        <h1 className="title">CLARITY OS for every recurring spend in your universe</h1>
        <p className="subtitle">
          Normalize subscriptions across currencies and billing cycles, keep totals honest, and surface
          high-signal alerts before renewals surprise you.
        </p>
        <div className="cta-row">
          <a className="cta" href="/api/subscriptions">
            View normalized API
          </a>
          <a className="cta ghost" href="/api/subscriptions?userId=demo-user">
            Run demo response
          </a>
        </div>
      </div>

      <div className="grid">
        {metrics.map((metric) => (
          <div className="card" key={metric.label}>
            <div className="metric">
              <span>{metric.label}</span>
            </div>
            <div className="metric-value">{metric.value}</div>
            <div className="metric">{metric.hint}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="metric">
          <strong>Backlog anchors</strong>
        </div>
        <ul className="list">
          {backlog.map((item) => (
            <li key={item} className="tag">
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="card code">
        <div className="metric">
          <strong>Try the API</strong>
          <span className="pill">Demo user: demo-user</span>
        </div>
        <code>curl http://localhost:3000/api/subscriptions?userId=demo-user</code>
      </div>
    </main>
  )
}
