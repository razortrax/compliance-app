import { S3Client } from '@aws-sdk/client-s3'
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// DigitalOcean Spaces configuration
const SPACES_CONFIG = {
  endpoint: process.env.DO_SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com',
  region: process.env.DO_SPACES_REGION || 'nyc3',
  bucket: process.env.DO_SPACES_BUCKET || 'compliance-app-files',
  accessKeyId: process.env.DO_SPACES_KEY || '',
  secretAccessKey: process.env.DO_SPACES_SECRET || '',
  cdnEndpoint: process.env.DO_SPACES_CDN_ENDPOINT || ''
}

// Initialize S3 client for DigitalOcean Spaces
const spacesClient = new S3Client({
  endpoint: SPACES_CONFIG.endpoint,
  region: SPACES_CONFIG.region,
  credentials: {
    accessKeyId: SPACES_CONFIG.accessKeyId,
    secretAccessKey: SPACES_CONFIG.secretAccessKey,
  },
  forcePathStyle: false, // Use virtual hosted-style URLs
})

export interface UploadResult {
  key: string
  url: string
  cdnUrl?: string
  size: number
  contentType: string
}

/**
 * Upload a file to DigitalOcean Spaces
 */
export async function uploadToSpaces(
  file: Buffer | Uint8Array,
  key: string,
  contentType: string,
  metadata?: Record<string, string>
): Promise<UploadResult> {
  try {
    const command = new PutObjectCommand({
      Bucket: SPACES_CONFIG.bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
      ACL: 'public-read', // Make files publicly accessible
      Metadata: metadata,
    })

    await spacesClient.send(command)

    const url = `${SPACES_CONFIG.endpoint}/${SPACES_CONFIG.bucket}/${key}`
    const cdnUrl = SPACES_CONFIG.cdnEndpoint 
      ? `${SPACES_CONFIG.cdnEndpoint}/${key}`
      : undefined

    return {
      key,
      url,
      cdnUrl,
      size: file.length,
      contentType,
    }
  } catch (error) {
    console.error('Error uploading to Spaces:', error)
    throw new Error('Failed to upload file to storage')
  }
}

/**
 * Generate a presigned URL for secure file uploads
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: SPACES_CONFIG.bucket,
      Key: key,
      ContentType: contentType,
      ACL: 'public-read',
    })

    return await getSignedUrl(spacesClient, command, { expiresIn })
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    throw new Error('Failed to generate upload URL')
  }
}

/**
 * Delete a file from DigitalOcean Spaces
 */
export async function deleteFromSpaces(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: SPACES_CONFIG.bucket,
      Key: key,
    })

    await spacesClient.send(command)
  } catch (error) {
    console.error('Error deleting from Spaces:', error)
    throw new Error('Failed to delete file from storage')
  }
}

/**
 * Generate a file key for organized storage
 */
export function generateFileKey(
  type: 'license' | 'document' | 'image',
  subType: string,
  issueId: string,
  fileName: string
): string {
  const timestamp = Date.now()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `${type}/${subType}/${issueId}/${timestamp}_${sanitizedFileName}`
}

/**
 * Get file URL (prefer CDN if available)
 */
export function getFileUrl(key: string): string {
  if (SPACES_CONFIG.cdnEndpoint) {
    return `${SPACES_CONFIG.cdnEndpoint}/${key}`
  }
  return `${SPACES_CONFIG.endpoint}/${SPACES_CONFIG.bucket}/${key}`
}

// Export client for advanced operations
export { spacesClient } 