import React, { useState, useRef, useEffect } from 'react'
import './styles.css'

const CITIES = ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Vellore', 'Erode']

// Demo data fallback
const DEMO_DATA = {
  Chennai: { pop: 10971108, area: 17600, greenArea: 1232, parks: 182, forests: 3, waterBodies: 19,
    zones: [{name:'T. Nagar',score:28,type:'bad'},{name:'Adyar',score:52,type:'warn'},{name:'Anna Nagar',score:47,type:'warn'},{name:'Guindy',score:61,type:'good'},{name:'Perambur',score:19,type:'bad'}],
    recs:[{title:'Perambur industrial corridor',desc:'Convert vacant lots into linear green corridor',tag:'corridor'},{title:'T. Nagar pocket parks',desc:'7 identified vacant plots for pocket parks',tag:'park'},{title:'Adyar riverbank trees',desc:'Plant 5,000 trees along Adyar riverfront',tag:'tree'}]
  },
  Coimbatore: { pop: 2151466, area: 24600, greenArea: 2952, parks: 94, forests: 12, waterBodies: 11,
    zones:[{name:'Gandhipuram',score:31,type:'bad'},{name:'R.S.Puram',score:58,type:'warn'},{name:'Peelamedu',score:72,type:'good'},{name:'Saibaba Colony',score:55,type:'warn'},{name:'Podanur',score:67,type:'good'}],
    recs:[{title:'Noyyal riverbank restoration',desc:'Green buffer along Noyyal river, 12km stretch',tag:'corridor'},{title:'Gandhipuram urban forest',desc:'Convert 3 identified plots into mini-forests',tag:'park'},{title:'Industrial zone tree cover',desc:'Mandatory tree planting in SIDCO zones',tag:'tree'}]
  },
  Madurai: { pop: 1561129, area: 14765, greenArea: 1180, parks: 67, forests: 5, waterBodies: 7,
    zones:[{name:'North Madurai',score:22,type:'bad'},{name:'Tallakulam',score:44,type:'warn'},{name:'K.K.Nagar',score:49,type:'warn'},{name:'Anna Nagar',score:55,type:'warn'},{name:'Thirunagar',score:38,type:'bad'}],
    recs:[{title:'Vaigai riverfront park',desc:'Linear park along 6km of Vaigai riverbank',tag:'park'},{title:'Old Town green necklace',desc:'Series of pocket parks in old city core',tag:'park'},{title:'NH stretch tree planting',desc:'Avenue trees along NH-38 entry corridors',tag:'tree'}]
  },
  Tiruchirappalli: { pop: 1021717, area: 16733, greenArea: 2342, parks: 71, forests: 8, waterBodies: 14,
    zones:[{name:'Srirangam',score:61,type:'good'},{name:'Ariyamangalam',score:33,type:'bad'},{name:'Thiruverumbur',score:41,type:'warn'},{name:'Puthur',score:57,type:'warn'},{name:'Woraiyur',score:29,type:'bad'}],
    recs:[{title:'Cauvery floodplain greening',desc:'Restore native vegetation on floodplains',tag:'corridor'},{title:'Woraiyur neighbourhood parks',desc:'4 sites identified for new parks',tag:'park'},{title:'Rock Fort buffer greenery',desc:'Heritage zone tree plantation',tag:'tree'}]
  },
  Salem: { pop: 981086, area: 9196, greenArea: 965, parks: 44, forests: 6, waterBodies: 5,
    zones:[{name:'Fairlands',score:48,type:'warn'},{name:'Shevapet',score:21,type:'bad'},{name:'Suramangalam',score:55,type:'warn'},{name:'Kondalampatti',score:63,type:'good'},{name:'Ammapettai',score:32,type:'bad'}],
    recs:[{title:'Shevapet linear park',desc:'Transform drainage canal banks into greenway',tag:'corridor'},{title:'Mettur road corridor',desc:'Dense tree canopy on 8km arterial road',tag:'tree'},{title:'Veerapandi landfill park',desc:'Convert legacy landfill into ecological park',tag:'park'}]
  },
  Tirunelveli: { pop: 901668, area: 18880, greenArea: 2643, parks: 55, forests: 9, waterBodies: 8,
    zones:[{name:'Melapalayam',score:35,type:'bad'},{name:'Palayamkottai',score:62,type:'good'},{name:'Nanguneri',score:71,type:'good'},{name:'Sankarankovil',score:44,type:'warn'},{name:'Ambasamudram',score:58,type:'warn'}],
    recs:[{title:'Tamirabarani greening',desc:'Riparian buffer restoration, 15km stretch',tag:'corridor'},{title:'Melapalayam parks network',desc:'Connect 3 existing parks with green links',tag:'corridor'},{title:'Urban forest — Palayamkottai',desc:'30ha urban forest on government land',tag:'park'}]
  },
  Vellore: { pop: 523013, area: 8735, greenArea: 742, parks: 31, forests: 4, waterBodies: 6,
    zones:[{name:'Kosapet',score:18,type:'bad'},{name:'Sathuvachari',score:45,type:'warn'},{name:'Katpadi',score:39,type:'bad'},{name:'Gandhi Nagar',score:52,type:'warn'},{name:'Bagayam',score:61,type:'good'}],
    recs:[{title:'Palar riverbank park',desc:'Floodplain park on Palar left bank',tag:'park'},{title:'Fort area heritage garden',desc:'Restore and expand fort moat greenery',tag:'park'},{title:'Kosapet green network',desc:'Series of tree-lined streets and plots',tag:'tree'}]
  },
  Erode: { pop: 657856, area: 9248, greenArea: 1018, parks: 38, forests: 5, waterBodies: 7,
    zones:[{name:'Brough Road',score:24,type:'bad'},{name:'Veerappanchatiram',score:49,type:'warn'},{name:'Thindal',score:66,type:'good'},{name:'Chithode',score:43,type:'warn'},{name:'Perundurai',score:37,type:'bad'}],
    recs:[{title:'Cauvery-Bhavani confluence park',desc:'Ecological reserve at river confluence',tag:'park'},{title:'Brough Road greening',desc:'Emergency tree planting in heat island zone',tag:'tree'},{title:'Textile zone corridors',desc:'Green buffers between industrial clusters',tag:'corridor'}]
  }
}

