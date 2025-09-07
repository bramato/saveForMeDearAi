import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { S3Manager } from '../s3/client.js';
import { ConfigManager } from '../config/manager.js';

export const listFilesTool: Tool = {
  name: 'list_files',
  description: 'List all files stored in the S3 bucket with their metadata including descriptions.',
  inputSchema: {
    type: 'object',
    properties: {
      prefix: {
        type: 'string',
        description: 'Optional prefix to filter files (e.g., "images/" to list only files in images folder)'
      }
    }
  }
};

export async function handleListFiles(args: any): Promise<any> {
  const { prefix } = args;

  try {
    const activeConfig = await ConfigManager.getActiveConfig();
    if (!activeConfig) {
      return {
        error: 'No configuration found. Please run the setup command first.',
        success: false
      };
    }

    const s3Manager = new S3Manager(activeConfig.s3Config);
    const files = await s3Manager.listFiles(prefix);

    return {
      success: true,
      files: files.map(file => ({
        filename: file.filename,
        description: file.description || 'No description',
        uploadDate: file.uploadDate,
        isPublic: file.isPublic,
        size: file.size,
        contentType: file.contentType,
        sizeFormatted: formatFileSize(file.size)
      })),
      count: files.length,
      driveName: activeConfig.driveName,
      message: `Found ${files.length} files in ${activeConfig.driveName}`
    };
  } catch (error) {
    return {
      error: `Failed to list files: ${error instanceof Error ? error.message : String(error)}`,
      success: false
    };
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}