import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { S3Manager } from '../s3/client.js';
import { ConfigManager } from '../config/manager.js';

export const savePrivateFileTool: Tool = {
  name: 'save_private_file',
  description: 'Save a file to S3 storage as private. Use get_file_url to get temporary access URLs.',
  inputSchema: {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: 'Path to the local file to upload'
      },
      filename: {
        type: 'string',
        description: 'Optional custom filename for the uploaded file (defaults to original filename)'
      },
      description: {
        type: 'string',
        description: 'Optional description/metadata for the file'
      }
    },
    required: ['filePath']
  }
};

export async function handleSavePrivateFile(args: any): Promise<any> {
  const { filePath, filename, description } = args;

  try {
    const activeConfig = await ConfigManager.getActiveConfig();
    if (!activeConfig) {
      return {
        error: 'No configuration found. Please run the setup command first.',
        success: false
      };
    }

    const s3Manager = new S3Manager(activeConfig.s3Config);
    
    const result = await s3Manager.uploadFile(filePath, {
      key: filename,
      isPublic: false,
      description
    });

    return {
      success: true,
      key: result.key,
      message: `File uploaded successfully as private file. Use get_file_url to get access URL.`,
      driveName: activeConfig.driveName,
      temporaryUrl: result.url // This is already a presigned URL for private files
    };
  } catch (error) {
    return {
      error: `Failed to upload file: ${error instanceof Error ? error.message : String(error)}`,
      success: false
    };
  }
}