function calcMetrics(d) {
  const greenPct = (d.greenArea / d.area * 100).toFixed(1)
  const perCapita = (d.greenArea * 10000 / d.pop).toFixed(1)
  const whoStd = 9
  const susScore = Math.min(100, Math.round((parseFloat(greenPct)/15*40) + (parseFloat(perCapita)/whoStd*40) + (d.parks/300*20)))
  return { greenPct, perCapita, susScore }
}

function getZoneColor(type) { return type==='good'?'#3B6D11':type==='warn'?'#BA7517':'#E24B4A' }

function MapCanvas({ city, data }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    if (!canvasRef.current || !city || !data) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    canvas.width = canvas.offsetWidth * dpr
    canvas.height = canvas.offsetHeight * dpr
    ctx.scale(dpr, dpr)
    const W = canvas.offsetWidth, H = canvas.offsetHeight
    ctx.clearRect(0, 0, W, H)
    const isDark = matchMedia('(prefers-color-scheme: dark)').matches
    ctx.fillStyle = isDark ? '#1a1f1a' : '#f4f7f0'
    ctx.fillRect(0, 0, W, H)

    const rng = mulberry32(city.charCodeAt(0)*31 + city.charCodeAt(1))
    function mulberry32(a) { return () => { a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296 } }

    const gridW=8, gridH=6, cW=W/gridW, cH=H/gridH
    const greenPct = parseFloat(calcMetrics(data).greenPct)/100
    for(let r=0;r<gridH;r++) for(let c=0;c<gridW;c++){
      const v=rng(); let color
      if(v<greenPct*1.2) color=isDark?'#27500A':'#C0DD97'
      else if(v<greenPct*1.2+0.25) color=isDark?'#3C3489':'#B5D4F4'
      else if(v<greenPct*1.2+0.45) color=isDark?'#501313':'#F7C1C1'
      else color=isDark?'#2C2C2A':'#D3D1C7'
      ctx.fillStyle=color
      ctx.beginPath(); ctx.roundRect(c*cW+2,r*cH+2,cW-4,cH-4,4); ctx.fill()
    }
    for(let i=0;i<6;i++){
      const x=rng()*W*0.8+W*0.1, y=rng()*H*0.8+H*0.1
      ctx.fillStyle=isDark?'#3B6D11':'#639922'; ctx.globalAlpha=0.9
      ctx.beginPath(); ctx.arc(x,y,6+rng()*8,0,Math.PI*2); ctx.fill()
    }
    ctx.globalAlpha=0.7
    for(let i=0;i<3;i++){
      const x=rng()*W*0.8+W*0.1, y=rng()*H*0.8+H*0.1
      ctx.fillStyle='#E24B4A'
      ctx.beginPath(); ctx.arc(x,y,5+rng()*6,0,Math.PI*2); ctx.fill()
    }
    ctx.globalAlpha=1
    ctx.fillStyle=isDark?'#eee':'#222'; ctx.font='12px sans-serif'; ctx.fillText(city,12,22)
  }, [city, data])

  return <canvas ref={canvasRef} className="map-canvas" style={{width:'100%', height:'100%'}} />
}

