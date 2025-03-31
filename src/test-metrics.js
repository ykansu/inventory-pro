// Test script for monthly profit metrics
const { Sale } = require('./models');

async function testMetrics() {
  try {
    console.log('Testing getMonthlyProfitMetrics...');
    const metrics = await Sale.getMonthlyProfitMetrics();
    console.log('Monthly profit metrics:', metrics);
  } catch (err) {
    console.error('Error:', err);
  }
}

testMetrics().then(() => {
  console.log('Test complete');
  process.exit(0);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
}); 