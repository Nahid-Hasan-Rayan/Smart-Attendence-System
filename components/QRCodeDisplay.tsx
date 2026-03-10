'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface QRCodeDisplayProps {
  sessionId: string
}

export default function QRCodeDisplay({ sessionId }: QRCodeDisplayProps) {
  const [qrData, setQrData] = useState<{ token: string; expiresAt: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generateQR = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/session/${sessionId}/generate-qr`, {
        method: 'POST',
      })
      const data = await res.json()
      if (res.ok) {
        setQrData(data)
      } else {
        setError(data.error || 'Failed to generate QR code')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={generateQR}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Generating...' : 'Generate New QR Code'}
      </button>
      {error && <p className="mt-2 text-red-600">{error}</p>}
      {qrData && (
        <div className="mt-4">
          <QRCodeSVG
            value={JSON.stringify({ sessionId, token: qrData.token })}
            size={200}
            className="border p-2"
          />
          <p className="text-sm text-gray-600 mt-2">
            Expires at: {new Date(qrData.expiresAt).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  )
}