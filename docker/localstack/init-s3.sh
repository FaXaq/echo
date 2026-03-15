#!/bin/bash
set -e

BUCKET="${S3_BUCKET_NAME:-echo-dev}"

echo "Creating S3 bucket: $BUCKET"
awslocal s3 mb "s3://$BUCKET" || true

echo "Setting CORS policy on bucket: $BUCKET"
awslocal s3api put-bucket-cors \
  --bucket "$BUCKET" \
  --cors-configuration '{
    "CORSRules": [{
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "HEAD", "DELETE"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": ["ETag"]
    }]
  }'

echo "LocalStack S3 init complete."
