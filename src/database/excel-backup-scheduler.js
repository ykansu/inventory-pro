const config = require('./config');
const excelBackup = require('./excel-backup');

// Calculate the next backup time based on frequency and time settings
function calculateNextExcelBackupTime() {
  const now = new Date();
  const backupTime = config.backup.excelBackupTime || '23:00';
  const [hours, minutes] = backupTime.split(':').map(Number);
  
  // Set the base backup time for today
  const backupDate = new Date(now);
  backupDate.setHours(hours, minutes, 0, 0);
  
  // If the time has already passed today, schedule for next occurrence
  if (backupDate <= now) {
    const frequency = config.backup.excelBackupFrequency || 'daily';
    
    if (frequency === 'daily') {
      // Next day
      backupDate.setDate(backupDate.getDate() + 1);
    } else if (frequency === 'weekly') {
      // Next week
      backupDate.setDate(backupDate.getDate() + 7);
    } else if (frequency === 'monthly') {
      // Next month
      backupDate.setMonth(backupDate.getMonth() + 1);
    }
  }
  
  return backupDate;
}

// Schedule the next automatic Excel backup
function scheduleNextExcelBackup() {
  if (!config.backup.excelBackupEnabled) {
    console.log('Automatic Excel backups are disabled');
    return;
  }
  
  const nextBackupTime = calculateNextExcelBackupTime();
  const now = new Date();
  const timeUntilBackup = nextBackupTime.getTime() - now.getTime();
  
  console.log(`Next Excel backup scheduled for: ${nextBackupTime.toLocaleString()}`);
  
  // Set timeout for next backup
  setTimeout(async () => {
    console.log('Executing scheduled Excel backup...');
    
    try {
      await excelBackup.runScheduledExcelBackup();
      console.log('Scheduled Excel backup completed successfully');
    } catch (error) {
      console.error('Scheduled Excel backup failed:', error);
    }
    
    // Schedule the next backup
    scheduleNextExcelBackup();
  }, timeUntilBackup);
}

// Start the Excel backup scheduler
function scheduleExcelBackups() {
  if (!config.backup.excelBackupEnabled) {
    console.log('Automatic Excel backups are disabled');
    return;
  }
  
  console.log('Starting Excel backup scheduler');
  scheduleNextExcelBackup();
  
  // Also check every hour in case system time or settings changed
  setInterval(() => {
    scheduleNextExcelBackup();
  }, 60 * 60 * 1000);
}

module.exports = {
  scheduleExcelBackups
}; 