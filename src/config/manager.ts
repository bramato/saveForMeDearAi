import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { GlobalConfig, ProjectConfig, S3Config } from './types.js';

/**
 * ConfigManager - Hierarchical Configuration System
 * 
 * Manages a two-tier configuration system for SaveForMeDearAI:
 * 1. Global Configuration: User-wide settings stored in home directory
 * 2. Local Configuration: Project-specific overrides stored in project's .claude directory
 * 
 * Configuration Resolution Priority:
 * - Local project config takes precedence over global config
 * - Global config serves as fallback when local config is unavailable
 * - Supports multiple S3 "drives" (named configurations) for different projects/providers
 * 
 * Features:
 * - Automatic directory creation for config files
 * - JSON-based configuration with type safety
 * - Drive-based organization for multiple S3 providers
 * - Graceful error handling with fallback mechanisms
 */
export class ConfigManager {
  // Global configuration paths - stored in user's home directory
  private static readonly GLOBAL_CONFIG_DIR = path.join(os.homedir(), '.saveformedearai');
  private static readonly GLOBAL_CONFIG_FILE = path.join(ConfigManager.GLOBAL_CONFIG_DIR, 'config.json');
  
  // Local configuration paths - stored in project's .claude directory
  private static readonly LOCAL_CONFIG_DIR = '.claude';
  private static readonly LOCAL_CONFIG_FILE = path.join(ConfigManager.LOCAL_CONFIG_DIR, 'saveformedearai.json');

  /**
   * Load global configuration from user's home directory.
   * 
   * The global config contains multiple S3 "drives" (named configurations)
   * and a default drive setting. This allows users to manage multiple
   * S3 providers or accounts from a single configuration file.
   * 
   * @returns Global configuration object or null if not found/invalid
   */
  static async getGlobalConfig(): Promise<GlobalConfig | null> {
    try {
      if (fs.existsSync(ConfigManager.GLOBAL_CONFIG_FILE)) {
        const data = await fs.promises.readFile(ConfigManager.GLOBAL_CONFIG_FILE, 'utf8');
        return JSON.parse(data) as GlobalConfig;
      }
    } catch (error) {
      console.error('Error reading global config:', error);
    }
    return null;
  }

  /**
   * Save global configuration to user's home directory.
   * 
   * Automatically creates the configuration directory if it doesn't exist.
   * Writes the configuration as formatted JSON for readability.
   * 
   * @param config - Global configuration object to save
   * @throws Error if unable to create directory or write file
   */
  static async saveGlobalConfig(config: GlobalConfig): Promise<void> {
    try {
      // Ensure the global config directory exists
      if (!fs.existsSync(ConfigManager.GLOBAL_CONFIG_DIR)) {
        await fs.promises.mkdir(ConfigManager.GLOBAL_CONFIG_DIR, { recursive: true });
      }
      
      // Write formatted JSON for better readability and version control
      await fs.promises.writeFile(ConfigManager.GLOBAL_CONFIG_FILE, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('Error saving global config:', error);
      throw error;
    }
  }

  /**
   * Load project-specific configuration from .claude directory.
   * 
   * Local configuration takes precedence over global configuration
   * and is typically used for project-specific S3 settings or
   * to override the default drive for a particular project.
   * 
   * @returns Project configuration object or null if not found/invalid
   */
  static async getLocalConfig(): Promise<ProjectConfig | null> {
    try {
      if (fs.existsSync(ConfigManager.LOCAL_CONFIG_FILE)) {
        const data = await fs.promises.readFile(ConfigManager.LOCAL_CONFIG_FILE, 'utf8');
        return JSON.parse(data) as ProjectConfig;
      }
    } catch (error) {
      console.error('Error reading local config:', error);
    }
    return null;
  }

  /**
   * Save project-specific configuration to .claude directory.
   * 
   * Creates the .claude directory if it doesn't exist. This directory
   * is commonly used by Claude Code for project-specific settings.
   * 
   * @param config - Project configuration object to save
   * @throws Error if unable to create directory or write file
   */
  static async saveLocalConfig(config: ProjectConfig): Promise<void> {
    try {
      // Ensure the .claude directory exists for project-specific configs
      if (!fs.existsSync(ConfigManager.LOCAL_CONFIG_DIR)) {
        await fs.promises.mkdir(ConfigManager.LOCAL_CONFIG_DIR, { recursive: true });
      }
      
      // Write formatted JSON for better version control integration
      await fs.promises.writeFile(ConfigManager.LOCAL_CONFIG_FILE, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('Error saving local config:', error);
      throw error;
    }
  }

  /**
   * Get the active S3 configuration using hierarchical resolution.
   * 
   * Configuration Resolution Order:
   * 1. Local project config (if present) - highest priority
   * 2. Global default drive (if configured) - fallback
   * 3. null (if no configuration found) - requires setup
   * 
   * This method implements the core configuration logic that determines
   * which S3 settings to use for file operations.
   * 
   * @returns Active S3 configuration with drive name or null if unconfigured
   */
  static async getActiveConfig(): Promise<{ s3Config: S3Config; driveName: string } | null> {
    // First priority: Check for project-specific local configuration
    const localConfig = await ConfigManager.getLocalConfig();
    if (localConfig) {
      return {
        s3Config: localConfig.s3Config,
        driveName: localConfig.driveName
      };
    }

    // Fallback: Use global default drive configuration
    const globalConfig = await ConfigManager.getGlobalConfig();
    if (globalConfig && globalConfig.defaultDrive && globalConfig.drives[globalConfig.defaultDrive]) {
      return {
        s3Config: globalConfig.drives[globalConfig.defaultDrive],
        driveName: globalConfig.defaultDrive
      };
    }

    // No configuration found - user needs to run setup
    return null;
  }

  /**
   * Add a new S3 drive configuration to global settings.
   * 
   * Creates a named S3 configuration that can be referenced by name.
   * Supports multiple S3 providers and accounts within a single global config.
   * 
   * @param driveName - Unique identifier for this S3 configuration
   * @param s3Config - S3 connection and authentication details
   * @param setAsDefault - Whether to make this the default drive (optional)
   */
  static async addDriveToGlobal(driveName: string, s3Config: S3Config, setAsDefault: boolean = false): Promise<void> {
    // Load existing global config or create new one
    const globalConfig = await ConfigManager.getGlobalConfig() || { defaultDrive: '', drives: {} };
    
    // Add the new drive configuration
    globalConfig.drives[driveName] = s3Config;
    
    // Set as default if requested or if no default exists
    if (setAsDefault || !globalConfig.defaultDrive) {
      globalConfig.defaultDrive = driveName;
    }

    // Persist the updated configuration
    await ConfigManager.saveGlobalConfig(globalConfig);
  }

  /**
   * List all available S3 drive configurations.
   * 
   * Returns the names of all configured S3 drives from the global
   * configuration. Useful for CLI interfaces and configuration validation.
   * 
   * @returns Array of drive names or empty array if no global config exists
   */
  static async listDrives(): Promise<string[]> {
    const globalConfig = await ConfigManager.getGlobalConfig();
    return globalConfig ? Object.keys(globalConfig.drives) : [];
  }

  /**
   * Retrieve a specific S3 drive configuration by name.
   * 
   * Allows access to individual drive configurations from the global
   * settings. Used for configuration validation and drive switching.
   * 
   * @param driveName - Name of the drive configuration to retrieve
   * @returns S3 configuration object or null if drive doesn't exist
   */
  static async getDriveConfig(driveName: string): Promise<S3Config | null> {
    const globalConfig = await ConfigManager.getGlobalConfig();
    return globalConfig?.drives[driveName] || null;
  }
}