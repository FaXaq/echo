import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { S3StoragePort } from "./s3-storage.port.js";

export function makeS3Storage(config: {
  bucket: string;
  region: string;
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
}): S3StoragePort {
  const client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: !!config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
  });

  return {
    createUploadUrl: async ({ key, contentType, contentLength }) => {
      const command = new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        ContentType: contentType,
        ContentLength: contentLength,
      });
      const url = await getSignedUrl(client, command, { expiresIn: 300 });
      return { url };
    },

    createDownloadUrl: async (key, options) => {
      const command = new GetObjectCommand({
        Bucket: config.bucket,
        Key: key,
        ResponseContentDisposition: options?.attachmentFilename
          ? attachmentDisposition(options.attachmentFilename)
          : undefined,
      });
      const url = await getSignedUrl(client, command, { expiresIn: 3600 });
      return { url };
    },

    headObject: async (key) => {
      try {
        const result = await client.send(
          new HeadObjectCommand({ Bucket: config.bucket, Key: key }),
        );
        return { exists: true, sizeBytes: result.ContentLength ?? null };
      } catch (err) {
        if ((err as { name?: string }).name === "NotFound") {
          return { exists: false, sizeBytes: null };
        }
        throw err;
      }
    },

    deleteObject: async (key) => {
      await client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
    },
  };
}

export function attachmentDisposition(filename: string) {
  const encoded = encodeURIComponent(filename).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `attachment; filename*=UTF-8''${encoded}`;
}
