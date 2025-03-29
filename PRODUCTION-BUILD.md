# Production Build Guide for Inventory Pro

This document outlines the steps to build the Inventory Pro application for production distribution.

## Build Process Overview

The production build process involves the following steps:

1. Building the React application with webpack in production mode
2. Packaging the Electron application with Electron Forge
3. Creating platform-specific distributables (Windows, macOS, Linux)

## Prerequisites

Ensure you have the following installed:

- Node.js (v16 or later)
- npm (v7 or later)
- Git

## Build Commands

### 1. Production Build

To create a production-ready build of the application, run:

```bash
npm run build:prod
```

This command:
- Sets NODE_ENV to 'production'
- Bundles and minifies JavaScript with webpack
- Extracts CSS into separate files
- Optimizes assets for production

### 2. Package the Application

To package the application for your current platform:

```bash
npm run package
```

This creates a platform-specific package in the `out` directory.

### 3. Create Distributable Installers

To create distributable installers for all supported platforms:

```bash
npm run dist
```

This command:
- Runs the production build first (via predist hook)
- Creates platform-specific installers using Electron Forge makers

## Platform-Specific Builds

### Windows

The Windows build creates:
- A Squirrel-based installer (.exe)
- A portable version (.zip)

### macOS

The macOS build creates:
- A macOS application bundle (.app)
- A compressed archive (.zip)

### Linux

The Linux build creates:
- Debian package (.deb)
- RPM package (.rpm)

## Configuration

The build process is configured through:

- `webpack.config.js` - Controls the React application bundling
- `forge.config.js` - Controls the Electron packaging and distribution

## Customizing the Build

To customize the build process:

1. Modify `webpack.config.js` to change how the React application is bundled
2. Modify `forge.config.js` to change how the Electron application is packaged

## One-Step Production Build

For convenience, you can use a single command to build, package, and create installers:

```bash
npm run dist
```

This will create production-ready distributables in the `out/make` directory.

## Troubleshooting

### Common Issues

1. **Missing dependencies**: Ensure all dependencies are installed with `npm install`
2. **Icon errors**: Verify that icon files exist in the specified paths
3. **Permission issues**: Run with administrator/sudo privileges if needed

### Build Logs

Check the following logs for detailed error information:

- `out/make/logs` - Contains logs from the make process
- Console output during the build process
