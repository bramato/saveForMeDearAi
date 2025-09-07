# SaveForMeDearAI

A Model Context Protocol (MCP) server for managing files on S3 storage, supporting AWS S3 and DigitalOcean Spaces.

## Features

- 🚀 **Upload public and private files** with metadata
- 📋 **List files** with descriptions and information
- 🔗 **Temporary URLs** for private files
- 🌍 **Global and local configuration** for projects
- ⚡ **Multi-provider support** (AWS S3, DigitalOcean Spaces, S3-compatible)
- 🎯 **Claude Code integration** via MCP

## Installation

### Global Installation

```bash
npm install -g saveformedearai
```

### Installation from Source

```bash
git clone https://github.com/bramato/saveForMeDearAi.git
cd saveForMeDearAi
npm install
npm run build
npm install -g .
```

## Configuration

### Initial Setup

```bash
# Configure S3 drive (global)
saveformedearai setup

# Initialize local project
saveformedearai init

# List configured drives
saveformedearai setup
```

### MCP Configuration for Claude

Add to your Claude MCP configuration file:

```json
{
  "mcpServers": {
    "saveformedearai": {
      "command": "node",
      "args": ["path/to/node_modules/saveformedearai/dist/index.js"]
    }
  }
}
```

### Configuration Structure

#### Global Configuration
Saved in `~/.saveformedearai/config.json`:

```json
{
  "defaultDrive": "my-aws-drive",
  "drives": {
    "my-aws-drive": {
      "endpoint": "https://s3.amazonaws.com",
      "region": "us-east-1",
      "accessKeyId": "YOUR_ACCESS_KEY",
      "secretAccessKey": "YOUR_SECRET_KEY",
      "bucketName": "my-bucket"
    }
  }
}
```

#### Local Configuration
Saved in `.claude/saveformedearai.json`:

```json
{
  "driveName": "my-project-drive",
  "projectDirectory": "my-project",
  "s3Config": {
    "endpoint": "https://nyc3.digitaloceanspaces.com",
    "region": "nyc3",
    "accessKeyId": "YOUR_DO_KEY",
    "secretAccessKey": "YOUR_DO_SECRET",
    "bucketName": "my-space"
  }
}
```

## Available MCP Tools

### 1. `save_public_file`

Save a file as public and return the permanent URL.

```javascript
{
  "filePath": "/path/to/file.jpg",
  "filename": "optional-custom-name.jpg", // optional
  "description": "File description" // optional
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://bucket.endpoint.com/file.jpg",
  "key": "file.jpg",
  "driveName": "my-drive"
}
```

### 2. `save_private_file`

Save a file as private.

```javascript
{
  "filePath": "/path/to/private-file.pdf",
  "filename": "document.pdf",
  "description": "Private document"
}
```

**Response:**
```json
{
  "success": true,
  "key": "document.pdf",
  "temporaryUrl": "https://presigned-url...",
  "driveName": "my-drive"
}
```

### 3. `list_files`

List all files with metadata.

```javascript
{
  "prefix": "images/" // optional, filter by prefix
}
```

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "filename": "image.jpg",
      "description": "Sample photo",
      "uploadDate": "2024-01-15T10:30:00Z",
      "isPublic": true,
      "size": 1024000,
      "contentType": "image/jpeg",
      "sizeFormatted": "1.02 MB"
    }
  ],
  "count": 1,
  "driveName": "my-drive"
}
```

### 4. `get_file_url`

Get URL for a file (permanent for public, temporary for private).

```javascript
{
  "filename": "document.pdf",
  "expiresIn": 3600 // optional, seconds (max 7 days)
}
```

**Response for public file:**
```json
{
  "success": true,
  "url": "https://bucket.endpoint.com/document.pdf",
  "urlType": "permanent",
  "isPublic": true,
  "filename": "document.pdf"
}
```

**Response for private file:**
```json
{
  "success": true,
  "url": "https://presigned-url...",
  "urlType": "temporary",
  "isPublic": false,
  "expiresIn": 3600,
  "expirationDate": "2024-01-15T11:30:00Z"
}
```

## Provider Support

### AWS S3
```bash
Endpoint: https://s3.amazonaws.com
Force Path Style: false
```

### DigitalOcean Spaces
```bash
Endpoint: https://[region].digitaloceanspaces.com
Force Path Style: false
```

### S3-Compatible (Minio, etc.)
```bash
Endpoint: https://your-endpoint.com
Force Path Style: true (typically)
```

## Development

```bash
# Clone repository
git clone https://github.com/bramato/saveForMeDearAi.git
cd saveForMeDearAi

# Install dependencies
npm install

# Build
npm run build

# Development with watch
npm run dev

# Test locally
npm start
```

## Troubleshooting

### Error "No configuration found"
Run `saveformedearai setup` to configure an S3 drive.

### S3 connection error
Verify:
- Correct credentials
- Correct endpoint for provider
- Bucket exists and is accessible
- Adequate permissions (read/write for bucket)

### File not found
Use `list_files` to verify file names in the bucket.

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or pull request.