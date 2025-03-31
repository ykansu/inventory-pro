const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const path = require('path');
const fs = require('fs');

module.exports = {
  packagerConfig: {
    asar: true,
    extraResource: ['./dist'],
    executableName: 'Inventory Pro',
    appCopyright: `Copyright ${new Date().getFullYear()}`,
    // Ensure all the necessary files are included
    ignore: [
      // Don't ignore database directory and keep specific module files
      (file) => {
        // Always include these specific modules/paths
        if (
          file.includes('src/database') ||
          file.includes('src/models') ||
          file === 'src/index.js' ||
          file === 'src/preload.js'
        ) {
          return false; // Don't ignore these files
        }
        
        // Standard ignore patterns
        if (/^\/node_modules/.test(file) && !file.includes('electron-squirrel-startup')) {
          return true; // Ignore node_modules except electron-squirrel-startup
        }
        
        if (/^\/\.git/.test(file) || 
            /^\/\.vscode/.test(file) || 
            /^\/\.webpack/.test(file) || 
            /^\/out/.test(file)) {
          return true; // Ignore these directories
        }
        
        // Don't ignore anything else in src
        if (file.startsWith('/src/')) {
          return false;
        }
        
        return false; // When in doubt, include the file
      }
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'InventoryPro',
        authors: 'Yasin KANSU',
        description: 'A comprehensive stock management application',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          maintainer: 'Yasin KANSU',
          homepage: 'https://github.com/yasinkansu/inventory-pro',
        },
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          maintainer: 'Yasin KANSU',
          homepage: 'https://github.com/yasinkansu/inventory-pro',
        },
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  hooks: {
    // This hook runs before packaging
    packageAfterCopy: async (config, buildPath, electronVersion, platform, arch) => {
      // You can perform additional tasks here if needed
      console.log('Packaging for production...');
    },
  },
};
