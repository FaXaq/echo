import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { KyselyDB } from "@echo/db";
import type { AudioFile, FileType } from "../domain/index.js";

export type { AudioFile, FileType };

// --- File repo ---

export interface FileRepoPort {
  create: (input: {
    id: string;
    storageKey: string;
    filename: string;
    type: FileType;
    organizationId: string;
  }) => Promise<AudioFile>;
}

export const makeFileRepo = ({ db }: { db: KyselyDB }): FileRepoPort => ({
  create: async ({ id, storageKey, filename, type, organizationId }) => {
    const row = await db
      .insertInto("file")
      .values({ id, storageKey, filename, type, organizationId })
      .returningAll()
      .executeTakeFirstOrThrow();
    return toFile(row);
  },
});

function toFile(row: {
  id: string;
  storageKey: string;
  filename: string;
  type: string;
  organizationId: string;
  createdAt: Date;
}): AudioFile {
  return {
    id: row.id,
    storageKey: row.storageKey,
    filename: row.filename,
    type: row.type as FileType,
    organizationId: row.organizationId,
    createdAt: row.createdAt,
  };
}

// --- File storage ---

export interface FileStoragePort {
  getUploadUrl: (input: {
    key: string;
    contentType: string;
  }) => Promise<string>;
  getDownloadUrl: (input: { key: string }) => Promise<string>;
  deleteFile: (input: { key: string }) => Promise<void>;
}

export type S3Config = {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
};

export const makeFileStorageAdapter = (config: S3Config): FileStoragePort => {
  const client = new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    ...(config.endpoint
      ? { endpoint: config.endpoint, forcePathStyle: true }
      : {}),
  });

  return {
    getUploadUrl: async ({ key, contentType }) => {
      return getSignedUrl(
        client,
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          ContentType: contentType,
        }),
        { expiresIn: 300 },
      );
    },

    getDownloadUrl: async ({ key }) => {
      return getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: config.bucket, Key: key }),
        { expiresIn: 3600 },
      );
    },

    deleteFile: async ({ key }) => {
      await client.send(
        new DeleteObjectCommand({ Bucket: config.bucket, Key: key }),
      );
    },
  };
};
