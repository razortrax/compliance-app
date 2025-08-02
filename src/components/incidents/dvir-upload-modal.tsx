'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// Progress component - using simple div styling
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileText, AlertCircle, CheckCircle, Zap } from 'lucide-react'
import { DVIRProcessor, type DVIRDocument } from '@/lib/dvir-automation'

interface DVIRUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onDVIRProcessed: (dvir: DVIRDocument) => void
}

type ProcessingStage = 'upload' | 'ocr' | 'parsing' | 'validation' | 'complete'

interface ProcessingState {
  stage: ProcessingStage
  progress: number
  message: string
  extractedData?: Partial<DVIRDocument>
  error?: string
}

export function DVIRUploadModal({ isOpen, onClose, onDVIRProcessed }: DVIRUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState<ProcessingState>({
    stage: 'upload',
    progress: 0,
    message: 'Select a DVIR document to upload'
  })

  const processor = new DVIRProcessor({
    // Configure OCR service - in production, get from environment
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      region: process.env.AWS_REGION || 'us-east-1'
    }
  })

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
      if (!allowedTypes.includes(selectedFile.type)) {
        setProcessing({
          stage: 'upload',
          progress: 0,
          message: 'Please select a PDF or image file',
          error: 'Invalid file type'
        })
        return
      }

      // Validate file size (10MB max)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setProcessing({
          stage: 'upload',
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
        message: `Ready to process: ${selectedFile.name}`
      })
    }
  }

  const processDVIR = async () => {
    if (!file) return

    try {
      setProcessing({
        stage: 'ocr',
        progress: 10,
        message: 'Extracting text from document...'
      })

      // Simulate processing stages
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setProcessing({
        stage: 'parsing',
        progress: 50,
        message: 'Parsing inspection data...'
      })

      await new Promise(resolve => setTimeout(resolve, 1000))

      setProcessing({
        stage: 'validation',
        progress: 80,
        message: 'Validating extracted data...'
      })

      // Process the DVIR
      const dvirData = await processor.processDVIR(file)

      setProcessing({
        stage: 'complete',
        progress: 100,
        message: 'DVIR processed successfully!',
        extractedData: dvirData
      })

      // Auto-accept after 2 seconds
      setTimeout(() => {
        onDVIRProcessed(dvirData)
        handleClose()
      }, 2000)

    } catch (error) {
      console.error('DVIR processing error:', error)
      setProcessing({
        stage: 'upload',
        progress: 0,
        message: 'Failed to process DVIR',
        error: error instanceof Error ? error.message : 'Processing failed'
      })
    }
  }

  const handleClose = () => {
    setFile(null)
    setProcessing({
      stage: 'upload',
      progress: 0,
      message: 'Select a DVIR document to upload'
    })
    onClose()
  }

  const getStageIcon = (stage: ProcessingStage) => {
    switch (stage) {
      case 'upload': return <Upload className="h-5 w-5" />
      case 'ocr': return <FileText className="h-5 w-5" />
      case 'parsing': return <Zap className="h-5 w-5" />
      case 'validation': return <CheckCircle className="h-5 w-5" />
      case 'complete': return <CheckCircle className="h-5 w-5 text-green-600" />
      default: return <Upload className="h-5 w-5" />
    }
  }

  const getStageColor = (stage: ProcessingStage, current: ProcessingStage) => {
    const stages = ['upload', 'ocr', 'parsing', 'validation', 'complete']
    const currentIndex = stages.indexOf(current)
    const stageIndex = stages.indexOf(stage)
    
    if (stageIndex < currentIndex) return 'text-green-600'
    if (stageIndex === currentIndex) return 'text-blue-600'
    return 'text-gray-400'
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Upload DVIR Document
          </DialogTitle>
          <DialogDescription>
            Upload a Driver Vehicle Inspection Report (DVIR) to automatically extract inspection data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Processing Stages */}
          <div className="flex justify-between items-center">
            {(['upload', 'ocr', 'parsing', 'validation', 'complete'] as ProcessingStage[]).map((stage, index) => (
              <div key={stage} className="flex flex-col items-center space-y-2">
                <div className={`p-2 rounded-full border-2 ${
                  processing.stage === stage 
                    ? 'border-blue-500 bg-blue-50' 
                    : processing.progress > index * 25 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className={getStageColor(stage, processing.stage)}>
                    {getStageIcon(stage)}
                  </div>
                </div>
                <span className={`text-xs font-medium ${getStageColor(stage, processing.stage)}`}>
                  {stage.charAt(0).toUpperCase() + stage.slice(1)}
                </span>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${processing.progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">{processing.message}</p>
          </div>

          {/* File Upload Section */}
          {processing.stage === 'upload' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select DVIR Document</CardTitle>
                <CardDescription>
                  Choose a PDF or image file containing the inspection report
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-4 text-gray-400" />
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileSelect}
                      className="max-w-xs mx-auto"
                    />
                    <p className="text-sm text-gray-500">
                      PDF, JPG, or PNG files up to 10MB
                    </p>
                  </div>
                </div>

                {file && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-medium">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {processing.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{processing.error}</AlertDescription>
            </Alert>
          )}

          {/* Extracted Data Preview */}
          {processing.extractedData && processing.stage === 'complete' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Extracted Data Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Inspector:</span>
                    <p>{processing.extractedData.inspectorName || 'Not found'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Date:</span>
                    <p>{processing.extractedData.inspectionDate || 'Not found'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Report #:</span>
                    <p>{processing.extractedData.reportNumber || 'Not found'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Violations:</span>
                    <p>{processing.extractedData.violations?.length || 0} found</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={processDVIR} disabled={!file || processing.stage !== 'upload'}>
              Process DVIR
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 