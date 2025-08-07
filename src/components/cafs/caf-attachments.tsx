'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Upload,
  FileText,
  Image,
  Download,
  Eye,
  Trash2,
  Plus,
  Camera,
  Paperclip,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react'

interface Attachment {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  uploadedAt: string
  uploadedBy?: {
    party: {
      person: {
        firstName: string
        lastName: string
      }
    }
  }
  attachmentType: string
  description?: string
  url?: string
}

interface CAFAttachmentsProps {
  cafId: string
  cafStatus: string
  isReadOnly?: boolean
  onAttachmentAdded?: () => void
}

export default function CAFAttachments({ 
  cafId, 
  cafStatus, 
  isReadOnly = false,
  onAttachmentAdded 
}: CAFAttachmentsProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadFormData, setUploadFormData] = useState({
    attachmentType: 'DOCUMENTATION',
    description: '',
    selectedFile: null as File | null
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchAttachments()
  }, [cafId])

  const fetchAttachments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/attachments?cafId=${cafId}`)
      if (response.ok) {
        const data = await response.json()
        setAttachments(data)
      }
    } catch (error) {
      console.error('Error fetching attachments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB')
        return
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ]

      if (!allowedTypes.includes(file.type)) {
        alert('Unsupported file type. Please upload PDF, images, Word documents, or text files.')
        return
      }

      setUploadFormData(prev => ({ ...prev, selectedFile: file }))
    }
  }

  const handleUpload = async () => {
    if (!uploadFormData.selectedFile) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadFormData.selectedFile)
      formData.append('cafId', cafId)
      formData.append('attachmentType', uploadFormData.attachmentType)
      formData.append('description', uploadFormData.description)

      const response = await fetch('/api/attachments', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        await fetchAttachments()
        setShowUploadDialog(false)
        setUploadFormData({
          attachmentType: 'DOCUMENTATION',
          description: '',
          selectedFile: null
        })
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        onAttachmentAdded?.()
      } else {
        const error = await response.json()
        alert(`Upload failed: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (attachment: Attachment) => {
    try {
      const response = await fetch(`/api/attachments/${attachment.id}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = attachment.fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Download failed. Please try again.')
    }
  }

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return

    try {
      const response = await fetch(`/api/attachments/${attachmentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchAttachments()
      } else {
        alert('Failed to delete attachment.')
      }
    } catch (error) {
      console.error('Error deleting attachment:', error)
      alert('Delete failed. Please try again.')
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500" />
    } else if (fileType === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-500" />
    } else {
      return <Paperclip className="h-5 w-5 text-gray-500" />
    }
  }

  const getAttachmentTypeColor = (type: string) => {
    switch (type) {
      case 'DOCUMENTATION':
        return 'bg-blue-100 text-blue-800'
      case 'SIGNATURE':
        return 'bg-green-100 text-green-800'
      case 'PHOTO':
        return 'bg-purple-100 text-purple-800'
      case 'COMPLETION_EVIDENCE':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const canUpload = () => {
    if (isReadOnly) return false
    // Allow uploads for any status except CANCELLED
    return cafStatus !== 'CANCELLED'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents & Attachments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Documents & Attachments</CardTitle>
          {canUpload() && (
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Document
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="file">Select File</Label>
                    <Input
                      id="file"
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Max 10MB. Supported: PDF, images, Word docs, text files
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="attachmentType">Document Type</Label>
                    <Select
                      value={uploadFormData.attachmentType}
                      onValueChange={(value) => setUploadFormData(prev => ({ ...prev, attachmentType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DOCUMENTATION">General Documentation</SelectItem>
                        <SelectItem value="COMPLETION_EVIDENCE">Completion Evidence</SelectItem>
                        <SelectItem value="PHOTO">Photo/Image</SelectItem>
                        <SelectItem value="SIGNATURE">Signature Document</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={uploadFormData.description}
                      onChange={(e) => setUploadFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of this document..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowUploadDialog(false)}
                      disabled={uploading}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleUpload}
                      disabled={!uploadFormData.selectedFile || uploading}
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-1" />
                          Upload
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {attachments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Paperclip className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No documents attached</p>
            {canUpload() && (
              <p className="text-sm">Upload documents to support this CAF</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3 flex-1">
                  {getFileIcon(attachment.fileType)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{attachment.fileName}</p>
                      <Badge className={getAttachmentTypeColor(attachment.attachmentType)}>
                        {attachment.attachmentType.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{formatFileSize(attachment.fileSize)}</span>
                      <span>
                        Uploaded {new Date(attachment.uploadedAt).toLocaleDateString()}
                      </span>
                      {attachment.uploadedBy && (
                        <span>
                          by {attachment.uploadedBy.party.person.firstName} {attachment.uploadedBy.party.person.lastName}
                        </span>
                      )}
                    </div>
                    {attachment.description && (
                      <p className="text-sm text-gray-600 mt-1">{attachment.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(attachment)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {!isReadOnly && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(attachment.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 