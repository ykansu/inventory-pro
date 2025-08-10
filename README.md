# Stock Management System

## Overview

This is a comprehensive stock management application built with Electron.js, React, and a UI library, designed to provide robust inventory and sales tracking for small to medium-sized businesses.

## Technology Stack

- **Frontend**: React
- **Desktop Framework**: Electron.js
- **UI Library**: The project documentation mentions shadcn/ui. Tailwind CSS is configured, but direct usage of shadcn/ui components was not confirmed in the examined component files, which utilize local CSS modules for styling.
- **Database**: SQLite
- **State Management**: React Context API

## Prerequisites

- Node.js (v16 or later)
- npm or Yarn
- Git

## Installation

1. Clone the repository
```bash
git clone https://github.com/ykansu/inventory-pro.git
cd inventory-pro
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up the database
```bash
npm run db:setup
# or
yarn db:setup
```

## Running the Application

### Development Mode
```bash
npm run start
# or
yarn start
```

### Build for Production
```bash
npm run build:prod && npm run make
# or
yarn build
```

## Configuration

- Database configuration: `src/database/config.js`
- Application settings: Managed via database and environment variables.

## Environment Variables

Create a `.env` file in the root directory with the following variables:
- `DB_PATH`: Path to the SQLite database file.
- `BACKUP_ENABLED`: Enable/disable database backups (true/false).
- `BACKUP_FREQUENCY`: Frequency of database backups (daily, weekly, monthly).
- `BACKUP_TIME`: Time for scheduled database backups (HH:MM).
- `MAX_BACKUPS`: Maximum number of database backups to keep.
- `BACKUP_PATH`: Directory to store database backups.
- `JSON_BACKUP_ENABLED`: Enable/disable JSON export backups (true/false).
- `JSON_BACKUP_FREQUENCY`: Frequency of JSON export backups (daily, weekly, monthly).
- `JSON_BACKUP_TIME`: Time for scheduled JSON export backups (HH:MM).
- `MAX_JSON_BACKUPS`: Maximum number of JSON export backups to keep.
- `JSON_BACKUP_PATH`: Directory to store JSON export backups.
- `EXCEL_BACKUP_ENABLED`: Enable/disable Excel export backups (true/false).
- `EXCEL_BACKUP_FREQUENCY`: Frequency of Excel export backups (daily, weekly, monthly).
- `EXCEL_BACKUP_TIME`: Time for scheduled Excel export backups (HH:MM).
- `MAX_EXCEL_BACKUPS`: Maximum number of Excel export backups to keep.
- `EXCEL_BACKUP_PATH`: Directory to store Excel export backups.
- `ENABLE_EXCEL_BACKUP_ON_EXIT`: Prompt for Excel backup on exit (true/false).
- `REPO_PATH`: Local path to the repository for update checks.
- `CHECK_UPDATES_ON_STARTUP`: Enable/disable update checks on startup (true/false).

## Database Management

### Database Export/Import Features
- **Export Formats**:
  - SQLite database file (.db)
  - JSON file (.json)
- **Import Capabilities**:
  - Import from SQLite database
  - Import from JSON file
- **Backup Recommendations**:
  - Regularly export database
  - Store backups in a secure location
  - Validate imported databases before overwriting

### Database Schema

### Categories Table
- `id` (Primary Key)
- `name` (Unique, Not Null)
- `description`
- `created_at`
- `updated_at`

### Suppliers Table
- `id` (Primary Key)
- `company_name` (Unique, Not Null)
- `contact_person` (Not Null)
- `phone` (Not Null)
- `email`
- `address`
- `tax_id`
- `website`
- `notes`
- `created_at`
- `updated_at`

### Products Table
- `id` (Primary Key)
- `name` (Unique, Not Null)
- `barcode` (Unique)
- `category_id` (Foreign Key to categories.id, SET NULL on delete)
- `selling_price` (Not Null)
- `cost_price` (Not Null)
- `stock_quantity` (Not Null, Default 0)
- `min_stock_threshold` (Not Null, Default 5)
- `unit` (Default 'pcs')
- `supplier_id` (Foreign Key to suppliers.id, SET NULL on delete)
- `description`
- `image_path`
- `created_at`
- `updated_at`
- `is_deleted` (Boolean, Default false)
- `deleted_at` (Nullable datetime)

### Sales Table
- `id` (Primary Key)
- `receipt_number` (Unique, Not Null)
- `subtotal` (Not Null)
- `tax_amount` (Not Null, Default 0)
- `discount_amount` (Not Null, Default 0)
- `total_amount` (Not Null)
- `payment_method` (Default 'cash')
- `amount_paid` (Not Null)
- `change_amount` (Default 0)
- `card_amount`
- `cash_amount`
- `split_payment_info` (JSON string)
- `payment_method_details` (JSON string)
- `cashier`
- `is_returned` (Default false)
- `notes`
- `created_at`
- `updated_at`

### Sale Items Table
- `id` (Primary Key)
- `sale_id` (Foreign Key to sales.id, CASCADE on delete)
- `product_id` (Foreign Key to products.id, RESTRICT on delete)
- `product_name` (Not Null)
- `quantity` (Not Null)
- `unit_price` (Not Null)
- `historical_cost_price`
- `discount_amount` (Default 0)
- `total_price` (Not Null)
- `created_at`
- `updated_at`

### Stock Adjustments Table
- `id` (Primary Key)
- `product_id` (Foreign Key to products.id, CASCADE on delete)
- `quantity_change` (Not Null)
- `adjustment_type` (Not Null: 'purchase', 'sale', 'return', 'loss', 'correction')
- `reason`
- `reference`
- `created_at`
- `updated_at`

### Expenses Table
- `id` (Primary Key)
- `reference_number`
- `description`
- `amount` (Not Null)
- `category_id` (Foreign Key to expense_categories.id, SET NULL on delete)
- `expense_date` (Not Null)
- `payment_method` (Default 'cash')
- `recipient`
- `notes`
- `receipt_image_path`
- `created_at`
- `updated_at`

### Expense Categories Table
- `id` (Primary Key)
- `name` (Unique, Not Null)
- `description`
- `created_at`
- `updated_at`

### Product Price History Table
- `id` (Primary Key)
- `product_id` (Foreign Key to products.id, CASCADE on delete)
- `selling_price` (Not Null)
- `cost_price` (Not Null)
- `change_type` (Not Null: 'selling_price', 'cost_price', 'both')
- `reason`
- `changed_by_user_id` (Optional)
- `created_at`
- `updated_at`

## Security

- SQLite database
- Input validation
- Secure electron configuration

## Troubleshooting

- Ensure all dependencies are correctly installed
- Check database connectivity
- Verify barcode scanner configuration

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT License

## Contact

Yasin KANSU
- Email: yasin.kansu@example.com
- Project Link: https://github.com/ykansu/inventory-pro

## Acknowledgments

- Electron.js
- React
- SQLite