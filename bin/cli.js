#!/usr/bin/env node

const { Command } = require('commander');
const { setupCommand } = require('../dist/cli/setup.js');
const path = require('path');

const program = new Command();

program
  .name('saveformedearai')
  .description('CLI tool for SaveForMeDearAI - S3 file management MCP server')
  .version('1.0.0');

// Default action: start MCP server
program
  .action(async () => {
    // If no command is provided, start the MCP server
    require('../dist/index.js');
  });

program
  .command('setup')
  .description('Set up global or local configuration')
  .action(setupCommand);

program
  .command('init')
  .description('Initialize local project configuration')
  .action(async () => {
    console.log('🚀 Initializing SaveForMeDearAI in this directory...\n');
    
    // Create .claude directory if it doesn't exist
    const fs = require('fs');
    
    const claudeDir = '.claude';
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true });
      console.log('✅ Created .claude directory');
    }
    
    console.log('📝 Run "saveformedearai setup" to configure your S3 settings');
    console.log('📖 Add this to your Claude MCP settings:');
    console.log('\n```json');
    console.log('{');
    console.log('  "mcpServers": {');
    console.log('    "saveformedearai": {');
    console.log('      "command": "saveformedearai"');
    console.log('    }');
    console.log('  }');
    console.log('}');
    console.log('```\n');
    console.log('🎯 Ready to use SaveForMeDearAI MCP server!');
  });

program.parse();