# Stock Management System - Feature Specifications

## 1. Product Management Page

### Core Functionality
- Product Creation
  - Input Fields:
    - **Product Name** (required, max 100 characters, should be unique)
    - **Barcode/SKU** (unique identifier, optional, alphanumeric, consider different barcode formats like EAN-13, UPC-A)
    - **Category** (required, dropdown selection, allow for adding new categories)
    - **Selling Price** (required, numerical, validate as greater than 0)
    - **Cost Price** (required, numerical, validate as greater than 0, should be less than or equal to selling price)
    - **Current Stock Quantity** (required, integer, default to 0)
    - **Minimum Stock Threshold** (required, integer, default to 5, for low stock alerts)
    - **Unit of Measurement** (required, dropdown selection - pcs, kg, liters, meters, etc., allow for adding new units)
    - **Supplier** (required, linked from Supplier database, dropdown selection)
    - **Description** (optional, allow for rich text formatting if possible)
    - **Product Image** (optional, allow uploading a single image)
    - **Date Added** (auto-generated, read-only)
    - **Last Updated** (auto-generated, read-only)
    - **Product Variations** (optional, consider support for products with variations like size, color, etc.)

- Product Listing and Management
  - Advanced Search Capabilities
    - Search by name (case-insensitive, whole or partial match)
    - Search by barcode (exact match)
    - Search by category (exact match)
    - Search by supplier
    - Search by description keywords
    - Ability to combine multiple search criteria

  - Filtering Options
    - By category
    - By supplier
    - By stock level (low stock - below threshold, in stock - above threshold, out of stock - zero quantity)
    - By price range (customizable min and max)
    - By date added (specific date or range)
    - By last updated date (specific date or range)

  - Sorting Options
    - Alphabetical (A-Z, Z-A) by product name
    - Price (low to high, high to low) by selling price
    - Cost Price (low to high, high to low)
    - Stock quantity (low to high, high to low)
    - Date added (oldest to newest, newest to oldest)
    - Last updated (oldest to newest, newest to oldest)

  - Bulk Actions
    - Bulk update selling prices (increase/decrease by percentage or fixed amount)
    - Bulk update cost prices (increase/decrease by percentage or fixed amount)
    - Bulk update stock levels (add, subtract, set new value, with option to record reason for adjustment)
    - Bulk assign category
    - Bulk assign supplier
    - Export selected product list to CSV (include all relevant fields)
    - Delete selected products (with confirmation)

- Stock Management
  - Real-time stock tracking (display current stock level on product listing)
  - Automatic stock reduction on sale (deduct sold quantity from stock)
  - Manual stock adjustment (allow authorized users to adjust stock levels with a reason/note and timestamp)
  - Stock transfer between categories (move stock from one category to another, recording the transfer)
  - Low stock notifications (display alerts on the dashboard and potentially via email or in-app notifications when products fall below the minimum threshold)
  - Stocktaking functionality (ability to perform stock counts and reconcile discrepancies)
    - Option to generate a stocktaking list
    - Ability to input actual stock counts
    - Generate a report of stock discrepancies

## 2. Point of Sale (POS) Page

### Core Functionality
- Barcode Scanning
  - Instant product lookup (display product name, price, and available quantity)
  - Automatic price retrieval
  - Multiple barcode format support (specify common formats)
  - Fallback to manual search (if barcode is not recognized or cannot be scanned)

- Sales Session Management
  - Product Addition Methods
    - Barcode scan
    - Manual search (search by name or SKU)
    - Quick add from recent items (display a list of recently added products)
  - Cart Functionality
    - Add/Remove products
    - Adjust product quantity (with validation to not exceed available stock)
    - Apply individual product discounts (percentage or fixed amount, with option to record reason)
    - Apply discounts to the entire cart (percentage or fixed amount, with option to record reason)
    - Clear cart functionality
  - Pricing and Totals
    - Real-time subtotal calculation
    - Tax calculation (configurable tax rate in settings)
    - Discount application (display individual and cart discounts)
    - Grand total calculation
    - Multiple payment method support
      - Cash (record amount received and calculate change)
      - Card (record transaction details if needed)
      - Store Credit (if implemented as a feature)
    - Option to hold/unhold sale functionality (save a current sale and resume it later)

- Receipt Generation
  - Detailed sales ticket
    - Business name and address (from settings)
    - Date and time of sale
    - Receipt number (unique identifier)
    - List of sold items (product name, quantity, unit price, total price)
    - Subtotal
    - Discounts applied
    - Tax amount
    - Grand total
    - Payment method(s) and amounts
    - Change given (if cash payment)
    - Optional: Cashier/Staff member name
    - Optional: Thank you message
  - Print option (support for standard receipt printers)
  - Save to sales history (automatically record the completed sale)
  - Basic receipt customization (business name, logo - if possible, contact information)

## 3. Sales History Page

