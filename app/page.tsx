'use client'

import { useEffect, useMemo, useState } from 'react'

type SubscriptionRow = {
  id: string
  name: string
  provider: string | null
  cost: number
  currency: string
  billingCycle: string
  startDate: string
  nextBillDate: string
  status: string
  category: string | null
  normalizedCost: number
  normalizedMonthlyCost: number
  wasConverted: boolean
  displayNote?: string | null
}

type AlertRow = {
  id: string
  type: string
  severity: string
  message: string
  triggerDate: string
  isRead: boolean
}

type ImportResult = {
  preview: SubscriptionRow[]
  stats: {
    totalRows: number
    valid: number
    invalid: number
    created: number
    committed: boolean
  }
  errors: { row: number; message: string }[]
}

type ApiResponse = {
  data: SubscriptionRow[]
  alerts: AlertRow[]
  meta: {
    baseCurrency: string
    totalMonthlySpend: number
    count: number
    missingRates: string[]
    spendByCategory: Record<string, number>
    statusCounts: Record<string, number>
  }
}

const statusColors: Record<string, string> = {
  ACTIVE: 'var(--accent)',
  PAUSED: '#ffc857',
  CANCELLED: '#f37b7b'
}

const severityColors: Record<string, string> = {
  INFO: 'var(--muted)',
  WARNING: '#ffc857',
  CRITICAL: '#f37b7b'
}

