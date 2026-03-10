'use client'

import { useEffect, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useRouter } from 'next/navigation'
import { generateDeviceFingerprint } from '@/lib/fingerprint'

export default function ScanPage() {
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    )

    scanner.render(onScanSuccess, onScanError)

    function onScanSuccess(decodedText: string) {
      scanner.clear()
      setScanResult(decodedText)
      submitAttendance(decodedText)
    }

    function onScanError(errorMessage: string) {
      console.warn(errorMessage)
    }

    return () => {
      scanner.clear().catch(console.error)
    }
  }, [])

  const submitAttendance = async (qrData: string) => {
    try {
      const { sessionId, token } = JSON.parse(qrData)

      // Request user's location
      setGettingLocation(true)
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        })
      })
      setGettingLocation(false)

      const userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }

      // Generate device fingerprint
      const fingerprint = generateDeviceFingerprint()

      const res = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId, 
          token, 
          userLocation,
          deviceFingerprint: fingerprint 
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => router.push('/dashboard'), 2000)
      } else {
        setError(data.error || 'Failed to mark attendance')
      }
    } catch (err: any) {
      setGettingLocation(false)
      if (err.code === 1) { // Geolocation permission denied
        setError('Location permission denied. Please enable location services to check in.')
      } else if (err.code === 2) { // Position unavailable
        setError('Unable to get your location. Please try again.')
      } else if (err.code === 3) { // Timeout
        setError('Location request timed out.')
      } else {
        setError('Invalid QR code format or network error.')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Scan QR Code</h1>

        <div className="bg-white p-6 rounded-lg shadow">
          {gettingLocation && (
            <div className="text-center py-4">
              <p>Getting your location...</p>
            </div>
          )}

          {!scanResult && !success && !error && !gettingLocation && (
            <div id="qr-reader" className="mb-4"></div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded">
              {error}
              <button
                onClick={() => window.location.reload()}
                className="block mt-2 text-sm underline"
              >
                Try again
              </button>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 text-green-600 rounded text-center">
              ✅ Attendance marked successfully! Redirecting...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}