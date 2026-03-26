export default function SidebarPanel({ metrics }) {
  if (!metrics) return null
  return (
    <div className="sidebar">
      <div className="panel">
        <h3>Analysis Summary</h3>
        <div className="zone-list">
          <div className="zone-item">
            <div className="zone-dot" style={{background:'#3B6D11'}}></div>
            <div className="zone-name">Green cover %</div>
            <span className="zone-score">{metrics.green_percent.toFixed(1)}%</span>
          </div>
          <div className="zone-item">
            <div className="zone-dot" style={{background:'#185FA5'}}></div>
            <div className="zone-name">Total area</div>
            <span className="zone-score">{(metrics.area_place_m2/1e6).toFixed(1)} km²</span>
          </div>
          <div className="zone-item">
            <div className="zone-dot" style={{background:'#639922'}}></div>
            <div className="zone-name">Green area</div>
            <span className="zone-score">{(metrics.area_green_m2/1e6).toFixed(2)} km²</span>
          </div>
        </div>
      </div>
      <div className="panel">
        <h3>Next Steps</h3>
        <div className="rec-list">
          <div className="rec-item">
            <div className="rec-title">Explore zones</div>
            <div className="rec-desc">Analyze underserved areas on the map</div>
            <span className="rec-tag tag-park">Priority zones</span>
          </div>
          <div className="rec-item">
            <div className="rec-title">Plan interventions</div>
            <div className="rec-desc">Design parks, corridors, or tree planting</div>
            <span className="rec-tag tag-tree">Action items</span>
          </div>
        </div>
      </div>
    </div>
  )
}
