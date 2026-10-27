import React, { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchEvents } from '../store/slices/eventSlice'
import { fetchListings } from '../store/slices/listingSlice'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom colored marker factory
const coloredIcon = (color) => L.divIcon({
  html: `<div style="
    width:20px;height:20px;border-radius:50% 50% 50% 0;
    background:${color};border:2px solid #fff;
    transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.4)
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 20],
  popupAnchor: [0, -22],
  className: ''
})

const EVENT_COLOR   = '#7c3aed'
const LISTING_COLOR = '#06b6d4'

function MapView() {
  const dispatch  = useDispatch()
  const { events }   = useSelector(state => state.events)
  const { listings } = useSelector(state => state.listings)
  const { user }     = useSelector(state => state.auth)

  const [filter, setFilter]   = useState('all')
  const [boundaryLoading, setBoundaryLoading] = useState(false)
  const [neighborhoodName, setNeighborhoodName] = useState(user?.neighborhood || '')

  const mapRef      = useRef(null)
  const mapInst     = useRef(null)
  const markersRef  = useRef([])
  const boundaryRef = useRef(null)

  useEffect(() => {
    dispatch(fetchEvents())
    dispatch(fetchListings())
  }, [dispatch])

  // ── Init map ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapInst.current || !mapRef.current) return

    const center = (user?.lat && user?.lng)
      ? [user.lat, user.lng]
      : [20.5937, 78.9629]
    const zoom = (user?.lat && user?.lng) ? 13 : 5

    const map = L.map(mapRef.current, { center, zoom })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    mapInst.current = map

    // Load user's neighborhood boundary
    if (user?.neighborhood) {
      loadNeighborhoodBoundary(map, user.neighborhood, user?.lat, user?.lng)
    }

    return () => { map.remove(); mapInst.current = null }
  }, []) // eslint-disable-line

  // ── Load neighborhood boundary from Nominatim ──────────────────────────
  const loadNeighborhoodBoundary = async (map, neighborhood, lat, lng) => {
    setBoundaryLoading(true)
    try {
      let url
      if (lat && lng) {
        url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&polygon_geojson=1`
      } else {
        url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(neighborhood)}&format=json&polygon_geojson=1&limit=1`
      }

      const res  = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'LocalLoop-App' } })
      const data = await res.json()
      const item = Array.isArray(data) ? data[0] : data

      if (item?.geojson) {
        if (boundaryRef.current) { boundaryRef.current.remove() }
        boundaryRef.current = L.geoJSON(item.geojson, {
          style: {
            color: '#7c3aed', weight: 3,
            fillColor: '#7c3aed', fillOpacity: 0.08,
            dashArray: '8,5'
          }
        }).addTo(map)

        // Fit map to boundary
        map.fitBounds(boundaryRef.current.getBounds(), { padding: [30, 30] })

        // Detect display name
        const addr = item.address || {}
        const label =
          addr.neighbourhood || addr.suburb || addr.quarter ||
          addr.city_district || addr.village || addr.town || addr.city || neighborhood
        const city = addr.city || addr.town || addr.village || ''
        const fullLabel = city && city.toLowerCase() !== label.toLowerCase()
          ? `${label}, ${city}` : label
        setNeighborhoodName(fullLabel)
      }
    } catch (err) {
      console.error('Boundary fetch error:', err)
    }
    setBoundaryLoading(false)
  }

  // ── Update markers when data or filter changes ────────────────────────
  useEffect(() => {
    if (!mapInst.current) return

    // Clear old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    const showEvents   = filter === 'all' || filter === 'events'
    const showListings = filter === 'all' || filter === 'listings'

    if (showEvents) {
      events.filter(e => e.lat && e.lng).forEach(evt => {
        const m = L.marker([evt.lat, evt.lng], { icon: coloredIcon(EVENT_COLOR) })
          .addTo(mapInst.current)
          .bindPopup(`
            <div style="min-width:180px;font-family:sans-serif">
              <div style="font-weight:700;margin-bottom:4px;color:#7c3aed">📅 ${evt.title}</div>
              <div style="font-size:12px;color:#888">${evt.neighborhood}</div>
              <div style="font-size:12px;margin-top:4px">${evt.location || ''}</div>
            </div>
          `)
        markersRef.current.push(m)
      })
    }

    if (showListings) {
      listings.filter(l => l.lat && l.lng).forEach(lst => {
        const m = L.marker([lst.lat, lst.lng], { icon: coloredIcon(LISTING_COLOR) })
          .addTo(mapInst.current)
          .bindPopup(`
            <div style="min-width:180px;font-family:sans-serif">
              <div style="font-weight:700;margin-bottom:4px;color:#06b6d4">🛍️ ${lst.title}</div>
              <div style="font-size:12px;color:#888">${lst.neighborhood}</div>
              <div style="font-size:12px;margin-top:4px">${lst.price > 0 ? '₹' + lst.price : 'Free'}</div>
            </div>
          `)
        markersRef.current.push(m)
      })
    }
  }, [events, listings, filter])

  const eventCount   = events.filter(e => e.lat && e.lng).length
  const listingCount = listings.filter(l => l.lat && l.lng).length

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div className="page-wrapper">

          {/* Header */}
          <div className="page-header">
            <h1 className="page-title">🗺️ Neighborhood Map</h1>
            <p className="page-subtitle">
              {neighborhoodName
                ? <>Showing activity in <strong style={{ color: 'var(--accent-primary)' }}>{neighborhoodName}</strong></>
                : 'See what\'s happening around your neighborhood'}
            </p>
          </div>

          {/* Legend + Filters */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            {/* Filter chips */}
            <div className="filter-bar" style={{ marginBottom: 0 }}>
              <button className={`filter-chip ${filter === 'all'      ? 'active' : ''}`} onClick={() => setFilter('all')}>🌐 All</button>
              <button className={`filter-chip ${filter === 'events'   ? 'active' : ''}`} onClick={() => setFilter('events')}>📅 Events ({eventCount})</button>
              <button className={`filter-chip ${filter === 'listings' ? 'active' : ''}`} onClick={() => setFilter('listings')}>🛍️ Listings ({listingCount})</button>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: EVENT_COLOR, display: 'inline-block' }} />
                Events
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: LISTING_COLOR, display: 'inline-block' }} />
                Listings
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 24, height: 3, background: '#7c3aed', borderRadius: 2, border: '1px dashed #7c3aed', display: 'inline-block' }} />
                Your Neighborhood
              </span>
            </div>
          </div>

          {/* Boundary loading notice */}
          {boundaryLoading && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 14px', marginBottom: 10,
              background: 'rgba(124,58,237,0.1)', borderRadius: 'var(--radius-md)',
              fontSize: '0.82rem', color: 'var(--accent-primary)'
            }}>
              <div style={{ width: 14, height: 14, border: '2px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              Loading your neighborhood boundary…
            </div>
          )}

          {/* Map */}
          <div className="map-container" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div ref={mapRef} style={{ height: '500px', width: '100%' }} />
          </div>

          {/* Empty state */}
          {eventCount === 0 && listingCount === 0 && (
            <div className="card" style={{ marginTop: 16, textAlign: 'center', padding: 20 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                📍 No items with location data yet. Events and listings with coordinates will appear on the map.
              </div>
            </div>
          )}

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    </div>
  )
}

export default MapView
