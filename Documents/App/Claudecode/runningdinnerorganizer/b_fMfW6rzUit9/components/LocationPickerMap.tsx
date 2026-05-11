'use client'

import { useEffect, useRef } from 'react'

interface LocationPickerMapProps {
  lat: number | null
  lng: number | null
  onChange: (lat: number, lng: number) => void
  /** Default center when no pin is set yet. Defaults to Auroville, India. */
  defaultCenter?: [number, number]
  defaultZoom?: number
}

export default function LocationPickerMap({
  lat,
  lng,
  onChange,
  defaultCenter = [12.0049, 79.8108],
  defaultZoom = 14,
}: LocationPickerMapProps) {
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const containerId = 'location-picker-map'

  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    const init = async () => {
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

      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
      }

      const container = document.getElementById(containerId)
      if (!container) return

      const center: [number, number] = lat != null && lng != null ? [lat, lng] : defaultCenter
      const zoom = lat != null && lng != null ? 16 : defaultZoom

      const map = L.map(container).setView(center, zoom)
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      const pinIcon = L.divIcon({
        className: '',
        html: `<div style="
          width: 32px; height: 32px;
          background: #f97316;
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 3px 10px rgba(0,0,0,0.35);
          cursor: pointer;
        "></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -36],
      })

      // If a pin is already set, place it
      if (lat != null && lng != null) {
        const marker = L.marker([lat, lng], { draggable: true, icon: pinIcon }).addTo(map)
        marker.bindPopup('Your location — drag to adjust').openPopup()
        marker.on('dragend', () => {
          const pos = marker.getLatLng()
          onChange(pos.lat, pos.lng)
        })
        markerRef.current = marker
      }

      // Click to place / move marker
      map.on('click', (e: any) => {
        const { lat: clickLat, lng: clickLng } = e.latlng

        if (markerRef.current) {
          markerRef.current.setLatLng([clickLat, clickLng])
        } else {
          const marker = L.marker([clickLat, clickLng], { draggable: true, icon: pinIcon }).addTo(map)
          marker.bindPopup('Your location — drag to adjust').openPopup()
          marker.on('dragend', () => {
            const pos = marker.getLatLng()
            onChange(pos.lat, pos.lng)
          })
          markerRef.current = marker
        }

        onChange(clickLat, clickLng)
      })
    }

    init()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
      }
    }
  }, [])

  // Update marker position if lat/lng changes externally (e.g. geocoded from address)
  useEffect(() => {
    if (!mapRef.current || lat == null || lng == null) return
    const L = (window as any).L
    if (!L) return

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
    } else {
      const pinIcon = L.divIcon({
        className: '',
        html: `<div style="
          width: 32px; height: 32px;
          background: #f97316;
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 3px 10px rgba(0,0,0,0.35);
          cursor: pointer;
        "></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -36],
      })
      const marker = L.marker([lat, lng], { draggable: true, icon: pinIcon }).addTo(mapRef.current)
      marker.bindPopup('Your location — drag to adjust').openPopup()
      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        onChange(pos.lat, pos.lng)
      })
      markerRef.current = marker
    }

    mapRef.current.setView([lat, lng], 16)
  }, [lat, lng])

  return (
    <div
      id={containerId}
      style={{
        height: '280px',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '2px solid #fde68a',
        cursor: 'crosshair',
      }}
    />
  )
}
