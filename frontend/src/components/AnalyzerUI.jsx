import React, { useState } from 'react'
import MetricsPanel from './MetricsPanel'
import MapPanel from './MapPanel'
import SidebarPanel from './SidebarPanel'

const CITIES = ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Vellore', 'Erode']

export default function AnalyzerUI({ apiBaseUrl }) {
  const [selectedCity, setSelectedCity] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)

  const handleAnalyze = async () => {
    if (!selectedCity) {
      setError('Please select a city')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const resp = await fetch(`${apiBaseUrl}/analyze?place=${encodeURIComponent(selectedCity + ', Tamil Nadu, India')}&cell_size_m=500&threshold_percent=10`)
      if (!resp.ok) throw new Error(`API error: ${resp.status}`)
      const data = await resp.json()
      setAnalysisResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <div className="header">
        <div className="logo">
          <svg viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" fill="#3B6D11" opacity="0.15"/>
            <path d="M10 14V9" stroke="#3B6D11" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M7 11c0-2 1.5-4 3-5 1.5 1 3 3 3 5H7z" fill="#639922"/>
          </svg>
        </div>
        <div>
          <h1>GreenGrid TN — Open Urban Green-space Analyzer</h1>
          <p>Real-time OSM data analysis for Tamil Nadu cities</p>
        </div>
      </div>

      <div className="controls">
        <div className="control-group">
          <label>City</label>
          <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
            <option value="">Select a city...</option>
            {CITIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label>Analysis type</label>
          <select>
            <option>Full analysis</option>
          </select>
        </div>
        <button className="analyze-btn" onClick={handleAnalyze} disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px', background: '#FCEBEB', color: '#E24B4A', borderRadius: '6px', marginBottom: '12px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {analysisResult && (
        <>
          <MetricsPanel metrics={analysisResult.metrics} />
          <div className="main-content">
            <MapPanel greenGeoJson={analysisResult.green_geojson} lowGreenGeoJson={analysisResult.low_green_geojson} city={selectedCity} />
            <SidebarPanel metrics={analysisResult.metrics} />
          </div>
        </>
      )}
    </div>
  )
}
