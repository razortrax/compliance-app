import { writeFile, readFile, mkdir } from "fs/promises";
import path from "path";

let s3Client: any = null;

// Lazy import to avoid bundling when not configured
async function getS3() {
  if (s3Client) return s3Client;
  const accessKeyId = process.env.DO_SPACES_KEY;
  const secretAccessKey = process.env.DO_SPACES_SECRET;
  const endpoint = process.env.DO_SPACES_ENDPOINT; // e.g., https://nyc3.digitaloceanspaces.com
  const region = process.env.DO_SPACES_REGION || "us-east-1";

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    return null;
  }

  const AWS = await import("aws-sdk");
  s3Client = new AWS.S3({
    endpoint,
    region,
    credentials: { accessKeyId, secretAccessKey },
    s3ForcePathStyle: false,
    signatureVersion: "v4",
  });
  return s3Client;
}

export interface UploadParams {
  key: string; // path/key in bucket or local
  contentType: string;
  body: Buffer | ArrayBuffer;
}

export interface DownloadParams {
  key: string;
}

export const storage = {
  async upload({ key, contentType, body }: UploadParams): Promise<string> {
    // Prefer Spaces when configured
    const s3 = await getS3();
    const bucket = process.env.DO_SPACES_BUCKET;
    if (s3 && bucket) {
      await s3
        .putObject({ Bucket: bucket, Key: key, Body: Buffer.from(body as Buffer), ContentType: contentType, ACL: "private" })
        .promise();
      const endpoint = process.env.DO_SPACES_CDN || process.env.DO_SPACES_ENDPOINT;
      // Return canonical URL; downloads can also be proxied
      return `${endpoint}/${bucket}/${key}`;
    }

    // Local disk fallback
    const uploadsDir = path.join(process.cwd(), "uploads");
    await mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, key.replace(/\//g, "_"));
    await writeFile(filePath, Buffer.from(body as Buffer));
    return filePath;
  },

  async download({ key }: DownloadParams): Promise<Buffer> {
    const s3 = await getS3();
    const bucket = process.env.DO_SPACES_BUCKET;
    if (s3 && bucket) {
      const res = await s3.getObject({ Bucket: bucket, Key: key }).promise();
      return Buffer.from(res.Body as Buffer);
    }

    const uploadsDir = path.join(process.cwd(), "uploads");
    const filePath = path.join(uploadsDir, key.replace(/\//g, "_"));
    return readFile(filePath);
  },
};


