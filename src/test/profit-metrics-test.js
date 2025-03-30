// Test script for profit metrics APIs
const { SaleService } = require('../services/DatabaseService');

async function testProfitMetrics() {
  console.log('Testing profit metrics APIs...');
  
  try {
    // Test monthly profit metrics
    console.log('\nTesting getMonthlyProfitMetrics()...');
    const monthlyMetrics = await SaleService.getMonthlyProfitMetrics();
    console.log('Monthly profit metrics:', monthlyMetrics);
    
    // Test category profits
    console.log('\nTesting getCategoryProfits()...');
    const categoryProfits = await SaleService.getCategoryProfits();
    console.log('Category profits:', categoryProfits);
    
    // Test profit value trend
    console.log('\nTesting getProfitValueTrend()...');
    const profitTrend = await SaleService.getProfitValueTrend();
    console.log('Profit trend:', profitTrend);
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Error testing profit metrics:', error);
  }
}

// Run the tests
testProfitMetrics(); 