function ChartComponent({ chartId, type, data, options }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) return
    if (chartRef.current) chartRef.current.destroy()

    const Chart = window.Chart
    if (!Chart) return

    chartRef.current = new Chart(canvasRef.current, { type, data, options })
    return () => { if (chartRef.current) chartRef.current.destroy() }
  }, [type, data, options])

  return <canvas ref={canvasRef} style={{width:'100%', height:'100%'}} />
}

export default function App() {
  const [selectedCity, setSelectedCity] = useState('')
  const [loading, setLoading] = useState(false)
  const [analysisData, setAnalysisData] = useState(null)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('zones')
  const isDark = matchMedia('(prefers-color-scheme: dark)').matches

  const handleAnalyze = async () => {
    if (!selectedCity) { alert('Please select a city.'); return }
    setLoading(true)
    setError(null)
    try {
      const place = selectedCity + ', Tamil Nadu, India'
      const resp = await fetch(`http://localhost:8000/analyze?place=${encodeURIComponent(place)}&cell_size_m=500&threshold_percent=10`)
      if (!resp.ok) throw new Error(`API error: ${resp.status}`)
      const apiData = await resp.json()
      const demoData = DEMO_DATA[selectedCity]
      setAnalysisData({ ...apiData, demoData, selectedCity })
    } catch (e) {
      setError(e.message)
      // Fallback to demo data
      const demoData = DEMO_DATA[selectedCity]
      setAnalysisData({ metrics: { green_percent: parseFloat(calcMetrics(demoData).greenPct), area_place_m2: demoData.area*1e6, area_green_m2: demoData.greenArea*1e6 }, demoData, selectedCity, isDemo: true })
    } finally {
      setLoading(false)
    }
  }

  if (!analysisData) {
    return (
      <div className="app" style={{padding:'1rem'}}>
        <div className="header">
          <div className="logo">
            <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" fill="#3B6D11" opacity="0.15"/><path d="M10 14V9" stroke="#3B6D11" strokeWidth="1.5" strokeLinecap="round"/><path d="M7 11c0-2 1.5-4 3-5 1.5 1 3 3 3 5H7z" fill="#639922"/></svg>
          </div>
          <div><h1>GreenGrid TN — Open Urban Green-space Analyzer</h1><p>Real-time OSM data analysis for Tamil Nadu cities</p></div>
        </div>
        <div className="controls">
          <div className="control-group"><label>City</label>
            <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
              <option value="">Select a city...</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="control-group"><label>Analysis type</label>
            <select><option>Full analysis</option></select>
          </div>
          <button className="analyze-btn" onClick={handleAnalyze} disabled={loading}>{loading ? 'Analyzing...' : 'Analyze'}</button>
        </div>
        {error && <div style={{padding:'12px', background:'#FCEBEB', color:'#E24B4A', borderRadius:'6px', marginBottom:'12px', fontSize:'13px'}}>{error}</div>}
      </div>
    )
  }

  const d = analysisData.demoData
  const m = calcMetrics(d)
  const metrics = analysisData.metrics || { green_percent: parseFloat(m.greenPct), area_place_m2: d.area*1e6, area_green_m2: d.greenArea*1e6 }

  const gcBadge = metrics.green_percent>=15?'badge-good':metrics.green_percent>=8?'badge-warn':'badge-bad'
  const pcBadge = parseFloat(m.perCapita)>=9?'badge-good':parseFloat(m.perCapita)>=4?'badge-warn':'badge-bad'
  const scBadge = m.susScore>=65?'badge-good':m.susScore>=40?'badge-warn':'badge-bad'

  const isDark_used = isDark
  const txtColor = isDark_used?'#aaa':'#666'

  const getAIInsights = () => {
    const greenPct = metrics.green_percent.toFixed(1)
    const badZonesArr = d.zones.filter(z => z.type === 'bad')
    const badZoneNames = badZonesArr.slice(0, 2).map(z => z.name).join(', ')
    const firstRec = d.recs[0] ? d.recs[0].title : 'identified areas'
    const popDensity = (d.pop / Math.sqrt(d.area * 1000000)).toFixed(0)
    return `Based on current analysis: ${selectedCity} shows ${greenPct}% green cover with priority zones in ${badZoneNames}. Focus interventions on converting ${firstRec} and enhancing public access through green corridors. Population density is ${popDensity} people/km\xB2, requiring urban greening at scale.`
  }

  // Chart 1 data and options (doughnut)
  const chart1Data = {
    labels: ['Green area', 'Built area', 'Other open'],
    datasets: [{
      data: [d.greenArea, d.area * 0.55, d.area - d.greenArea - d.area * 0.55],
      backgroundColor: ['#3B6D11', '#888780', '#B4B2A9'],
      borderWidth: 0
    }]
  }
  const chart1Options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    cutout: '65%'
  }

  // Chart 2 data and options (bar)
  const chart2Data = {
    labels: ['Green', 'Parks', 'Forest', 'Water'],
    datasets: [{
      data: [d.greenArea / 100, d.parks * 1.2, d.forests * 20, d.waterBodies * 15],
      backgroundColor: ['#3B6D11', '#639922', '#97C459', '#185FA5'],
      borderWidth: 0,
      borderRadius: 4
    }]
  }
  const chart2Options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        ticks: { color: txtColor, font: { size: 11 } },
        grid: { display: false }
      },
      y: {
        ticks: { color: txtColor, font: { size: 11 } },
        grid: { color: isDark_used ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }
      }
    }
  }

  return (
    <div className="app" style={{padding:'1rem'}}>
      <div className="header">
        <div className="logo">
          <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" fill="#3B6D11" opacity="0.15"/><path d="M10 14V9" stroke="#3B6D11" strokeWidth="1.5" strokeLinecap="round"/><path d="M7 11c0-2 1.5-4 3-5 1.5 1 3 3 3 5H7z" fill="#639922"/></svg>
        </div>
        <div><h1>GreenGrid TN — Open Urban Green-space Analyzer</h1><p>Real-time OSM data analysis for Tamil Nadu cities {analysisData.isDemo && '(Demo)'}</p></div>
      </div>

      <div className="controls">
        <div className="control-group"><label>City</label>
          <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
            <option value="">Select a city...</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="control-group"><label>Analysis type</label>
          <select><option value="full">Full analysis</option></select>
        </div>
        <button className="analyze-btn" onClick={handleAnalyze} disabled={loading}>{loading ? 'Analyzing...' : 'Analyze'}</button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card"><div className="metric-label">Green cover</div><div className="metric-value">{metrics.green_percent.toFixed(1)}<span style={{fontSize:'14px'}}>%</span></div><div className="metric-unit">{(d.greenArea/100).toFixed(0)} km² of {(d.area/100).toFixed(0)} km²</div><span className={`metric-badge ${gcBadge}`}>{metrics.green_percent>=15?'Meets target':metrics.green_percent>=8?'Below target':'Critical'}</span></div>
        <div className="metric-card"><div className="metric-label">Green space per capita</div><div className="metric-value">{m.perCapita}<span style={{fontSize:'14px'}}>m²</span></div><div className="metric-unit">WHO target: 9 m²/person</div><span className={`metric-badge ${pcBadge}`}>{parseFloat(m.perCapita)>=9?'Above WHO':'Below WHO'}</span></div>
        <div className="metric-card"><div className="metric-label">Parks & reserves</div><div className="metric-value">{d.parks + d.forests}</div><div className="metric-unit">{d.parks} parks · {d.forests} forest patches</div><span className="metric-badge badge-warn">{d.waterBodies} water bodies</span></div>
        <div className="metric-card"><div className="metric-label">Sustainability score</div><div className="metric-value">{m.susScore}<span style={{fontSize:'14px'}}>/100</span></div><div className="metric-unit">Composite index</div><span className={`metric-badge ${scBadge}`}>{m.susScore>=65?'Good':m.susScore>=40?'Moderate':'Poor'}</span></div>
      </div>

      <div className="main-content">
        <div className="map-container">
          <MapCanvas city={selectedCity} data={d} />
          <div className="map-legend">
            <div className="legend-item"><div className="legend-dot" style={{background:'#3B6D11'}}></div>Existing green</div>
            <div className="legend-item"><div className="legend-dot" style={{background:'#E24B4A'}}></div>Underserved zone</div>
            <div className="legend-item"><div className="legend-dot" style={{background:'#185FA5'}}></div>Recommended site</div>
            <div className="legend-item"><div className="legend-dot" style={{background:'#BA7517'}}></div>Dense urban area</div>
          </div>
        </div>
        <div className="sidebar">
          <div className="panel">
            <div className="tabs">
              <div className={`tab ${activeTab==='zones'?'active':''}`} onClick={() => setActiveTab('zones')}>Zones</div>
              <div className={`tab ${activeTab==='score'?'active':''}`} onClick={() => setActiveTab('score')}>Score</div>
            </div>
            {activeTab==='zones' && (
              <div className="zone-list">
                {d.zones.map((z, i) => (
                  <div key={i} className="zone-item">
                    <div className="zone-dot" style={{background:getZoneColor(z.type)}}></div>
                    <div className="zone-name">{z.name}</div>
                    <span className="zone-score" style={{color:getZoneColor(z.type)}}>{z.score}/100</span>
                  </div>
                ))}
              </div>
            )}
            {activeTab==='score' && (
              <div className="score-row">
                <div className="progress-ring">
                  <svg className="ring-svg" width="80" height="80" viewBox="0 0 80 80">
                    <circle className="ring-bg" cx="40" cy="40" r="32"/>
                    <circle className="ring-fill" cx="40" cy="40" r="32" stroke={m.susScore>=65?'#3B6D11':m.susScore>=40?'#BA7517':'#E24B4A'} strokeDasharray={2*Math.PI*32} strokeDashoffset={2*Math.PI*32*(1-m.susScore/100)}/>
                  </svg>
                  <div className="ring-center"><div className="ring-val">{m.susScore}</div><div className="ring-sub">score</div></div>
                </div>
                <div className="score-labels">
                  {[['Green cover',Math.min(100,parseFloat(m.greenPct)/15*100),'#3B6D11'],['Per capita',Math.min(100,parseFloat(m.perCapita)/9*100),'#185FA5'],['Park density',Math.min(100,d.parks/200*100),'#BA7517']].map(([l,v,c])=>(
                    <div key={l} className="bar-row">
                      <div className="bar-label"><span style={{fontSize:'12px',color:'var(--color-text-secondary)'}}>{l}</span><span style={{fontSize:'12px',fontWeight:500}}>{Math.round(v)}%</span></div>
                      <div className="bar-track"><div className="bar-fill" style={{width:v+'%',background:c}}></div></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="panel">
            <h3>Recommendations</h3>
            <div className="rec-list">
              {d.recs.map((r, i) => (
                <div key={i} className="rec-item">
                  <div className="rec-title">{r.title}</div>
                  <div className="rec-desc">{r.desc}</div>
                  <span className={`rec-tag tag-${r.tag}`}>{r.tag==='park'?'New park':r.tag==='corridor'?'Green corridor':'Tree planting'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'1.5rem'}}>
        <div className="panel">
          <h3>Green cover breakdown</h3>
          <div style={{position:'relative',height:'200px'}}><ChartComponent chartId="chart1" type="doughnut" data={chart1Data} options={chart1Options} /></div>
        </div>
        <div className="panel">
          <h3>Area comparison (ha)</h3>
          <div style={{position:'relative',height:'200px'}}><ChartComponent chartId="chart2" type="bar" data={chart2Data} options={chart2Options} /></div>
        </div>
      </div>

      <div className="ai-section">
        <h3>AI Planning Insights</h3>
        <div className="ai-output">{getAIInsights()}</div>
      </div>
    </div>
  )
}
