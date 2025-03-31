/**
 * Performance Test Suite for Inventory Pro
 * 
 * This script runs various performance tests on the database and models
 * to verify the application's performance with large amounts of data.
 */

const { Product, Sale, Category, Supplier } = require('../models');
const dbConnection = require('../database/connection');

// Helper for measuring execution time
const measurePerformance = async (name, fn) => {
  console.time(name);
  try {
    const result = await fn();
    console.timeEnd(name);
    return result;
  } catch (error) {
    console.timeEnd(name);
    console.error(`Error in "${name}":`, error);
    throw error;
  }
};

// Performance test suite
const runPerformanceTests = async () => {
  const db = await dbConnection.getConnection();
  const productModel = new Product();
  const saleModel = new Sale();
  const categoryModel = new Category();
  const supplierModel = new Supplier();
  
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║        INVENTORY PRO PERFORMANCE TESTS         ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  
  try {
    // Test 1: Database Connection
    await measurePerformance('1. Database Connection', async () => {
      await db.raw('SELECT 1+1 as result');
      return 'Connection successful';
    });
    
    // Test 2: Count records in tables
    console.log('\n📊 Database Size Metrics:');
    const tables = ['products', 'categories', 'suppliers', 'sales', 'sale_items', 'stock_adjustments'];
    
    for (const table of tables) {
      const count = await measurePerformance(`  • ${table} count`, async () => {
        const result = await db(table).count('* as count').first();
        return result.count;
      });
      console.log(`  • ${table}: ${count} records`);
    }
    
    // Test 3: Product operations
    console.log('\n🛒 Product Operations:');
    
    const productCount = await measurePerformance('  • Get all products with details', async () => {
      const products = await productModel.getAllWithDetails();
      return products.length;
    });
    console.log(`  • Retrieved ${productCount} products with details`);
    
    await measurePerformance('  • Get low stock products', async () => {
      return await productModel.getLowStock();
    });
    
    await measurePerformance('  • Calculate total inventory value', async () => {
      return await productModel.getTotalInventoryValue();
    });
    
    // Test 4: Sales operations
    console.log('\n💰 Sales Operations:');
    
    const currentDate = new Date();
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const salesCount = await measurePerformance('  • Get sales by date range (current month)', async () => {
      const sales = await saleModel.getByDateRange(monthStart, monthEnd);
      return sales.length;
    });
    console.log(`  • Retrieved ${salesCount} sales for current month`);
    
    await measurePerformance('  • Calculate monthly profit metrics', async () => {
      return await saleModel.getMonthlyProfitMetrics();
    });
    
    await measurePerformance('  • Get profit by category', async () => {
      return await saleModel.getProfitByCategory('month');
    });
    
    await measurePerformance('  • Get top selling products', async () => {
      return await saleModel.getTopSellingProducts('month', 10);
    });
    
    await measurePerformance('  • Get profit and revenue trend (6 months)', async () => {
      return await saleModel.getProfitAndRevenueTrend(6);
    });
    
    // Test 5: Category and Supplier operations
    console.log('\n📁 Category & Supplier Operations:');
    
    await measurePerformance('  • Get all categories with product count', async () => {
      return await categoryModel.getAllWithProductCount();
    });
    
    await measurePerformance('  • Get all suppliers with product count', async () => {
      return await supplierModel.getAllWithProductCount();
    });
    
    await measurePerformance('  • Get supplier performance metrics', async () => {
      return await supplierModel.getSupplierPerformance();
    });
    
    // Test 6: Complex queries
    console.log('\n🔍 Complex Queries:');
    
    await measurePerformance('  • Revenue by payment method', async () => {
      return await saleModel.getRevenueByPaymentMethod('month');
    });
    
    await measurePerformance('  • Revenue and profit by supplier', async () => {
      return await saleModel.getRevenueAndProfitBySupplier('month');
    });
    
    // Test 7: Database joins
    console.log('\n🔄 Complex Joins:');
    
    await measurePerformance('  • Products with sales history', async () => {
      const result = await db('products')
        .select(
          'products.id',
          'products.name',
          'products.stock_quantity',
          db.raw('COUNT(DISTINCT sale_items.sale_id) as sales_count'),
          db.raw('SUM(sale_items.quantity) as total_sold')
        )
        .leftJoin('sale_items', 'products.id', 'sale_items.product_id')
        .groupBy('products.id')
        .orderBy('total_sold', 'desc')
        .limit(20);
      
      return result;
    });
    
    console.log('\n✅ All performance tests completed successfully.');
    
    // Display summary
    console.log('\n📈 Performance Summary:');
    console.log('Check the execution times above to identify any performance bottlenecks.');
    console.log('The fastest and slowest operations can help guide optimization efforts.');
    
  } catch (error) {
    console.error('\n❌ Performance tests failed:', error);
  }
};

// Run the tests if this file is executed directly
if (require.main === module) {
  runPerformanceTests()
    .then(() => {
      console.log('\nPerformance test suite completed.');
      process.exit(0);
    })
    .catch(err => {
      console.error('Unhandled error during performance tests:', err);
      process.exit(1);
    });
}

module.exports = { runPerformanceTests }; 