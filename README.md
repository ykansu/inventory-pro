# Stock Management System

## Overview

This is a comprehensive stock management application built with Electron.js, React, and shadcn/ui library, designed to provide robust inventory and sales tracking for small to medium-sized businesses.

## Technology Stack

- **Frontend**: React
- **Desktop Framework**: Electron.js
- **UI Library**: shadcn/ui
- **Database**: SQLite
- **State Management**: [Your chosen state management library, if any]


## Prerequisites

- Node.js (v16 or later)
- npm or Yarn
- Git

## Installation

1. Clone the repository
```bash
git clone https://github.com/[your-username]/[your-repo-name].git
cd [your-repo-name]
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

- Database configuration: `config/database.js`
- Application settings: `config/app.json`

## Environment Variables

Create a `.env` file in the root directory with the following variables:
- `DATABASE_PATH`
- `APP_VERSION`
- Other necessary configuration values

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

### Products Table
- `id` (Primary Key)
- `name`
- `barcode`
- `price`
- `stock_quantity`
- `category`
- `created_at`
- `updated_at`

### Sales Table
- `id` (Primary Key)
- `total_amount`
- `products` (JSON array of sold items)
- `timestamp`

## Security

- SQLite database with encrypted connection
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

[Choose your license, e.g., MIT License]

## Contact

[Your Name/Organization]
- Email: [your-email]
- Project Link: [repository-url]

## Acknowledgments

- Electron.js
- React
- SQLite