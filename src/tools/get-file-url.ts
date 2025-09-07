import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { S3Manager } from '../s3/client.js';
import { ConfigManager } from '../config/manager.js';

export const getFileUrlTool: Tool = {
  name: 'get_file_url',
  description: 'Get a temporary or permanent URL for a file. For public files, returns permanent URL. For private files, returns temporary presigned URL.',
  inputSchema: {
    type: 'object',
    properties: {
      filename: {
        type: 'string',
        description: 'Name/key of the file to get URL for'
      },
      expiresIn: {
        type: 'number',
        description: 'Expiration time for presigned URLs in seconds (default: 3600 = 1 hour, max: 604800 = 7 days)',
        minimum: 60,
        maximum: 604800
      }
    },
    required: ['filename']
  }
};

export async function handleGetFileUrl(args: any): Promise<any> {
  const { filename, expiresIn = 3600 } = args;

  try {
    const activeConfig = await ConfigManager.getActiveConfig();
    if (!activeConfig) {
      return {
        error: 'No configuration found. Please run the setup command first.',
        success: false
      };
    }

    const s3Manager = new S3Manager(activeConfig.s3Config);
    
    // Verifica che il file esista
    const fileExists = await s3Manager.fileExists(filename);
    if (!fileExists) {
      return {
        error: `File '${filename}' not found`,
        success: false
      };
    }

    // Ottieni i metadati per sapere se è pubblico o privato
    const metadata = await s3Manager.getFileMetadata(filename);
    
    if (metadata?.isPublic) {
      // File pubblico - restituisci URL permanente
      const publicUrl = s3Manager['getPublicBaseUrl']() + '/' + filename;
      return {
        success: true,
        url: publicUrl,
        urlType: 'permanent',
        isPublic: true,
        filename,
        driveName: activeConfig.driveName,
        message: 'Public file - permanent URL provided'
      };
    } else {
      // File privato - genera URL temporaneo
      const presignedUrl = await s3Manager.getPresignedUrl(filename, expiresIn);
      const expirationDate = new Date(Date.now() + expiresIn * 1000);
      
      return {
        success: true,
        url: presignedUrl,
        urlType: 'temporary',
        isPublic: false,
        filename,
        expiresIn,
        expirationDate: expirationDate.toISOString(),
        driveName: activeConfig.driveName,
        message: `Temporary URL generated, expires at ${expirationDate.toLocaleString()}`
      };
    }
  } catch (error) {
    return {
      error: `Failed to get file URL: ${error instanceof Error ? error.message : String(error)}`,
      success: false
    };
  }
}