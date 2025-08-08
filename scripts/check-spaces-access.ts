import 'dotenv/config';
import AWS from 'aws-sdk';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

async function main() {
  const accessKeyId = requireEnv('DO_SPACES_KEY');
  const secretAccessKey = requireEnv('DO_SPACES_SECRET');
  const endpoint = requireEnv('DO_SPACES_ENDPOINT');
  const bucket = requireEnv('DO_SPACES_BUCKET');
  const region = process.env.DO_SPACES_REGION || 'us-east-1';

  const s3 = new AWS.S3({
    endpoint,
    region,
    credentials: { accessKeyId, secretAccessKey },
    s3ForcePathStyle: false,
    signatureVersion: 'v4',
  });

  // Try listing the bucket root (no prefix)
  const listed = await s3
    .listObjectsV2({ Bucket: bucket, MaxKeys: 5 })
    .promise();
  console.log('ListObjectsV2 OK. Keys:', (listed.Contents || []).map((o) => o.Key));

  // Try a tiny put and delete
  const testKey = `healthchecks/spaces_access_${Date.now()}.txt`;
  await s3
    .putObject({ Bucket: bucket, Key: testKey, Body: Buffer.from('ok'), ContentType: 'text/plain', ACL: 'private' })
    .promise();
  console.log('PutObject OK:', testKey);
  await s3.deleteObject({ Bucket: bucket, Key: testKey }).promise();
  console.log('DeleteObject OK:', testKey);
}

main().catch((err) => {
  console.error('Spaces access check failed:', err?.message || err);
  process.exitCode = 1;
});


