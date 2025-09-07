import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { GlobalConfig, ProjectConfig, S3Config } from './types.js';

export class ConfigManager {
  private static readonly GLOBAL_CONFIG_DIR = path.join(os.homedir(), '.saveformedearai');
  private static readonly GLOBAL_CONFIG_FILE = path.join(ConfigManager.GLOBAL_CONFIG_DIR, 'config.json');
  private static readonly LOCAL_CONFIG_DIR = '.claude';
  private static readonly LOCAL_CONFIG_FILE = path.join(ConfigManager.LOCAL_CONFIG_DIR, 'saveformedearai.json');

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

  static async saveGlobalConfig(config: GlobalConfig): Promise<void> {
    try {
      if (!fs.existsSync(ConfigManager.GLOBAL_CONFIG_DIR)) {
        await fs.promises.mkdir(ConfigManager.GLOBAL_CONFIG_DIR, { recursive: true });
      }
      await fs.promises.writeFile(ConfigManager.GLOBAL_CONFIG_FILE, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('Error saving global config:', error);
      throw error;
    }
  }

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

  static async saveLocalConfig(config: ProjectConfig): Promise<void> {
    try {
      if (!fs.existsSync(ConfigManager.LOCAL_CONFIG_DIR)) {
        await fs.promises.mkdir(ConfigManager.LOCAL_CONFIG_DIR, { recursive: true });
      }
      await fs.promises.writeFile(ConfigManager.LOCAL_CONFIG_FILE, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('Error saving local config:', error);
      throw error;
    }
  }

  static async getActiveConfig(): Promise<{ s3Config: S3Config; driveName: string } | null> {
    // Prima controlla la configurazione locale
    const localConfig = await ConfigManager.getLocalConfig();
    if (localConfig) {
      return {
        s3Config: localConfig.s3Config,
        driveName: localConfig.driveName
      };
    }

    // Se non c'è configurazione locale, usa quella globale
    const globalConfig = await ConfigManager.getGlobalConfig();
    if (globalConfig && globalConfig.defaultDrive && globalConfig.drives[globalConfig.defaultDrive]) {
      return {
        s3Config: globalConfig.drives[globalConfig.defaultDrive],
        driveName: globalConfig.defaultDrive
      };
    }

    return null;
  }

  static async addDriveToGlobal(driveName: string, s3Config: S3Config, setAsDefault: boolean = false): Promise<void> {
    const globalConfig = await ConfigManager.getGlobalConfig() || { defaultDrive: '', drives: {} };
    
    globalConfig.drives[driveName] = s3Config;
    
    if (setAsDefault || !globalConfig.defaultDrive) {
      globalConfig.defaultDrive = driveName;
    }

    await ConfigManager.saveGlobalConfig(globalConfig);
  }

  static async listDrives(): Promise<string[]> {
    const globalConfig = await ConfigManager.getGlobalConfig();
    return globalConfig ? Object.keys(globalConfig.drives) : [];
  }

  static async getDriveConfig(driveName: string): Promise<S3Config | null> {
    const globalConfig = await ConfigManager.getGlobalConfig();
    return globalConfig?.drives[driveName] || null;
  }
}