### Core Functionality
- Comprehensive Sales Log
  - Detailed Sales Record
    - Date and time of sale
    - Total sale amount
    - Payment method(s)
    - Cashier/Staff member (if user roles are implemented)
    - List of sold items (with quantity, individual price, total price)
    - Receipt number (link to full receipt view)
    - Discounts applied
    - Tax amount
    - Notes (optional, for returns or other relevant information)

  - Search and Filter Options
    - Search by date range (calendar picker)
    - Filter by payment method
    - Filter by staff member (if user roles are implemented)
    - Filter by total amount range
    - Search by receipt number
    - Search by product name (within the sold items)

  - Sales Ticket Viewer
    - Full sale details as on the original receipt
    - Reprint receipt
    - Basic sale return/refund tracking
      - Option to mark a sale as returned/refunded
      - Record reason for return/refund
      - Adjust stock levels upon return (increase returned quantity)
      - Option to issue a refund receipt

## 4. Reporting Page

### Core Functionality
- Z-Report Generation (End-of-Day/Shift Report)
  - Daily Sales Summary
    - Total sales amount
    - Number of transactions
    - Gross profit (Total sales - Cost of goods sold)
    - Cash sales total
    - Card sales total
    - Other payment method totals
    - Average transaction value
  - Payment Method Breakdown
    - Detailed analysis of payment types and their respective totals and percentages
  - Sales by Category
    - Total sales and quantity sold for each product category
  - Sales by Product
    - List of products sold with quantities and total sales value
  - Reporting Periods
    - Daily reports (for a selected date)
    - Weekly reports (for a selected week)
    - Monthly reports (for a selected month)
    - Custom date range reports (with start and end date selection)
  - Export Options
    - Export to CSV (for further analysis)
    - Basic print functionality

- Additional Reports (Consider for future enhancements)
  - Low Stock Report (list of products below the minimum threshold)
  - Inventory Valuation Report (total value of current stock based on cost price or selling price)
  - Sales Trends Report (visual representation of sales over time)
  - Profitability Report (profit margins for products or categories)
  - Top Selling Products Report

## 5. Dashboard Page

### Core Functionality
- Key Performance Indicators (KPIs)
  - Total Sales
    - Today
    - This week
    - This month
    - Comparison to previous period (e.g., last week, last month)
  - Inventory Insights
    - Total inventory value (based on cost price)
    - Number of unique products
    - Number of low stock products
    - Number of out-of-stock products
  - Sales Performance
    - Top-selling products (e.g., top 5 or 10)
    - Lowest-selling products (e.g., bottom 5 or 10)
    - Average daily sales
    - Gross profit for the current period (today, week, month)

- Basic Visualization
  - Daily sales trend chart (line graph showing sales over the last 7 or 30 days)
  - Monthly revenue comparison (bar chart comparing revenue for the last 12 months)
  - Product category sales distribution (pie chart showing the percentage of sales for each category)
  - Top selling products bar chart

## 6. Supplier Management Page

### Core Functionality
- Supplier Profile Management
  - Supplier Information
    - Company name (required, unique)
    - Contact person (required)
    - Phone number (required, validate format)
    - Email (validate format)
    - Address (allow multi-line input)
    - Tax/Business ID (optional)
    - Website (optional)
    - Notes (optional, for specific terms or information)
  - Supplier Product Tracking
    - List of products supplied by this supplier (linked from Product database)
    - Last purchase date (for each product from this supplier)
    - Total purchases value (from this supplier)
  - Financial Insights
    - Total spending per supplier (over a selected period)
    - Average order value (from this supplier)
    - Purchase frequency (from this supplier)

- Supplier Interaction Log
  - Basic communication notes (record dates and details of communication)
  - Order history (link to purchase orders if implemented)
  - Payment terms (record agreed payment terms)

## 7. Settings Page

### Core Functionality
- Database Management
  - Automated Daily Backups
    - Configurable backup time (user can set the time for daily backup)
    - Backup location selection (allow user to choose a local directory for backups)
    - Backup file naming convention (e.g., `backup_YYYY-MM-DD_HHMMSS.db`)
    - Option to manually trigger a backup
  - Import/Export Options
    - Import data from CSV files (for products, suppliers)
    - Export all data to a single SQLite database file
    - Export all data to JSON format
    - Restore from a previously created backup file (with confirmation)

- Application Settings
  - Business Profile
    - Business name (required)
    - Contact information (address, phone, email - optional but recommended)
    - Tax details (e.g., VAT number - if applicable)
    - Currency selection (e.g., TRY, USD, EUR - default to Türkiye Lirası)
    - Logo upload (optional, for use on receipts and reports)
  - Localization
    - Date format (e.g., DD/MM/YYYY, MM/DD/YYYY)
    - Time format (12-hour or 24-hour)
    - Decimal and thousand separators (based on selected locale)
  - Tax Settings
    - Enable/disable tax calculation
    - Set default tax rate(s)
