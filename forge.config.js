const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const path = require('path');
const fs = require('fs');

module.exports = {
  packagerConfig: {
    asar: true,
    extraResource: ['./dist', '.env'],
    executableName: 'Inventory Pro',
    appCopyright: `Copyright ${new Date().getFullYear()}`,
    // Ensure all the necessary files are included
    ignore: [
      (filePath) => {
        // Always include these critical paths for the app to work
        if (
          filePath.includes('/src/database/') ||
          filePath.includes('/src/models/') ||
          filePath === '/src/index.js' ||
          filePath === '/src/preload.js' ||
          filePath.includes('/node_modules/electron-squirrel-startup/') ||
          filePath.includes('/node_modules/sqlite3/') ||
          filePath.includes('/node_modules/knex/') ||
          filePath === '/.env'
        ) {
          return false; // Don't ignore these paths
        }
        
        // Standard ignore patterns
        if (
          (filePath.startsWith('/node_modules/') && !filePath.includes('electron-squirrel-startup')) ||
          filePath.startsWith('/.git/') ||
          filePath.startsWith('/.vscode/') ||
          filePath.startsWith('/.webpack/') ||
          filePath.startsWith('/out/')
        ) {
          return true; // Ignore these paths
        }
        
        // Include everything else in src
        if (filePath.startsWith('/src/')) {
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
      platforms: ['darwin', 'win32'],
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
      // Copy database schema files to ensure they're available in the packaged app
      const srcDbDir = path.join(__dirname, 'src', 'database');
      const destDbDir = path.join(buildPath, 'src', 'database');
      
      // Ensure the destination directory exists
      if (!fs.existsSync(destDbDir)) {
        fs.mkdirSync(destDbDir, { recursive: true });
      }
      
      // Copy migration files
      const migrationsDir = path.join(srcDbDir, 'migrations');
      const destMigrationsDir = path.join(destDbDir, 'migrations');
      if (fs.existsSync(migrationsDir)) {
        if (!fs.existsSync(destMigrationsDir)) {
          fs.mkdirSync(destMigrationsDir, { recursive: true });
        }
        
        const migrationFiles = fs.readdirSync(migrationsDir);
        migrationFiles.forEach(file => {
          fs.copyFileSync(
            path.join(migrationsDir, file),
            path.join(destMigrationsDir, file)
          );
        });
      }
      
      // Copy seed files
      const seedsDir = path.join(srcDbDir, 'seeds');
      const destSeedsDir = path.join(destDbDir, 'seeds');
      if (fs.existsSync(seedsDir)) {
        if (!fs.existsSync(destSeedsDir)) {
          fs.mkdirSync(destSeedsDir, { recursive: true });
        }
        
        const seedFiles = fs.readdirSync(seedsDir);
        seedFiles.forEach(file => {
          fs.copyFileSync(
            path.join(seedsDir, file),
            path.join(destSeedsDir, file)
          );
        });
      }

      // Copy .env file
      const envSource = path.join(__dirname, '.env');
      const envDest = path.join(buildPath, '.env');
      
      if (fs.existsSync(envSource)) {
        fs.copyFileSync(envSource, envDest);
        console.log(`Copied .env file to ${envDest}`);
      } else {
        console.log('No .env file found to copy');
      }
      
      console.log('Packaging for production...');
    },
  },
};
