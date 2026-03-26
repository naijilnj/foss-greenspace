export default function MetricsPanel({ metrics }) {
  if (!metrics) return null
  const gcBadge = metrics.green_percent >= 15 ? 'badge-good' : metrics.green_percent >= 8 ? 'badge-warn' : 'badge-bad'
  const pcBadge = metrics.area_place_m2 > 0 ? 'badge-good' : 'badge-bad'
  return (
    <div className="metrics-grid">
      <div className="metric-card">
        <div className="metric-label">Green cover %</div>
        <div className="metric-value">{metrics.green_percent.toFixed(1)}<span style={{fontSize:'14px'}}>%</span></div>
        <div className="metric-unit">{(metrics.area_green_m2/1e6).toFixed(1)} km² of {(metrics.area_place_m2/1e6).toFixed(1)} km²</div>
        <span className={`metric-badge ${gcBadge}`}>{metrics.green_percent >= 15 ? 'Meets target' : 'Below target'}</span>
      </div>
      <div className="metric-card">
        <div className="metric-label">Analysis status</div>
        <div className="metric-value">✓</div>
        <div className="metric-unit">Data fetched from OSM</div>
        <span className="metric-badge badge-good">Complete</span>
      </div>
      <div className="metric-card">
        <div className="metric-label">Area</div>
        <div className="metric-value">{(metrics.area_place_m2/1e6).toFixed(1)}</div>
        <div className="metric-unit">km²</div>
      </div>
      <div className="metric-card">
        <div className="metric-label">Green area</div>
        <div className="metric-value">{(metrics.area_green_m2/1e6).toFixed(2)}</div>
        <div className="metric-unit">km²</div>
      </div>
    </div>
  )
}
