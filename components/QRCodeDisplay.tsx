'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { generateQrCode } from '@/app/dashboard/session/[id]/actions'


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
      const data = await generateQrCode(sessionId)
      setQrData(data)
    } catch (err: any) {
      setError(err.message || 'Failed to generate QR code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={generateQR}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Generating...' : 'Generate New QR Code'}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded text-sm">
          {error}
        </div>
      )}

      {qrData && (
        <div className="mt-6 p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Session QR Code</h3>
          <QRCodeSVG
            value={JSON.stringify({ sessionId, token: qrData.token })}
            size={200}
            className="mx-auto"
          />
          <p className="text-sm text-gray-600 mt-2 text-center">
            Expires at: {new Date(qrData.expiresAt).toLocaleTimeString()}
          </p>
          <p className="text-xs text-gray-500 mt-1 text-center">
            Scan this code to mark attendance. Valid for 10 minutes.
          </p>
        </div>
      )}
    </div>
  )
}