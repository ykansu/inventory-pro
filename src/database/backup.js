const fs = require('fs');
const path = require('path');
const config = require('./config');

// Format date for backup filename
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}_${hours}${minutes}${seconds}`;
}

// Create a backup of the database
async function createBackup(customPath = null) {
  try {
    // Ensure backup directory exists
    const backupDir = customPath || config.backup.path;
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const sourceFile = config.dbPath;
    const timestamp = formatDate(new Date());
    const backupFile = path.join(backupDir, `backup_${timestamp}.db`);
    
    // Copy the database file
    fs.copyFileSync(sourceFile, backupFile);
    
    // Clean up old backups if we exceed the maximum
    cleanupOldBackups();
    
    console.log(`Backup created successfully: ${backupFile}`);
    return backupFile;
  } catch (error) {
    console.error('Backup creation failed:', error);
    throw error;
  }
}

// Clean up old backups to maintain the maximum number
function cleanupOldBackups() {
  try {
    const backupDir = config.backup.path;
    const maxBackups = config.backup.maxBackups;
    
    // Get all backup files
    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('backup_') && file.endsWith('.db'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        time: fs.statSync(path.join(backupDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); // Sort by time, newest first
    
    // Remove excess backups
    if (files.length > maxBackups) {
      const filesToRemove = files.slice(maxBackups);
      filesToRemove.forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`Removed old backup: ${file.name}`);
      });
    }
  } catch (error) {
    console.error('Error cleaning up old backups:', error);
  }
}

// Restore from a backup file
async function restoreFromBackup(backupFile) {
  try {
    // Create a backup of the current database before restoring
    await createBackup(path.join(config.backup.path, 'pre_restore'));
    
    // Copy the backup file to the database location
    fs.copyFileSync(backupFile, config.dbPath);
    
    console.log(`Database restored successfully from: ${backupFile}`);
    return true;
  } catch (error) {
    console.error('Database restore failed:', error);
    throw error;
  }
}

// Schedule automatic backups
function scheduleBackups() {
  if (!config.backup.enabled) return;
  
  // Parse backup time
  const [hours, minutes] = config.backup.time.split(':').map(Number);
  
  // Calculate when to run the next backup
  const now = new Date();
  const backupTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
    0
  );
  
  // If the backup time has already passed today, schedule for tomorrow
  if (now > backupTime) {
    backupTime.setDate(backupTime.getDate() + 1);
  }
  
  // Calculate delay until next backup
  const delay = backupTime.getTime() - now.getTime();
  
  // Schedule the backup
  setTimeout(() => {
    createBackup()
      .then(() => {
        // Schedule the next backup
        scheduleBackups();
      })
      .catch(error => {
        console.error('Scheduled backup failed:', error);
        // Try again in an hour
        setTimeout(scheduleBackups, 60 * 60 * 1000);
      });
  }, delay);
  
  console.log(`Next automatic backup scheduled for: ${backupTime.toLocaleString()}`);
}

module.exports = {
  createBackup,
  restoreFromBackup,
  scheduleBackups,
};