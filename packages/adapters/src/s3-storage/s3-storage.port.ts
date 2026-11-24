export interface S3StoragePort {
  createUploadUrl: (input: {
    key: string;
    contentType: string;
    contentLength: number;
  }) => Promise<{ url: string }>;

  createMultipartUpload: (input: {
    key: string;
    contentType: string;
    partSizes: number[];
  }) => Promise<{ uploadId: string; partUrls: string[] }>;

  completeMultipartUpload: (input: {
    key: string;
    uploadId: string;
    parts: { partNumber: number; etag: string }[];
  }) => Promise<void>;

  createDownloadUrl: (
    key: string,
    options?: { attachmentFilename?: string },
  ) => Promise<{ url: string }>;

  headObject: (key: string) => Promise<{ exists: boolean; sizeBytes: number | null }>;

  deleteObject: (key: string) => Promise<void>;
}
