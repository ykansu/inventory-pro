const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const path = require('path');

module.exports = {
  packagerConfig: {
    asar: true,
    extraResource: ['./dist'],
    icon: path.resolve(__dirname, 'src/assets/icon'),
    executableName: 'Inventory Pro',
    appCopyright: `Copyright ${new Date().getFullYear()}`,
    // Ensure all the necessary files are included
    ignore: [
      /^\/node_modules$/,
      /^\/src\/(?!index\.js|preload\.js)/,
      /^\/\.git/,
      /^\/\.vscode/,
      /^\/\.webpack/,
      /^\/out/,
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'InventoryPro',
        authors: 'Yasin KANSU',
        description: 'A comprehensive stock management application',
        iconUrl: path.resolve(__dirname, 'src/assets/icon.ico'),
        setupIcon: path.resolve(__dirname, 'src/assets/icon.ico'),
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
          icon: path.resolve(__dirname, 'src/assets/icon.png'),
        },
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          maintainer: 'Yasin KANSU',
          homepage: 'https://github.com/yasinkansu/inventory-pro',
          icon: path.resolve(__dirname, 'src/assets/icon.png'),
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
