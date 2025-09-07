# Changelog

All notable changes to SaveForMeDearAI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive documentation improvements
- Enhanced inline code comments throughout the codebase
- CONTRIBUTING.md with detailed development guidelines

### Changed
- Improved code organization and documentation structure

### Deprecated
- None

### Removed
- None

### Fixed
- None

### Security
- None

## [1.2.0] - 2024-12-XX

### Added
- Enhanced file upload responses with immediate URL access
- Simplified MCP configuration with automatic server startup
- Immediate URL return in upload responses for better user experience

### Changed
- Upload responses now include URLs directly without requiring separate `get_file_url` calls
- Improved response format consistency across all tools

### Fixed
- File upload workflow now provides immediate access to uploaded file URLs

## [1.1.0] - 2024-12-XX

### Added
- Multi-provider S3 support (AWS S3, DigitalOcean Spaces)
- Hierarchical configuration system (global/local)
- CLI setup functionality with interactive prompts
- Project-specific configuration support

### Changed
- Enhanced configuration management with drive-based system
- Improved S3 client abstraction for multiple providers

### Fixed
- Configuration loading and validation improvements

## [1.0.0] - 2024-12-XX

### Added
- Initial release of SaveForMeDearAI MCP server
- Core MCP tools implementation:
  - `save_public_file`: Upload files with public access
  - `save_private_file`: Upload files with private access
  - `list_files`: List stored files with metadata
  - `get_file_url`: Get permanent or temporary URLs for files
- S3 client wrapper with presigned URL support
- Configuration management system
- TypeScript implementation with full type safety
- CLI interface for setup and management

### Security
- Secure handling of S3 credentials
- Private file access through presigned URLs
- Configurable URL expiration times

---

## Release Notes Template

Use this template for future releases:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features and capabilities

### Changed
- Changes to existing functionality

### Deprecated
- Features that will be removed in future versions

### Removed
- Features that have been removed

### Fixed
- Bug fixes and corrections

### Security
- Security improvements and fixes
```

## Release Process

1. **Update Version**: Increment version in `package.json`
2. **Update Changelog**: Add new section with changes
3. **Commit Changes**: Create release commit
4. **Create Tag**: `git tag -a v1.2.0 -m "Release v1.2.0"`
5. **Push Changes**: `git push origin main --tags`
6. **GitHub Release**: Create release on GitHub
7. **NPM Publish**: `npm publish`

## Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR.MINOR.PATCH** (e.g., 1.2.3)
- **MAJOR**: Breaking changes that require user action
- **MINOR**: New features that are backward compatible
- **PATCH**: Bug fixes that are backward compatible

### Examples

- `1.0.0 → 1.0.1`: Bug fix (patch)
- `1.0.1 → 1.1.0`: New feature (minor)
- `1.1.0 → 2.0.0`: Breaking change (major)

## Categories

### Added
- New features
- New tools or capabilities
- New configuration options
- New documentation

### Changed
- Changes to existing features
- Performance improvements
- Refactoring that affects user experience
- Updated dependencies

### Deprecated
- Features marked for removal
- Old configuration formats
- Legacy APIs

### Removed
- Removed features
- Removed configuration options
- Removed deprecated functionality

### Fixed
- Bug fixes
- Error handling improvements
- Security vulnerabilities
- Performance issues

### Security
- Security-related improvements
- Vulnerability fixes
- Authentication enhancements
- Privacy improvements