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
      url: result.url, // URL presigned temporaneo (1 ora di validità)
      temporaryUrl: result.url, // Mantenuto per compatibilità
      urlType: 'temporary',
      expiresIn: 3600,
      expirationDate: new Date(Date.now() + 3600 * 1000).toISOString(),
      message: `File uploaded successfully as private file. Temporary URL provided (expires in 1 hour).`,
      driveName: activeConfig.driveName
    };
  } catch (error) {
    return {
      error: `Failed to upload file: ${error instanceof Error ? error.message : String(error)}`,
      success: false
    };
  }
}