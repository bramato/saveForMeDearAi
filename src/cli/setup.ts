import inquirer from 'inquirer';
import { ConfigManager } from '../config/manager.js';
import { S3Config } from '../config/types.js';
import { S3Manager } from '../s3/client.js';

export async function setupCommand(): Promise<void> {
  console.log('🚀 SaveForMeDearAI Setup');
  console.log('========================\n');

  try {
    const setupType = await inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'What would you like to set up?',
        choices: [
          { name: '🌍 Global configuration (add new drive)', value: 'global' },
          { name: '📁 Local project configuration', value: 'local' },
          { name: '📋 List existing drives', value: 'list' }
        ]
      }
    ]);

    switch (setupType.type) {
      case 'global':
        await setupGlobalConfig();
        break;
      case 'local':
        await setupLocalConfig();
        break;
      case 'list':
        await listDrives();
        break;
    }
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

async function setupGlobalConfig(): Promise<void> {
  console.log('\n🔧 Setting up global configuration...\n');

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'driveName',
      message: 'Drive name (identifier for this S3 configuration):',
      validate: (input) => input.trim().length > 0 || 'Drive name is required'
    },
    {
      type: 'list',
      name: 'provider',
      message: 'S3 Provider:',
      choices: [
        { name: 'AWS S3', value: 'aws' },
        { name: 'DigitalOcean Spaces', value: 'do' },
        { name: 'Custom S3 Compatible', value: 'custom' }
      ]
    }
  ]);

  let s3Config: S3Config;

  if (answers.provider === 'aws') {
    const awsConfig = await inquirer.prompt([
      {
        type: 'input',
        name: 'region',
        message: 'AWS Region:',
        default: 'us-east-1'
      },
      {
        type: 'input',
        name: 'accessKeyId',
        message: 'AWS Access Key ID:'
      },
      {
        type: 'password',
        name: 'secretAccessKey',
        message: 'AWS Secret Access Key:'
      },
      {
        type: 'input',
        name: 'bucketName',
        message: 'S3 Bucket Name:'
      }
    ]);

    s3Config = {
      endpoint: 'https://s3.amazonaws.com',
      region: awsConfig.region,
      accessKeyId: awsConfig.accessKeyId,
      secretAccessKey: awsConfig.secretAccessKey,
      bucketName: awsConfig.bucketName,
      forcePathStyle: false
    };
  } else if (answers.provider === 'do') {
    const doConfig = await inquirer.prompt([
      {
        type: 'input',
        name: 'region',
        message: 'DigitalOcean Region:',
        default: 'nyc3'
      },
      {
        type: 'input',
        name: 'accessKeyId',
        message: 'DigitalOcean Spaces Access Key:'
      },
      {
        type: 'password',
        name: 'secretAccessKey',
        message: 'DigitalOcean Spaces Secret Key:'
      },
      {
        type: 'input',
        name: 'spaceName',
        message: 'Space Name:'
      }
    ]);

    s3Config = {
      endpoint: `https://${doConfig.region}.digitaloceanspaces.com`,
      region: doConfig.region,
      accessKeyId: doConfig.accessKeyId,
      secretAccessKey: doConfig.secretAccessKey,
      bucketName: doConfig.spaceName,
      forcePathStyle: false
    };
  } else {
    const customConfig = await inquirer.prompt([
      {
        type: 'input',
        name: 'endpoint',
        message: 'S3 Endpoint URL:'
      },
      {
        type: 'input',
        name: 'region',
        message: 'Region:',
        default: 'us-east-1'
      },
      {
        type: 'input',
        name: 'accessKeyId',
        message: 'Access Key ID:'
      },
      {
        type: 'password',
        name: 'secretAccessKey',
        message: 'Secret Access Key:'
      },
      {
        type: 'input',
        name: 'bucketName',
        message: 'Bucket Name:'
      },
      {
        type: 'confirm',
        name: 'forcePathStyle',
        message: 'Use path-style URLs?',
        default: true
      }
    ]);

    s3Config = customConfig;
  }

  console.log('\n🔍 Testing connection...');
  try {
    const s3Manager = new S3Manager(s3Config);
    await s3Manager.listFiles();
    console.log('✅ Connection successful!');
  } catch (error) {
    console.error('❌ Connection failed:', error);
    const retry = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continue',
        message: 'Continue saving configuration anyway?',
        default: false
      }
    ]);
    
    if (!retry.continue) {
      return;
    }
  }

  const setAsDefault = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'default',
      message: 'Set this drive as default?',
      default: true
    }
  ]);

  await ConfigManager.addDriveToGlobal(answers.driveName, s3Config, setAsDefault.default);
  
  console.log(`\n✅ Global configuration saved for drive "${answers.driveName}"`);
  if (setAsDefault.default) {
    console.log(`🎯 "${answers.driveName}" set as default drive`);
  }
}

async function setupLocalConfig(): Promise<void> {
  console.log('\n📁 Setting up local project configuration...\n');

  const drives = await ConfigManager.listDrives();
  if (drives.length === 0) {
    console.log('❌ No drives configured. Please set up a global configuration first.');
    return;
  }

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'driveName',
      message: 'Select drive for this project:',
      choices: drives
    },
    {
      type: 'input',
      name: 'projectDirectory',
      message: 'Project directory name:',
      default: process.cwd().split('/').pop() || 'project'
    }
  ]);

  const driveConfig = await ConfigManager.getDriveConfig(answers.driveName);
  if (!driveConfig) {
    console.error(`❌ Drive configuration not found: ${answers.driveName}`);
    return;
  }

  const projectConfig = {
    driveName: answers.driveName,
    projectDirectory: answers.projectDirectory,
    s3Config: driveConfig
  };

  await ConfigManager.saveLocalConfig(projectConfig);
  
  console.log(`\n✅ Local configuration saved for project "${answers.projectDirectory}"`);
  console.log(`🎯 Using drive "${answers.driveName}"`);
}

async function listDrives(): Promise<void> {
  const drives = await ConfigManager.listDrives();
  const globalConfig = await ConfigManager.getGlobalConfig();
  
  if (drives.length === 0) {
    console.log('\n📭 No drives configured yet.');
    return;
  }

  console.log('\n📋 Configured drives:\n');
  for (const driveName of drives) {
    const isDefault = globalConfig?.defaultDrive === driveName;
    const config = await ConfigManager.getDriveConfig(driveName);
    
    console.log(`${isDefault ? '🎯' : '📁'} ${driveName}${isDefault ? ' (default)' : ''}`);
    if (config) {
      console.log(`   Endpoint: ${config.endpoint}`);
      console.log(`   Bucket: ${config.bucketName}`);
      console.log(`   Region: ${config.region}`);
    }
    console.log();
  }

  const localConfig = await ConfigManager.getLocalConfig();
  if (localConfig) {
    console.log(`📍 Current project uses: ${localConfig.driveName}`);
  }
}