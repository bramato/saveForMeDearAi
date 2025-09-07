import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';
import { lookup } from 'mime-types';
import { S3Config, FileMetadata } from '../config/types.js';

/**
 * S3Manager - Universal S3-Compatible Storage Client
 * 
 * A comprehensive S3 client wrapper that provides a unified interface for
 * interacting with multiple S3-compatible storage providers including:
 * - AWS S3 (native)
 * - DigitalOcean Spaces
 * - MinIO and other S3-compatible services
 * 
 * Key Features:
 * - Automatic content-type detection using MIME types
 * - Public and private file upload capabilities
 * - Metadata attachment for file descriptions and tracking
 * - Presigned URL generation for secure temporary access
 * - Multi-provider URL construction with intelligent endpoint detection
 * - Comprehensive file listing with metadata retrieval
 * - Error handling with graceful degradation
 * 
 * The client automatically handles provider-specific configurations such as
 * path-style access for MinIO and endpoint-based URL construction for
 * different cloud providers.
 */
export class S3Manager {
  private client: S3Client;
  private bucketName: string;

  /**
   * Initialize S3Manager with provider-specific configuration.
   * 
   * Configures the AWS SDK S3 client with the provided settings,
   * including endpoint, credentials, and path style preferences.
   * 
   * @param config - S3 configuration object containing connection details
   */
  constructor(config: S3Config) {
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      // forcePathStyle is typically needed for non-AWS providers like MinIO
      forcePathStyle: config.forcePathStyle ?? true,
    });
    this.bucketName = config.bucketName;
  }

  /**
   * Upload a file from the local filesystem to S3 storage.
   * 
   * Handles file reading, content-type detection, metadata attachment,
   * and URL generation. Supports both public and private uploads with
   * automatic ACL configuration.
   * 
   * @param filePath - Absolute path to the local file to upload
   * @param options - Upload configuration options
   * @param options.key - Custom S3 key (defaults to filename)
   * @param options.isPublic - Whether to make file publicly accessible
   * @param options.description - Optional file description for metadata
   * @returns Object containing the access URL and S3 key
   * @throws Error if file doesn't exist or upload fails
   */
  async uploadFile(filePath: string, options: {
    key?: string;
    isPublic?: boolean;
    description?: string;
  } = {}): Promise<{ url: string; key: string }> {
    const { key = path.basename(filePath), isPublic = false, description } = options;
    
    // Validate file existence before attempting upload
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Read file content and detect MIME type
    const fileContent = await fs.promises.readFile(filePath);
    const contentType = lookup(filePath) || 'application/octet-stream';
    
    // Build metadata for tracking and organization
    const metadata: Record<string, string> = {};
    if (description) {
      metadata.description = description;
    }
    metadata.uploadDate = new Date().toISOString();
    metadata.isPublic = isPublic.toString();

    // Configure S3 upload command with appropriate permissions
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: fileContent,
      ContentType: contentType,
      Metadata: metadata,
      // Set public-read ACL for public files
      ...(isPublic && { ACL: 'public-read' }),
    });

    await this.client.send(command);

    // Generate appropriate URL based on visibility
    const url = isPublic 
      ? `${this.getPublicBaseUrl()}/${key}`  // Direct public URL
      : await this.getPresignedUrl(key);      // Temporary signed URL

    return { url, key };
  }

  /**
   * Upload content directly from memory to S3 storage.
   * 
   * Useful for uploading dynamically generated content, processed data,
   * or content from APIs without saving to disk first. Supports both
   * Buffer and string content with configurable content type.
   * 
   * @param content - The content to upload (Buffer or string)
   * @param options - Upload configuration options
   * @param options.key - S3 key for the uploaded content (required)
   * @param options.contentType - MIME type of the content
   * @param options.isPublic - Whether to make content publicly accessible
   * @param options.description - Optional description for metadata
   * @returns Object containing the access URL and S3 key
   */
  async uploadFileContent(content: Buffer | string, options: {
    key: string;
    contentType?: string;
    isPublic?: boolean;
    description?: string;
  }): Promise<{ url: string; key: string }> {
    const { key, contentType = 'application/octet-stream', isPublic = false, description } = options;
    
    // Build comprehensive metadata for content tracking
    const metadata: Record<string, string> = {};
    if (description) {
      metadata.description = description;
    }
    metadata.uploadDate = new Date().toISOString();
    metadata.isPublic = isPublic.toString();

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: content,
      ContentType: contentType,
      Metadata: metadata,
      ...(isPublic && { ACL: 'public-read' }),
    });

    await this.client.send(command);

    // Return appropriate URL based on visibility settings
    const url = isPublic 
      ? `${this.getPublicBaseUrl()}/${key}`
      : await this.getPresignedUrl(key);

    return { url, key };
  }

  /**
   * Generate a presigned URL for secure temporary access to private files.
   * 
   * Creates time-limited URLs that allow access to private S3 objects without
   * exposing credentials. Useful for sharing private files securely or
   * providing temporary download links.
   * 
   * @param key - S3 key of the file to access
   * @param expiresIn - URL expiration time in seconds (default: 1 hour)
   * @returns Presigned URL string valid for the specified duration
   */
  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return await getSignedUrl(this.client, command, { expiresIn });
  }

  /**
   * List files in the S3 bucket with comprehensive metadata.
   * 
   * Retrieves a list of all files in the bucket, optionally filtered by prefix.
   * For each file, attempts to fetch detailed metadata including description,
   * visibility status, and content type. Gracefully handles metadata retrieval
   * failures by providing basic file information.
   * 
   * @param prefix - Optional prefix to filter files (e.g., "images/")
   * @returns Array of file metadata objects
   */
  async listFiles(prefix?: string): Promise<FileMetadata[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: prefix,
    });

    const response = await this.client.send(command);
    const files: FileMetadata[] = [];

    if (response.Contents) {
      for (const object of response.Contents) {
        if (object.Key) {
          try {
            // Fetch detailed metadata for each file
            const headCommand = new HeadObjectCommand({
              Bucket: this.bucketName,
              Key: object.Key,
            });
            
            const headResponse = await this.client.send(headCommand);
            
            // Build complete file metadata from S3 response
            files.push({
              filename: object.Key,
              description: headResponse.Metadata?.description,
              uploadDate: object.LastModified || new Date(),
              isPublic: headResponse.Metadata?.isPublic === 'true',
              size: object.Size || 0,
              contentType: headResponse.ContentType || 'unknown',
            });
          } catch (error) {
            // Graceful fallback: if metadata retrieval fails, include basic info
            files.push({
              filename: object.Key,
              uploadDate: object.LastModified || new Date(),
              isPublic: false, // Conservative default for unknown files
              size: object.Size || 0,
              contentType: 'unknown',
            });
          }
        }
      }
    }

    return files;
  }

  /**
   * Delete a file from S3 storage.
   * 
   * Permanently removes the specified file from the S3 bucket.
   * Note: This operation is irreversible.
   * 
   * @param key - S3 key of the file to delete
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.client.send(command);
  }

  /**
   * Check if a file exists in S3 storage.
   * 
   * Uses a HEAD request to efficiently check file existence without
   * downloading content. Returns false for any access errors.
   * 
   * @param key - S3 key of the file to check
   * @returns true if file exists and is accessible, false otherwise
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      
      await this.client.send(command);
      return true;
    } catch (error) {
      // Any error (not found, access denied, etc.) means file is not accessible
      return false;
    }
  }

  /**
   * Retrieve detailed metadata for a specific file.
   * 
   * Fetches comprehensive file information including size, content type,
   * upload date, visibility status, and custom description metadata.
   * 
   * @param key - S3 key of the file to inspect
   * @returns File metadata object or null if file doesn't exist/isn't accessible
   */
  async getFileMetadata(key: string): Promise<FileMetadata | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      
      const response = await this.client.send(command);
      
      // Build comprehensive metadata object from S3 response
      return {
        filename: key,
        description: response.Metadata?.description,
        uploadDate: response.LastModified || new Date(),
        isPublic: response.Metadata?.isPublic === 'true',
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'unknown',
      };
    } catch (error) {
      // Return null for any access errors (file not found, permissions, etc.)
      return null;
    }
  }

  /**
   * Construct public access URLs for different S3 providers.
   * 
   * Intelligently builds the correct public URL format based on the
   * S3 provider being used. Each provider has specific URL patterns:
   * - AWS S3: Uses subdomain format (bucket.s3.amazonaws.com)
   * - DigitalOcean Spaces: Uses subdomain with regional endpoint
   * - Generic S3: Uses path-style format (endpoint/bucket)
   * 
   * @returns Base URL for public file access
   */
  private getPublicBaseUrl(): string {
    // Extract endpoint configuration for URL construction
    const endpoint = this.client.config.endpoint as any;
    const endpointUrl = typeof endpoint === 'string' ? endpoint : endpoint?.hostname || '';
    
    // Provider-specific URL formatting
    if (endpointUrl.includes('amazonaws.com')) {
      // AWS S3 standard format: bucket.s3.amazonaws.com
      return `https://${this.bucketName}.s3.amazonaws.com`;
    } else if (endpointUrl.includes('digitaloceanspaces.com')) {
      // DigitalOcean Spaces format: bucket.region.digitaloceanspaces.com
      return `https://${this.bucketName}.${endpointUrl}`;
    } else {
      // Generic S3-compatible services: endpoint/bucket (path-style)
      return `${endpointUrl}/${this.bucketName}`;
    }
  }
}