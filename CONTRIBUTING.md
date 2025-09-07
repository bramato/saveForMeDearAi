# Contributing to SaveForMeDearAI

Thank you for your interest in contributing to SaveForMeDearAI! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Style](#code-style)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Documentation](#documentation)
- [Release Process](#release-process)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and collaborative environment. Be kind, constructive, and professional in all interactions.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git
- An S3-compatible storage service account (AWS S3, DigitalOcean Spaces, etc.)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/saveForMeDearAi.git
   cd saveForMeDearAi
   ```

## Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configuration

Create a test configuration:

```bash
# Run the setup command to configure your development environment
npm run build
node dist/cli/setup.js
```

Or manually create `~/.saveformedearai/config.json`:

```json
{
  "defaultDrive": "dev-drive",
  "drives": {
    "dev-drive": {
      "endpoint": "https://s3.amazonaws.com",
      "region": "us-east-1",
      "accessKeyId": "your-dev-access-key",
      "secretAccessKey": "your-dev-secret-key",
      "bucketName": "your-dev-bucket"
    }
  }
}
```

### 3. Build and Run

```bash
# Build the project
npm run build

# Run in development mode with watch
npm run dev

# Test the MCP server
npm start
```

## Project Structure

```
src/
├── index.ts              # Main MCP server entry point
├── config/
│   ├── manager.ts        # Configuration management
│   └── types.ts          # Type definitions
├── s3/
│   └── client.ts         # S3 client wrapper
├── tools/                # MCP tool implementations
│   ├── save-public-file.ts
│   ├── save-private-file.ts
│   ├── list-files.ts
│   └── get-file-url.ts
└── cli/
    └── setup.ts          # CLI setup functionality
```

### Key Components

- **MCP Server**: Main server implementing Model Context Protocol
- **Configuration Manager**: Hierarchical config system (global/local)
- **S3 Client**: Abstraction layer for S3-compatible services
- **Tools**: Individual MCP tool implementations
- **CLI**: Command-line interface for setup and management

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b bugfix/issue-description
```

### 2. Make Changes

- Write code following the established patterns
- Add comprehensive comments for complex logic
- Update types as needed
- Test your changes thoroughly

### 3. Test Locally

```bash
# Build the project
npm run build

# Test with MCP client or Claude Code
npm start

# Run tests (if available)
npm test
```

### 4. Commit Changes

Follow the commit guidelines below and create meaningful commit messages.

## Testing

### Manual Testing

1. **MCP Server Testing**:
   ```bash
   # Start the server
   npm start
   
   # Test with MCP client or integrate with Claude Code
   ```

2. **Tool Testing**:
   - Test each MCP tool individually
   - Verify file uploads, downloads, and listing
   - Test with different S3 providers
   - Validate error handling

3. **Configuration Testing**:
   - Test global and local configuration
   - Test setup command
   - Test configuration validation

### Test Checklist

Before submitting a PR, ensure:

- [ ] All MCP tools work correctly
- [ ] Configuration management functions properly
- [ ] S3 integration works with multiple providers
- [ ] Error handling is robust
- [ ] CLI commands execute successfully
- [ ] No console errors or warnings
- [ ] TypeScript compiles without errors

## Code Style

### TypeScript Guidelines

- Use TypeScript strict mode
- Provide explicit types for all public APIs
- Use meaningful variable and function names
- Follow existing naming conventions

### Code Organization

- Keep functions focused and single-purpose
- Use descriptive comments for complex logic
- Group related functionality together
- Export types and interfaces appropriately

### Example Code Style

```typescript
/**
 * Uploads a file to S3 storage with specified visibility.
 * 
 * @param filePath - Absolute path to the local file
 * @param filename - Custom filename for the uploaded file
 * @param isPublic - Whether the file should be publicly accessible
 * @param description - Optional description for file metadata
 * @returns Upload result with URL and metadata
 */
async function uploadFile(
  filePath: string,
  filename: string,
  isPublic: boolean,
  description?: string
): Promise<UploadResult> {
  // Implementation...
}
```

## Commit Guidelines

### Commit Message Format

Use conventional commits format:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(tools): add batch file upload functionality
fix(s3): handle connection timeouts gracefully
docs(readme): update installation instructions
refactor(config): improve error handling in manager
```

## Pull Request Process

### 1. Prepare Your PR

- Ensure your branch is up to date with main
- Test all functionality thoroughly
- Update documentation as needed
- Add or update inline comments

### 2. Create Pull Request

- Use a descriptive title
- Fill out the PR template completely
- Link any related issues
- Add screenshots or examples if relevant

### 3. PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Manual testing completed
- [ ] All existing functionality works
- [ ] New functionality works as expected

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated if needed
```

## Documentation

### Inline Documentation

- Add JSDoc comments to all public functions
- Explain complex algorithms and business logic
- Document parameter types and return values
- Include usage examples for non-obvious functions

### README Updates

When adding new features:

- Update the features list
- Add configuration examples
- Document new MCP tools
- Update troubleshooting section if needed

## Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create release commit
4. Tag the release
5. Update npm package
6. Create GitHub release

## Getting Help

- **Issues**: Create a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub discussions for questions
- **Email**: Contact the maintainer for security issues

## Recognition

Contributors will be recognized in:

- GitHub contributors list
- Release notes for significant contributions
- Special mention for first-time contributors

Thank you for contributing to SaveForMeDearAI! 🚀