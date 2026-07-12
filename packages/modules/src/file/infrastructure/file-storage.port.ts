export interface FileStoragePort {
  getUploadUrl: (input: { key: string; contentType: string }) => Promise<string>;
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
