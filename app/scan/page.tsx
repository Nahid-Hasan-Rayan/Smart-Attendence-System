'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useRouter } from 'next/navigation'

export default function ScanPage() {
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
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
      // Check if it's a permission error
      if (errorMessage.includes('Permission') || errorMessage.includes('denied')) {
        setError('Camera access denied. Please enable camera permissions and refresh.')
      } else {
        console.warn(errorMessage)
      }
    }

    // Hide loading after a short delay (assuming scanner renders)
    const timer = setTimeout(() => setIsLoading(false), 1000)

    return () => {
      clearTimeout(timer)
      scanner.clear().catch(console.error)
    }
  }, [])

  const submitAttendance = async (qrData: string) => {
    try {
      const { sessionId, token } = JSON.parse(qrData)

      const formData = new FormData()
      formData.append('sessionId', sessionId)
      formData.append('token', token)

      const res = await fetch('/scan', {
        method: 'POST',
        body: formData,
      })

      const result = await res.json()

      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        setSuccess(true)
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      }
    } catch (err) {
      setError('Invalid QR code format')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Scan QR Code</h1>

        {isLoading && !error && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-gray-600">Initializing camera...</p>
          </div>
        )}

        {!isLoading && !scanResult && !success && !error && (
          <div className="bg-white p-6 rounded-lg shadow">
            <div id="qr-reader" className="mb-4"></div>
            <p className="text-sm text-gray-500 text-center">
              Position the QR code within the frame to scan.
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
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
          <div className="mt-4 p-4 bg-green-50 text-green-600 rounded-lg text-center">
            ✅ Attendance marked successfully! Redirecting...
          </div>
        )}
      </div>
    </div>
  )
}