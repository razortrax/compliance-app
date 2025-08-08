const fs = require('fs');
const path = require('path');

// Load envs: prefer .env.local, fallback to .env
const dotenv = require('dotenv');
const envLocalPath = path.resolve('.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}

const AWS = require('aws-sdk');

function requireEnv(name) {
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

  const listed = await s3.listObjectsV2({ Bucket: bucket, MaxKeys: 5 }).promise();
  console.log('[OK] ListObjectsV2:', (listed.Contents || []).map((o) => o.Key));

  const testKey = `healthchecks/spaces_access_${Date.now()}.txt`;
  await s3
    .putObject({ Bucket: bucket, Key: testKey, Body: Buffer.from('ok'), ContentType: 'text/plain', ACL: 'private' })
    .promise();
  console.log('[OK] PutObject:', testKey);
  await s3.deleteObject({ Bucket: bucket, Key: testKey }).promise();
  console.log('[OK] DeleteObject:', testKey);
}

main().catch((err) => {
  console.error('[FAIL]', err && err.message ? err.message : err);
  if (err && err.code) console.error('[CODE]', err.code);
  process.exitCode = 1;
});


