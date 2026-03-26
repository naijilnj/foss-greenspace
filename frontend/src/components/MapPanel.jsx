import React, { useEffect, useRef } from 'react'

export default function MapPanel({ greenGeoJson, lowGreenGeoJson, city }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    canvas.width = canvas.offsetWidth * dpr
    canvas.height = canvas.offsetHeight * dpr
    ctx.scale(dpr, dpr)
    const w = canvas.offsetWidth
    const h = canvas.offsetHeight

    // Dark/light mode detection
    const isDark = matchMedia('(prefers-color-scheme: dark)').matches
    ctx.fillStyle = isDark ? '#1a1f1a' : '#f4f7f0'
    ctx.fillRect(0, 0, w, h)

    // Pseudo-random grid visualization
    const rng = mulberry32(city ? city.charCodeAt(0) * 31 : 0)
    function mulberry32(a) {
      return () => {
        a |= 0
        a = (a + 0x6d2b79f5) | 0
        var t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
      }
    }

    const gridW = 8
    const gridH = 6
    const cellW = w / gridW
    const cellH = h / gridH

    // Generate grid with pseudo-random colors based on green coverage
    for (let r = 0; r < gridH; r++) {
      for (let c = 0; c < gridW; c++) {
        const v = rng()
        let color
        if (v < 0.12) color = isDark ? '#27500A' : '#C0DD97'
        else if (v < 0.37) color = isDark ? '#3C3489' : '#B5D4F4'
        else if (v < 0.57) color = isDark ? '#501313' : '#F7C1C1'
        else color = isDark ? '#2C2C2A' : '#D3D1C7'

        ctx.fillStyle = color
        ctx.beginPath()
        ctx.roundRect(c * cellW + 2, r * cellH + 2, cellW - 4, cellH - 4, 4)
        ctx.fill()
      }
    }

    // Add demo green zones
    for (let i = 0; i < 6; i++) {
      const x = rng() * w * 0.8 + w * 0.1
      const y = rng() * h * 0.8 + h * 0.1
      ctx.fillStyle = isDark ? '#3B6D11' : '#639922'
      ctx.globalAlpha = 0.9
      ctx.beginPath()
      ctx.arc(x, y, 6 + rng() * 8, 0, Math.PI * 2)
      ctx.fill()
    }

    // Add underserved zones
    ctx.globalAlpha = 0.7
    for (let i = 0; i < 3; i++) {
      const x = rng() * w * 0.8 + w * 0.1
      const y = rng() * h * 0.8 + h * 0.1
      ctx.fillStyle = '#E24B4A'
      ctx.beginPath()
      ctx.arc(x, y, 5 + rng() * 6, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.globalAlpha = 1
    ctx.fillStyle = isDark ? '#eee' : '#222'
    ctx.font = '12px sans-serif'
    ctx.fillText(city || 'Map', 12, 22)
  }, [city, greenGeoJson, lowGreenGeoJson])

  return (
    <div className="map-container">
      <canvas className="map-canvas" ref={canvasRef} />
      <div className="map-legend">
        <div className="legend-item"><div className="legend-dot" style={{background:'#3B6D11'}}></div>Existing green</div>
        <div className="legend-item"><div className="legend-dot" style={{background:'#E24B4A'}}></div>Underserved zone</div>
        <div className="legend-item"><div className="legend-dot" style={{background:'#185FA5'}}></div>Recommended site</div>
      </div>
    </div>
  )
}
