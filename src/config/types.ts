export interface S3Config {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  forcePathStyle?: boolean;
}

export interface ProjectConfig {
  driveName: string;
  projectDirectory: string;
  s3Config: S3Config;
}

export interface GlobalConfig {
  defaultDrive: string;
  drives: Record<string, S3Config>;
}

export interface FileMetadata {
  filename: string;
  description?: string;
  uploadDate: Date;
  isPublic: boolean;
  size: number;
  contentType: string;
}