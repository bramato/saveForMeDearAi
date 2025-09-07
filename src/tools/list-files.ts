import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { S3Manager } from '../s3/client.js';
import { ConfigManager } from '../config/manager.js';

/**
 * MCP Tool Definition: list_files
 * 
 * Provides comprehensive file listing capabilities with advanced filtering
 * and detailed metadata retrieval. This tool enables users to explore,
 * organize, and analyze their S3 storage contents efficiently.
 * 
 * Features:
 * - Hierarchical file filtering using prefixes
 * - Complete metadata retrieval (size, type, visibility, descriptions)
 * - Human-readable file size formatting
 * - Upload date tracking and organization
 * - Public/private visibility status reporting
 * - File count statistics and summary information
 */
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

/**
 * Handle list_files MCP tool requests.
 * 
 * Processes file listing requests with comprehensive metadata retrieval
 * and intelligent formatting. The function supports hierarchical filtering
 * using S3 prefixes and provides detailed file information including
 * human-readable sizes and organized metadata.
 * 
 * Query Workflow:
 * 1. Validate active S3 configuration exists
 * 2. Initialize S3Manager with resolved configuration
 * 3. Retrieve file list with optional prefix filtering
 * 4. Enhance file metadata with formatted information
 * 5. Return structured response with statistics and file details
 * 
 * @param args - Tool arguments from MCP request
 * @param args.prefix - Optional S3 prefix filter for hierarchical organization
 * @returns Structured response with file list and metadata statistics
 */
export async function handleListFiles(args: any): Promise<any> {
  const { prefix } = args;

  try {
    // Resolve active S3 configuration using hierarchical system
    const activeConfig = await ConfigManager.getActiveConfig();
    if (!activeConfig) {
      return {
        error: 'No configuration found. Please run the setup command first.',
        success: false
      };
    }

    // Initialize S3 client and retrieve file listing
    const s3Manager = new S3Manager(activeConfig.s3Config);
    const files = await s3Manager.listFiles(prefix);

    // Return comprehensive file listing with enhanced metadata
    return {
      success: true,
      files: files.map(file => ({
        filename: file.filename,
        description: file.description || 'No description',
        uploadDate: file.uploadDate,
        isPublic: file.isPublic,
        size: file.size,
        contentType: file.contentType,
        sizeFormatted: formatFileSize(file.size)  // Human-readable size format
      })),
      count: files.length,
      driveName: activeConfig.driveName,
      message: `Found ${files.length} files in ${activeConfig.driveName}`
    };
  } catch (error) {
    // Return standardized error response with detailed message
    return {
      error: `Failed to list files: ${error instanceof Error ? error.message : String(error)}`,
      success: false
    };
  }
}

/**
 * Convert file size from bytes to human-readable format.
 * 
 * Uses binary (1024-based) size units for accurate representation
 * of file sizes as they appear in most operating systems and
 * file management tools.
 * 
 * @param bytes - File size in bytes
 * @returns Formatted string with appropriate unit (e.g., "1.5 MB")
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;  // Binary unit base (not 1000)
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  // Format to 2 decimal places for readability
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}