# Stress Testing Inventory Pro

This document provides instructions for stress testing the Inventory Pro application with a large dataset to evaluate performance under heavy load conditions.

## What the Stress Test Does

The stress test will:

1. Generate a full year of historical data
2. Create realistic sales patterns with seasonal trends
3. Populate the database with numerous products, categories, and suppliers
4. Generate meaningful stock adjustments

**Warning:** Running this stress test will **delete all existing data** in your database and replace it with test data.

## Data Volume

The stress test generates approximately:

- 20 product categories
- 15 suppliers
- 200 products
- ~15,000 sales transactions (across 1 year)
- ~5,000 stock adjustments

## Running the Stress Test

### Method 1: Using NPM Script (Recommended)

The simplest way to run the stress test is using the provided npm script:

```bash
npm run stress-test
```

### Method 2: Manual Execution

Alternatively, you can run the script directly:

```bash
node src/database/run-stress-test.js
```

## Data Generation Logic

The stress test implements realistic business patterns:

- **Seasonal Variations**: Sales volume varies throughout the year, with higher activity during holiday seasons (November-December) and lower in January-February.
- **Day of Week Patterns**: Weekends have approximately 60% more sales than weekdays.
- **Product Variety**: Products are distributed across different categories with varying price points.
- **Payment Methods**: Mix of cash, card, and split payment methods.
- **Stock Adjustments**: Regular stock replenishments, occasional losses, and corrections.

## Performance Analysis

After running the stress test, you can evaluate the application's performance in several areas:

1. **UI Responsiveness**: Navigate through the application checking for lag or delays.
2. **Report Generation**: Test the speed of generating sales and inventory reports.
3. **Search Functionality**: Test search performance with a large dataset.
4. **Dashboard Loading**: Measure how quickly metrics and charts load.
5. **Database Operations**: Monitor the speed of adding new sales, products, etc.

## Removing Test Data

If you need to remove the test data and return to a clean database, you can:

1. Delete the database file and re-run migrations:
   ```bash
   rm src/database/inventory-pro.db
   npm run migrate:run
   ```

2. Or use the database backup/restore functionality if you backed up your original data.

## Adjusting Test Parameters

You can modify test parameters by editing the `CONFIG` object in `src/database/stress-test-generator.js`. Key parameters include:

- `START_DATE`: Beginning of the test data period
- `END_DATE`: End of the test data period
- `CATEGORIES_COUNT`: Number of categories to generate
- `SUPPLIERS_COUNT`: Number of suppliers to generate
- `PRODUCTS_COUNT`: Number of products to generate
- `AVG_SALES_PER_DAY`: Average sales transactions per day
- `MONTHLY_SEASONALITY`: Month-by-month sales volume multipliers

## Troubleshooting

If you encounter errors during the stress test:

1. **Database Locked**: Close any other applications that might be accessing the database.
2. **Memory Issues**: Reduce the data volume by editing the CONFIG parameters.
3. **Timeout Errors**: The test may take several minutes to complete. Be patient and ensure your system doesn't go to sleep.

For any persistent issues, check the error messages in the console output for specific details. 