export default function HomePage() {
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'ALL' | string>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | string>('ALL')
  const [csvCommit, setCsvCommit] = useState(false)
  const [csvBusy, setCsvBusy] = useState(false)
  const [csvResult, setCsvResult] = useState<ImportResult | null>(null)
  const [fxBusy, setFxBusy] = useState(false)
  const [fxMessage, setFxMessage] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/subscriptions', { cache: 'no-store' })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to load')
        setResponse(json)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const categories = useMemo(() => {
    if (!response?.meta?.spendByCategory) return []
    return Object.keys(response.meta.spendByCategory)
  }, [response])

  const filteredData = useMemo(() => {
    if (!response?.data) return []
    return response.data.filter((sub) => {
      const statusOk = statusFilter === 'ALL' || sub.status === statusFilter
      const categoryOk =
        categoryFilter === 'ALL' || (sub.category ?? 'Uncategorized') === categoryFilter
      return statusOk && categoryOk
    })
  }, [response, statusFilter, categoryFilter])

  const topCategory = useMemo(() => {
    if (!response?.meta?.spendByCategory) return null
    return Object.entries(response.meta.spendByCategory).sort((a, b) => b[1] - a[1])[0]
  }, [response])

  async function refreshFx() {
    try {
      setFxBusy(true)
      setFxMessage(null)
      const res = await fetch('/api/exchange-rates/refresh', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Refresh failed')
      setFxMessage(`Rates refreshed (${json.updated} updated). Reload to apply.`)
    } catch (err: any) {
      setFxMessage(err.message || 'Refresh failed')
    } finally {
      setFxBusy(false)
    }
  }

  async function handleCsvUpload(file: File | null) {
    if (!file) return
    setCsvBusy(true)
    setCsvResult(null)
    try {
      const text = await file.text()
      const url = csvCommit
        ? '/api/subscriptions/import?commit=true'
        : '/api/subscriptions/import'
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'text/csv' },
        body: text
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Import failed')
      setCsvResult(json)
    } catch (err: any) {
      setCsvResult({
        preview: [],
        stats: { totalRows: 0, valid: 0, invalid: 0, created: 0, committed: csvCommit },
        errors: [{ row: 0, message: err.message || 'Import failed' }]
      })
    } finally {
      setCsvBusy(false)
    }
  }

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
          <button className="cta" onClick={() => refreshFx()} disabled={fxBusy}>
            {fxBusy ? 'Refreshing FX...' : 'Refresh FX cache'}
          </button>
          <a className="cta ghost" href="/api/subscriptions">
            API (demo user)
          </a>
        </div>
        {fxMessage && <div className="metric" style={{ color: '#ffc857' }}>{fxMessage}</div>}
      </div>

      <div className="grid">
        <div className="card">
          <div className="metric">
            <strong>Total monthly (normalized)</strong>
          </div>
          <div className="metric-value">
            {loading ? 'Loading...' : `${response?.meta.baseCurrency ?? ''} ${response?.meta.totalMonthlySpend ?? 0}`}
          </div>
          <div className="metric">Includes FX + billing-cycle normalization</div>
        </div>
        <div className="card">
          <div className="metric">
            <strong>Subscriptions tracked</strong>
          </div>
          <div className="metric-value">{loading ? 'Loading...' : response?.meta.count ?? 0}</div>
          <div className="metric">Status breakdown: {summaryStatus(response)}</div>
        </div>
        <div className="card">
          <div className="metric">
            <strong>Base currency</strong>
          </div>
          <div className="metric-value">{loading ? 'Loading...' : response?.meta.baseCurrency ?? '-'}</div>
          <div className="metric">Missing rates: {response?.meta.missingRates?.join(', ') || 'none'}</div>
        </div>
        <div className="card">
          <div className="metric">
            <strong>Top category</strong>
          </div>
          <div className="metric-value">
            {loading ? 'Loading...' : topCategory ? `${topCategory[0]} (${response?.meta.baseCurrency} ${topCategory[1]})` : '-'}
          </div>
          <div className="metric">Categories tracked via API aggregation</div>
        </div>
      </div>

      <div className="grid" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="metric">
            <strong>Category breakdown</strong>
          </div>
          <div className="bars">
            {response?.meta?.spendByCategory &&
              Object.entries(response.meta.spendByCategory).map(([cat, value]) => {
                const total = response.meta.totalMonthlySpend || 1
                const percent = Math.max(2, Math.round((value / total) * 100))
                return (
                  <div key={cat} className="bar-row">
                    <span className="row-title">{cat}</span>
                    <div className="bar">
                      <div className="bar-fill" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="row-subtitle">
                      {response.meta.baseCurrency} {value.toFixed(2)}
                    </span>
                  </div>
                )
              })}
          </div>
        </div>
        <div className="card">
          <div className="metric">
            <strong>Filters</strong>
          </div>
          <div className="filter-grid">
            <label className="filter">
              <span>Status</span>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="ALL">All</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </label>
            <label className="filter">
              <span>Category</span>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="ALL">All</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="metric">Showing {filteredData.length} of {response?.meta?.count ?? 0}</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="metric">
          <strong>Alerts</strong>
        </div>
        {loading && <div className="metric">Loading alerts...</div>}
        {!loading && response?.alerts?.length === 0 && <div className="metric">No alerts yet</div>}
        <ul className="list">
          {response?.alerts?.map((alert) => (
            <li key={alert.id} className="tag" style={{ borderColor: severityColors[alert.severity] || 'var(--border)' }}>
              <span style={{ color: severityColors[alert.severity] || 'var(--muted)' }}>{alert.type}</span>
              <span>|</span>
              <span>{alert.message}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="metric">
          <strong>Subscriptions (normalized)</strong>
        </div>
        {error && <div className="metric" style={{ color: '#f37b7b' }}>{error}</div>}
        <div className="table">
          <div className="table-head">
            <span>Name</span>
            <span>Cycle</span>
            <span>Native cost</span>
            <span>Normalized monthly</span>
            <span>Status</span>
          </div>
          {loading && <div className="metric">Loading...</div>}
          {!loading &&
            filteredData.map((sub) => (
              <div className="table-row" key={sub.id}>
                <div>
                  <div className="row-title">{sub.name}</div>
                  <div className="row-subtitle">{sub.provider || 'N/A'}</div>
                </div>
                <div>{sub.billingCycle}</div>
                <div>
                  {sub.currency} {sub.cost.toFixed(2)}
                </div>
                <div>
                  {response?.meta.baseCurrency} {sub.normalizedMonthlyCost.toFixed(2)}
                  {sub.wasConverted && sub.displayNote ? (
                    <div className="row-subtitle">{sub.displayNote}</div>
                  ) : null}
                </div>
                <div>
                  <span
                    className="status-pill"
                    style={{
                      borderColor: statusColors[sub.status] || 'var(--border)',
                      color: statusColors[sub.status] || 'var(--muted)'
                    }}
                  >
                    {sub.status}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="metric">
          <strong>CSV import (preview or commit)</strong>
        </div>
        <div className="import-grid">
          <label className="upload">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => handleCsvUpload(e.target.files?.[0] || null)}
              disabled={csvBusy}
            />
            <span>{csvBusy ? 'Uploading...' : 'Choose CSV'}</span>
          </label>
          <label className="filter">
            <span>Commit to DB</span>
            <input
              type="checkbox"
              checked={csvCommit}
              onChange={(e) => setCsvCommit(e.target.checked)}
              disabled={csvBusy}
            />
          </label>
        </div>
        {csvResult && (
          <div className="metric">
            Preview rows: {csvResult.preview.length} | Created: {csvResult.stats.created} | Valid:{' '}
            {csvResult.stats.valid} | Invalid: {csvResult.stats.invalid} | Committed:{' '}
            {csvResult.stats.committed ? 'Yes' : 'No'}
          </div>
        )}
        {csvResult?.errors?.length ? (
          <ul className="list">
            {csvResult.errors.map((err, idx) => (
              <li key={idx} className="tag" style={{ borderColor: '#f37b7b', color: '#f37b7b' }}>
                Row {err.row}: {err.message}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </main>
  )
}

function summaryStatus(response: ApiResponse | null) {
  if (!response?.meta?.statusCounts) return '-'
  return Object.entries(response.meta.statusCounts)
    .map(([k, v]) => `${k}: ${v}`)
    .join(' | ')
}
