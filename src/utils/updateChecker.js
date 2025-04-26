const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const config = require('../database/config');

/**
 * Checks if updates are available in the git repository
 * @returns {Promise<{hasUpdates: boolean, error: string|null}>} Result of the update check
 */
async function checkForUpdates() {
  // Default return structure
  const result = {
    hasUpdates: false,
    error: null
  };

  // Check if update checking is enabled
  if (!config.updates.checkOnStartup) {
    return result;
  }

  const repoPath = config.updates.repoPath;

  // Check if repo directory exists
  if (!fs.existsSync(repoPath)) {
    result.error = `Repository directory not found: ${repoPath}`;
    return result;
  }

  try {
    // First, fetch the latest changes from remote
    await new Promise((resolve, reject) => {
      exec('git fetch', { cwd: repoPath }, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    // Then check if we're behind the remote
    const output = await new Promise((resolve, reject) => {
      exec('git status -uno', { cwd: repoPath }, (error, stdout) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });

    // Check if the branch is behind
    if (output.includes('Your branch is behind') || 
        output.includes('pull')) {
      result.hasUpdates = true;
    }

    return result;
  } catch (error) {
    // Fail silently - just log and return no updates
    console.error('Error checking for updates:', error);
    result.error = error.message;
    return result;
  }
}

module.exports = { checkForUpdates }; 