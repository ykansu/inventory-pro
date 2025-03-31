/**
 * CLI for running the stress test data generator
 */
const { generateStressTestData } = require('./stress-test-generator');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║                INVENTORY PRO STRESS TEST                   ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('\n⚠️  WARNING: This will delete all existing data in the database');
console.log('and replace it with stress test data (1 year of history).\n');

rl.question('Are you sure you want to continue? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    console.log('\n🚀 Starting stress test data generation...');
    
    // Show a loading spinner
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;
    
    const spinner = setInterval(() => {
      process.stdout.write(`\r${frames[i = ++i % frames.length]} Generating data... This may take several minutes.`);
    }, 80);
    
    // Run the generator
    generateStressTestData()
      .then(result => {
        clearInterval(spinner);
        if (result.success) {
          process.stdout.write('\r✅ Stress test data generation completed successfully.     \n');
          console.log('\n📊 Statistics:');
          console.log('- Categories: ~20');
          console.log('- Suppliers: ~15');
          console.log('- Products: ~200');
          console.log('- Sales: ~15,000 (across 1 year)');
          console.log('- Stock Adjustments: ~5,000');
          console.log('\n🔍 You can now open the app and test with this data.');
        } else {
          process.stdout.write('\r❌ Stress test data generation failed.                    \n');
          console.error('Error:', result.error);
        }
      })
      .catch(err => {
        clearInterval(spinner);
        process.stdout.write('\r❌ Unhandled error during stress test data generation.      \n');
        console.error('Error:', err);
      })
      .finally(() => {
        rl.close();
      });
  } else {
    console.log('\n❌ Operation cancelled.');
    rl.close();
  }
}); 