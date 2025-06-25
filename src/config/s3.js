const { S3Client } = require('@aws-sdk/client-s3');

const minioEndpoint = `http://${process.env.MINIO_ENDPOINT}`;
const s3 = new S3Client({
  endpoint: minioEndpoint,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

module.exports = s3;