import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';
import { lookup } from 'mime-types';
import { S3Config, FileMetadata } from '../config/types.js';

export class S3Manager {
  private client: S3Client;
  private bucketName: string;

  constructor(config: S3Config) {
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: config.forcePathStyle ?? true,
    });
    this.bucketName = config.bucketName;
  }

  async uploadFile(filePath: string, options: {
    key?: string;
    isPublic?: boolean;
    description?: string;
  } = {}): Promise<{ url: string; key: string }> {
    const { key = path.basename(filePath), isPublic = false, description } = options;
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const fileContent = await fs.promises.readFile(filePath);
    const contentType = lookup(filePath) || 'application/octet-stream';
    const metadata: Record<string, string> = {};
    
    if (description) {
      metadata.description = description;
    }
    metadata.uploadDate = new Date().toISOString();
    metadata.isPublic = isPublic.toString();

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: fileContent,
      ContentType: contentType,
      Metadata: metadata,
      ...(isPublic && { ACL: 'public-read' }),
    });

    await this.client.send(command);

    const url = isPublic 
      ? `${this.getPublicBaseUrl()}/${key}`
      : await this.getPresignedUrl(key);

    return { url, key };
  }

  async uploadFileContent(content: Buffer | string, options: {
    key: string;
    contentType?: string;
    isPublic?: boolean;
    description?: string;
  }): Promise<{ url: string; key: string }> {
    const { key, contentType = 'application/octet-stream', isPublic = false, description } = options;
    
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

    const url = isPublic 
      ? `${this.getPublicBaseUrl()}/${key}`
      : await this.getPresignedUrl(key);

    return { url, key };
  }

  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return await getSignedUrl(this.client, command, { expiresIn });
  }

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
            const headCommand = new HeadObjectCommand({
              Bucket: this.bucketName,
              Key: object.Key,
            });
            
            const headResponse = await this.client.send(headCommand);
            
            files.push({
              filename: object.Key,
              description: headResponse.Metadata?.description,
              uploadDate: object.LastModified || new Date(),
              isPublic: headResponse.Metadata?.isPublic === 'true',
              size: object.Size || 0,
              contentType: headResponse.ContentType || 'unknown',
            });
          } catch (error) {
            // Se non riusciamo a ottenere i metadati, aggiungiamo comunque il file con info base
            files.push({
              filename: object.Key,
              uploadDate: object.LastModified || new Date(),
              isPublic: false,
              size: object.Size || 0,
              contentType: 'unknown',
            });
          }
        }
      }
    }

    return files;
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.client.send(command);
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      
      await this.client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getFileMetadata(key: string): Promise<FileMetadata | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      
      const response = await this.client.send(command);
      
      return {
        filename: key,
        description: response.Metadata?.description,
        uploadDate: response.LastModified || new Date(),
        isPublic: response.Metadata?.isPublic === 'true',
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'unknown',
      };
    } catch (error) {
      return null;
    }
  }

  private getPublicBaseUrl(): string {
    // Rimuovi il protocollo dall'endpoint per costruire l'URL pubblico
    const endpoint = this.client.config.endpoint as any;
    const endpointUrl = typeof endpoint === 'string' ? endpoint : endpoint?.hostname || '';
    
    // Gestisci diversi provider
    if (endpointUrl.includes('amazonaws.com')) {
      // AWS S3
      return `https://${this.bucketName}.s3.amazonaws.com`;
    } else if (endpointUrl.includes('digitaloceanspaces.com')) {
      // DigitalOcean Spaces
      return `https://${this.bucketName}.${endpointUrl}`;
    } else {
      // Endpoint generico
      return `${endpointUrl}/${this.bucketName}`;
    }
  }
}