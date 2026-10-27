import React, { useState, useEffect, useRef, useCallback } from 'react'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default marker icon paths (broken in Vite/webpack)
import L from 'leaflet'
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

/**
 * NeighborhoodMapPicker
 *
 * Props:
 *  - value: { neighborhood, lat, lng } — current value (for edit mode)
 *  - onChange: ({ neighborhood, lat, lng }) => void
 *  - height: string (default '340px')
 */
const NeighborhoodMapPicker = ({ value, onChange, height = '340px' }) => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const polygonRef = useRef(null)

  const [detected, setDetected] = useState(
    value?.neighborhood
      ? { neighborhood: value.neighborhood, lat: value.lat, lng: value.lng }
      : null
  )
  const [loading, setLoading] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [error, setError] = useState(null)

  // ── Nominatim reverse geocode ─────────────────────────────────────────────
  const reverseGeocode = useCallback(async (lat, lng) => {
    setLoading(true)
    setError(null)
    try {
      const url =
        `https://nominatim.openstreetmap.org/reverse` +
        `?lat=${lat}&lon=${lng}&format=json&addressdetails=1&polygon_geojson=1`

      const res = await fetch(url, {
        headers: { 'Accept-Language': 'en', 'User-Agent': 'LocalLoop-App' }
      })
      const data = await res.json()

      if (data.error) {
        setError('No area found at this location. Try clicking in a city or town.')
        setLoading(false)
        return
      }

      const addr = data.address || {}

      // Smart label: most specific available level
      const label =
        addr.neighbourhood ||
        addr.suburb ||
        addr.quarter ||
        addr.city_district ||
        addr.village ||
        addr.town ||
        addr.city ||
        addr.county ||
        addr.state_district ||
        addr.state ||
        'Unknown area'

      // Build a readable full label: suburb + city (if different)
      const city = addr.city || addr.town || addr.village || ''
      const state = addr.state || ''
      const fullLabel =
        city && city.toLowerCase() !== label.toLowerCase()
          ? `${label}, ${city}${state ? ', ' + state : ''}`
          : `${label}${state ? ', ' + state : ''}`

      const neighborhoodKey = fullLabel.toLowerCase().trim()

      // Draw boundary polygon if Nominatim returned GeoJSON
      if (polygonRef.current) {
        polygonRef.current.remove()
        polygonRef.current = null
      }
      if (data.geojson && mapInstanceRef.current) {
        polygonRef.current = L.geoJSON(data.geojson, {
          style: {
            color: '#7c3aed',
            weight: 2.5,
            fillColor: '#7c3aed',
            fillOpacity: 0.12,
            dashArray: '6,4'
          }
        }).addTo(mapInstanceRef.current)
      }

      const result = { neighborhood: neighborhoodKey, lat, lng, displayName: fullLabel }
      setDetected(result)
      onChange(result)
    } catch (err) {
      setError('Could not fetch area info. Check your internet connection.')
    }
    setLoading(false)
  }, [onChange])

  // ── Place/move marker ────────────────────────────────────────────────────
  const placeMarker = useCallback((lat, lng) => {
    if (!mapInstanceRef.current) return
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
    } else {
      markerRef.current = L.marker([lat, lng]).addTo(mapInstanceRef.current)
    }
    reverseGeocode(lat, lng)
  }, [reverseGeocode])

  // ── Init Leaflet map (once) ──────────────────────────────────────────────
  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return

    const initialCenter = (value?.lat && value?.lng)
      ? [value.lat, value.lng]
      : [20.5937, 78.9629] // India center
    const initialZoom = (value?.lat && value?.lng) ? 13 : 5

    const map = L.map(mapRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    map.on('click', (e) => {
      placeMarker(e.latlng.lat, e.latlng.lng)
    })

    mapInstanceRef.current = map

    // If editing and already has location, place marker + geocode
    if (value?.lat && value?.lng) {
      markerRef.current = L.marker([value.lat, value.lng]).addTo(map)
      // Don't re-geocode if neighborhood already known
      if (value.neighborhood) {
        setDetected({ neighborhood: value.neighborhood, lat: value.lat, lng: value.lng, displayName: value.neighborhood })
      }
    }

    return () => {
      map.remove()
      mapInstanceRef.current = null
      markerRef.current = null
      polygonRef.current = null
    }
  }, []) // eslint-disable-line

  // ── GPS auto-locate ──────────────────────────────────────────────────────
  const handleGPS = () => {
    if (!navigator.geolocation) {
      setError('GPS is not supported by your browser.')
      return
    }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 14)
        }
        placeMarker(latitude, longitude)
        setGpsLoading(false)
      },
      () => {
        setError('Could not get your location. Please click on the map instead.')
        setGpsLoading(false)
      }
    )
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Map container */}
      <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div ref={mapRef} style={{ height, width: '100%' }} />

        {/* GPS Button — floats over map */}
        <button
          type="button"
          onClick={handleGPS}
          disabled={gpsLoading}
          title="Use my current location"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 1000,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            fontSize: '0.82rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            transition: 'all 0.2s',
          }}
        >
          {gpsLoading
            ? <><span style={{ width: 14, height: 14, border: '2px solid var(--accent-primary)', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Locating…</>
            : <>📍 Use My Location</>
          }
        </button>

        {/* Loading overlay */}
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(10,10,20,0.45)',
            zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 10, color: '#fff', fontSize: '0.9rem'
          }}>
            <div style={{ width: 32, height: 32, border: '3px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            Detecting neighborhood…
          </div>
        )}
      </div>

      {/* Hint text */}
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
        Click anywhere on the map or use GPS to auto-detect your neighborhood
      </p>

      {/* Error */}
      {error && (
        <div style={{
          marginTop: 8, padding: '10px 14px',
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)',
          borderRadius: 'var(--radius-md)', color: '#fca5a5', fontSize: '0.84rem'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Detected neighborhood chip */}
      {detected && !error && (
        <div style={{
          marginTop: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 16px',
          background: 'rgba(124,58,237,0.12)',
          border: '1px solid rgba(124,58,237,0.4)',
          borderRadius: 'var(--radius-md)',
          animation: 'fadeIn 0.3s ease'
        }}>
          <span style={{ fontSize: '1.2rem' }}>📍</span>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Detected Neighborhood
            </div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--accent-primary)' }}>
              {detected.displayName || detected.neighborhood}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {detected.lat?.toFixed(4)}, {detected.lng?.toFixed(4)}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}

export default NeighborhoodMapPicker
