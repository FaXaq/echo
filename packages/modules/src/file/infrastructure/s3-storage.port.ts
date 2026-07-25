export interface S3StoragePort {
  createUploadUrl: (input: {
    key: string;
    contentType: string;
    contentLength: number;
  }) => Promise<{ url: string }>;

  headObject: (key: string) => Promise<{ exists: boolean; sizeBytes: number | null }>;

  deleteObject: (key: string) => Promise<void>;
}
