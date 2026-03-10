'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Using CDN URLs for marker icons (avoids webpack import issues)
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})
L.Marker.prototype.options.icon = DefaultIcon

interface Location {
  lat: number
  lng: number
  radius: number
  address?: string
}

interface LocationPickerProps {
  onLocationChange: (location: Location) => void
  defaultLocation?: Partial<Location>
}

export default function LocationPicker({ onLocationChange, defaultLocation }: LocationPickerProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const circleRef = useRef<L.Circle | null>(null)
  const [radius, setRadius] = useState(defaultLocation?.radius || 100)
  const [address, setAddress] = useState(defaultLocation?.address || '')
  const [mapReady, setMapReady] = useState(false)

  // Initialize map
  useEffect(() => {
    if (mapRef.current) return

    const defaultLat = defaultLocation?.lat || 40.7128
    const defaultLng = defaultLocation?.lng || -74.0060

    const map = L.map('map').setView([defaultLat, defaultLng], 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map)

    mapRef.current = map
    setMapReady(true)

    // Add initial marker and circle
    const marker = L.marker([defaultLat, defaultLng]).addTo(map)
    const circle = L.circle([defaultLat, defaultLng], { radius }).addTo(map)
    markerRef.current = marker
    circleRef.current = circle

    // Handle map clicks
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng
      marker.setLatLng([lat, lng])
      circle.setLatLng([lat, lng])
      updateLocation(lat, lng, radius, address)
    })

    // Cleanup
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Update circle radius when slider changes
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radius)
      if (mapRef.current && markerRef.current) {
        const { lat, lng } = markerRef.current.getLatLng()
        updateLocation(lat, lng, radius, address)
      }
    }
  }, [radius])

  // Update location callback
  const updateLocation = (lat: number, lng: number, rad: number, addr: string) => {
    onLocationChange({ lat, lng, radius: rad, address: addr })
  }

  // Handle address change (optional, for display only)
  const handleAddressBlur = () => {
    if (markerRef.current) {
      const { lat, lng } = markerRef.current.getLatLng()
      updateLocation(lat, lng, radius, address)
    }
  }

  return (
    <div className="space-y-4">
      <div id="map" style={{ height: '400px', width: '100%', zIndex: 10 }} />
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Radius (meters):</label>
        <input
          type="range"
          min="10"
          max="500"
          step="10"
          value={radius}
          onChange={(e) => setRadius(parseInt(e.target.value))}
          className="w-64"
        />
        <span className="text-sm">{radius}m</span>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Address (optional)</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onBlur={handleAddressBlur}
          placeholder="e.g., Room 101, Building A"
          className="w-full p-2 border rounded"
        />
      </div>
    </div>
  )
}