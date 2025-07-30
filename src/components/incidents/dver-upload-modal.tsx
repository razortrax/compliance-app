'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileText, AlertCircle, CheckCircle, Zap } from 'lucide-react'
import { DVERProcessor, type DVERDocument } from '@/lib/dver-automation'

interface DVERUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onDVERProcessed: (dver: DVERDocument) => void
}

type ProcessingStage = 'upload' | 'ocr' | 'parsing' | 'validation' | 'complete' | 'error'

interface ProcessingState {
  stage: ProcessingStage
  progress: number
  message: string
  extractedData?: Partial<DVERDocument>
  error?: string
}

export function DVERUploadModal({ isOpen, onClose, onDVERProcessed }: DVERUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState<ProcessingState>({
    stage: 'upload',
    progress: 0,
    message: 'Select a DVER document to upload'
  })

  const processor = new DVERProcessor({
    provider: 'AWS_TEXTRACT', // Configure based on environment
    confidence_threshold: 0.8,
    preprocessing: {
      deskew: true,
      noise_reduction: true,
      contrast_enhancement: true
    }
  })

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff']
      if (!validTypes.includes(selectedFile.type)) {
        setProcessing({
          stage: 'error',
          progress: 0,
          message: 'Please select a PDF or image file',
          error: 'Invalid file type'
        })
        return
      }

      // Validate file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setProcessing({
          stage: 'error',
          progress: 0,
          message: 'File size must be less than 10MB',
          error: 'File too large'
        })
        return
      }

      setFile(selectedFile)
      setProcessing({
        stage: 'upload',
        progress: 0,
        message: `Selected: ${selectedFile.name}`
      })
    }
  }

  const processDVER = async () => {
    if (!file) return

    try {
      // Stage 1: OCR Processing
      setProcessing({
        stage: 'ocr',
        progress: 20,
        message: 'Extracting text from document...'
      })

      // Stage 2: Data Parsing
      setProcessing({
        stage: 'parsing',
        progress: 60,
        message: 'Parsing inspection data...'
      })

      // Process the DVER
      const dverData = await processor.processDVER(file)

      // Stage 3: Validation
      setProcessing({
        stage: 'validation',
        progress: 80,
        message: 'Validating extracted data...'
      })

      // Stage 4: Complete
      setProcessing({
        stage: 'complete',
        progress: 100,
        message: 'DVER processed successfully!',
        extractedData: dverData
      })

      // Pass the processed data to parent component
      setTimeout(() => {
        onDVERProcessed(dverData)
        onClose()
      }, 1500)

    } catch (error) {
      console.error('DVER processing error:', error)
      setProcessing({
        stage: 'error',
        progress: 0,
        message: 'Failed to process DVER',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const resetModal = () => {
    setFile(null)
    setProcessing({
      stage: 'upload',
      progress: 0,
      message: 'Select a DVER document to upload'
    })
  }

  const getStageIcon = () => {
    switch (processing.stage) {
      case 'upload': return <Upload className="h-5 w-5" />
      case 'ocr': return <FileText className="h-5 w-5 animate-pulse" />
      case 'parsing': return <Zap className="h-5 w-5 animate-pulse" />
      case 'validation': return <CheckCircle className="h-5 w-5 animate-pulse" />
      case 'complete': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />
    }
  }

  const renderExtractedDataPreview = () => {
    if (!processing.extractedData) return null

    const data = processing.extractedData
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          Extracted Data Preview
        </h4>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Inspector:</span> {data.inspectorName || 'Not found'}
          </div>
          <div>
            <span className="font-medium">Date:</span> {data.inspectionDate || 'Not found'}
          </div>
          <div>
            <span className="font-medium">Location:</span> {data.inspectionLocation || 'Not found'}
          </div>
          <div>
            <span className="font-medium">Equipment Units:</span> {data.equipment?.length || 0}
          </div>
          <div>
            <span className="font-medium">Violations:</span> {data.violations?.length || 0}
          </div>
          <div>
            <span className="font-medium">Result:</span> {data.overallResult || 'Not specified'}
          </div>
        </div>

        {data.violations && data.violations.length > 0 && (
          <div className="mt-3">
            <span className="font-medium">Violation Codes:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {data.violations.slice(0, 5).map((v, i) => (
                <Badge key={i} variant={v.outOfService ? 'destructive' : 'secondary'}>
                  {v.violationCode}
                </Badge>
              ))}
              {data.violations.length > 5 && (
                <Badge variant="outline">+{data.violations.length - 5} more</Badge>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Upload DVER Document
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          {processing.stage === 'upload' && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-3">
                Upload PDF or image of Driver Vehicle Examination Report
              </p>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.tiff"
                onChange={handleFileSelect}
                className="max-w-xs mx-auto"
              />
              {file && (
                <p className="text-xs text-gray-500 mt-2">
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
                </p>
              )}
            </div>
          )}

          {/* Processing Status */}
          {processing.stage !== 'upload' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {getStageIcon()}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{processing.message}</span>
                    <span className="text-xs text-gray-500">{processing.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all" 
                      style={{ width: `${processing.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {processing.stage === 'error' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {processing.error || 'An error occurred during processing'}
                  </AlertDescription>
                </Alert>
              )}

              {processing.stage === 'complete' && renderExtractedDataPreview()}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            {processing.stage === 'upload' && (
              <>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={processDVER} disabled={!file}>
                  Process DVER
                </Button>
              </>
            )}

            {processing.stage === 'error' && (
              <>
                <Button variant="outline" onClick={resetModal}>
                  Try Again
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </>
            )}

            {processing.stage === 'complete' && (
              <Button onClick={onClose}>
                Continue to Form
              </Button>
            )}

            {['ocr', 'parsing', 'validation'].includes(processing.stage) && (
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 