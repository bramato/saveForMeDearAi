import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { S3Manager } from '../s3/client.js';
import { ConfigManager } from '../config/manager.js';

export const savePublicFileTool: Tool = {
  name: 'save_public_file',
  description: 'Save a file to S3 storage and make it publicly accessible. Returns the public URL.',
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

export async function handleSavePublicFile(args: any): Promise<any> {
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
      isPublic: true,
      description
    });

    return {
      success: true,
      url: result.url, // URL pubblico permanente
      key: result.key,
      urlType: 'permanent',
      isPublic: true,
      message: `File uploaded successfully as public file. URL: ${result.url}`,
      driveName: activeConfig.driveName
    };
  } catch (error) {
    return {
      error: `Failed to upload file: ${error instanceof Error ? error.message : String(error)}`,
      success: false
    };
  }
}