'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, X } from 'lucide-react'

interface DigitalSignatureProps {
  cafId: string
  cafNumber: string
  staffName: string
  signatureType: 'COMPLETION' | 'APPROVAL'
  onSignatureComplete: (signature: SignatureData) => void
  onCancel: () => void
}

interface SignatureData {
  signatureType: string
  notes?: string
  digitalSignature: string
}

export const DigitalSignature = ({
  cafId,
  cafNumber,
  staffName,
  signatureType,
  onSignatureComplete,
  onCancel
}: DigitalSignatureProps) => {
  const [notes, setNotes] = useState('')
  const [isSigningMode, setIsSigningMode] = useState(false)
  const [signatureDrawn, setSignatureDrawn] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  const getSignatureTypeLabel = (type: string) => {
    switch (type) {
      case 'COMPLETION':
        return 'Work Completion'
      case 'APPROVAL':
        return 'Supervisor Approval'
      default:
        return type
    }
  }

  const getSignatureDescription = (type: string) => {
    switch (type) {
      case 'COMPLETION':
        return 'I certify that I have completed all required corrective actions as specified in this CAF.'
      case 'APPROVAL':
        return 'I have reviewed and approve the completion of this corrective action form.'
      default:
        return 'I acknowledge and sign this corrective action form.'
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isSigningMode) return
    
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(x, y)
      setIsDrawing(true)
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isSigningMode) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.lineTo(x, y)
      ctx.stroke()
      setSignatureDrawn(true)
    }
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        setSignatureDrawn(false)
      }
    }
  }

  const handleStartSigning = () => {
    setIsSigningMode(true)
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
      }
    }
  }

  const handleConfirmSignature = async () => {
    if (!signatureDrawn) {
      alert('Please draw your signature before confirming.')
      return
    }

    setIsSigning(true)
    
    try {
      const canvas = canvasRef.current
      if (canvas) {
        const signatureDataUrl = canvas.toDataURL()
        
        const signatureData: SignatureData = {
          signatureType,
          notes: notes.trim() || undefined,
          digitalSignature: signatureDataUrl
        }

        onSignatureComplete(signatureData)
      }
    } catch (error) {
      console.error('Error processing signature:', error)
      alert('Error processing signature. Please try again.')
    } finally {
      setIsSigning(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Digital Signature Required
        </CardTitle>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">CAF {cafNumber}</Badge>
            <Badge variant="secondary">{getSignatureTypeLabel(signatureType)}</Badge>
          </div>
          <p className="text-sm text-gray-600">Staff Member: {staffName}</p>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Signature Statement */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Certification Statement</h3>
          <p className="text-sm text-gray-700">
            {getSignatureDescription(signatureType)}
          </p>
        </div>

        {/* Notes Section */}
        <div>
          <Label htmlFor="signature-notes">Additional Notes (Optional)</Label>
          <Textarea
            id="signature-notes"
            placeholder="Add any additional comments about the completion..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* Signature Canvas */}
        <div>
          <Label>Digital Signature</Label>
          <div className="mt-2">
            {!isSigningMode ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <p className="text-gray-500 mb-4">Click below to begin signing</p>
                <Button onClick={handleStartSigning}>
                  Start Signing
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="border-2 border-gray-300 rounded-lg">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={150}
                    className="w-full h-36 cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={clearSignature}>
                    Clear
                  </Button>
                  <span className="text-xs text-gray-500 flex-1 self-center">
                    Draw your signature above
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSigning}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSignature}
            disabled={!isSigningMode || !signatureDrawn || isSigning}
            className="flex-1"
          >
            {isSigning ? (
              'Processing...'
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Signature
              </>
            )}
          </Button>
        </div>

        {/* Legal Notice */}
        <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded border">
          <strong>Legal Notice:</strong> By signing this document digitally, you are providing 
          a legally binding electronic signature equivalent to a handwritten signature. 
          This signature will be recorded with a timestamp and IP address for audit purposes.
        </div>
      </CardContent>
    </Card>
  )
} 