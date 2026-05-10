'use client'

import { useEffect, useRef } from 'react'

interface TeamMapTeam {
  id: string
  hostingCourse: 'appetizer' | 'main' | 'dessert'
  hostAddress: string
  hostLat?: number | null
  hostLng?: number | null
  member1: { firstName: string; lastName: string }
  member2: { firstName: string; lastName: string }
}

interface TeamMapProps {
  teams: TeamMapTeam[]
  onPinMove?: (teamId: string, lat: number, lng: number) => void
}

const courseColors: Record<string, string> = {
  appetizer: '#22c55e',
  main: '#f97316',
  dessert: '#ec4899',
}

const courseLabelMap: Record<string, string> = {
  appetizer: '🥗 Appetizer',
  main: '🍝 Main Course',
  dessert: '🍰 Dessert',
}

function makeIcon(color: string): any {
  // Returns a Leaflet DivIcon with a colored circle
  if (typeof window === 'undefined') return null
  const L = (window as any).L
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 28px; height: 28px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      cursor: grab;
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  })
}

export default function TeamMap({ teams, onPinMove }: TeamMapProps) {
  const mapRef = useRef<any>(null)
  const containerId = 'team-leaflet-map'

  useEffect(() => {
    // Dynamically load leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    // Dynamically load leaflet JS
    const loadLeaflet = async () => {
      if (!(window as any).L) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
          script.onload = () => resolve()
          script.onerror = reject
          document.head.appendChild(script)
        })
      }

      const L = (window as any).L

      // Destroy previous map instance if any
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }

      const container = document.getElementById(containerId)
      if (!container) return

      // Find teams with coordinates
      const teamsWithCoords = teams.filter(t => t.hostLat != null && t.hostLng != null)

      // Default center: Matrimandir, Auroville (Tamil Nadu, India) when no coords available
      const defaultCenter: [number, number] = teamsWithCoords.length > 0
        ? [teamsWithCoords[0].hostLat!, teamsWithCoords[0].hostLng!]
        : [11.9344, 79.8115]

      const map = L.map(container).setView(defaultCenter, teamsWithCoords.length > 0 ? 13 : 14)
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      // Add markers for teams with coordinates
      const markers: any[] = []
      for (const team of teamsWithCoords) {
        const color = courseColors[team.hostingCourse] ?? '#888'
        const icon = makeIcon(color)
        const marker = L.marker([team.hostLat, team.hostLng], {
          draggable: true,
          icon,
        }).addTo(map)

        marker.bindPopup(`
          <div style="min-width: 160px; font-family: sans-serif;">
            <div style="font-weight: 600; color: ${color}; margin-bottom: 4px;">${courseLabelMap[team.hostingCourse]}</div>
            <div style="font-size: 13px; color: #374151;">${team.member1.firstName} ${team.member1.lastName}</div>
            <div style="font-size: 13px; color: #374151;">${team.member2.firstName} ${team.member2.lastName}</div>
            ${team.hostAddress ? `<div style="font-size: 11px; color: #9ca3af; margin-top: 4px;">${team.hostAddress}</div>` : ''}
            <div style="font-size: 10px; color: #d1d5db; margin-top: 6px;">Drag marker to adjust position</div>
          </div>
        `)

        marker.on('dragend', () => {
          const pos = marker.getLatLng()
          onPinMove?.(team.id, pos.lat, pos.lng)
        })

        markers.push(marker)
      }

      // Fit bounds to all markers
      if (markers.length > 1) {
        const group = L.featureGroup(markers)
        map.fitBounds(group.getBounds().pad(0.2))
      }
    }

    loadLeaflet()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [teams])

  const teamsWithCoords = teams.filter(t => t.hostLat != null && t.hostLng != null)

  return (
    <div className="space-y-2">
      <div
        id={containerId}
        style={{ height: '400px', borderRadius: '16px', overflow: 'hidden', border: '2px solid #fde68a' }}
      />
      {teamsWithCoords.length < teams.length && (
        <p className="text-xs text-amber-600">
          {teams.length - teamsWithCoords.length} team{teams.length - teamsWithCoords.length !== 1 ? 's' : ''} could not be geocoded and won&apos;t appear on the map.
          You can drag existing pins or regenerate teams.
        </p>
      )}
    </div>
  )
}
