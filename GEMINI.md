# Inventory Pro - Stock Management System

## Project Overview

Inventory Pro is a comprehensive stock management application built with Electron.js, React, and SQLite. It's designed to provide robust inventory and sales tracking for small to medium-sized businesses. The application offers features like product management, point-of-sale (POS), sales history tracking, reporting, and supplier management.

### Technology Stack

- **Frontend**: React with React Router for navigation
- **Desktop Framework**: Electron.js for cross-platform desktop application
- **Database**: SQLite with Knex.js as the query builder
- **State Management**: React Context API
- **Build Tools**: Webpack for bundling, Babel for transpilation
- **Styling**: CSS Modules for component-scoped styles
- **Internationalization**: i18next for multi-language support

### Key Features

1. **Product Management**: Create, update, and track products with categories, suppliers, pricing, and stock levels
2. **Point of Sale (POS)**: Barcode scanning, cart management, and receipt generation
3. **Sales History**: Comprehensive sales log with search and filter capabilities
4. **Reporting**: Z-reports and various analytical reports
5. **Dashboard**: KPIs and visualizations for business insights
6. **Supplier Management**: Track supplier information and product relationships
7. **Settings**: Database backups, import/export, and application configuration

## Project Structure

```
inventory-pro/
├── src/
│   ├── components/          # React components organized by feature
│   ├── context/             # React context providers for global state
│   ├── database/            # Database configuration, migrations, and utilities
│   ├── hooks/               # Custom React hooks
│   ├── ipcHandlers/         # Electron IPC handlers for main/renderer communication
│   ├── models/              # Data models for database entities
│   ├── utils/               # Utility functions
│   ├── index.js             # Electron main process entry point
│   ├── preload.js           # Electron preload script for secure IPC
│   └── renderer.js          # React application entry point
├── dist/                    # Production build output
├── scripts/                 # Build and setup scripts
└── package.json             # Project dependencies and scripts
```

## Building and Running

### Prerequisites

- Node.js (v16 or later)
- npm or Yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/ykansu/inventory-pro.git
cd inventory-pro

# Install dependencies
npm install
# or
yarn install

# Set up the database
npm run db:setup
# or
yarn db:setup
```

### Development Mode

```bash
# Start the application in development mode
npm run start
# or
yarn start

# Alternative development command with hot reloading
npm run dev
# or
yarn dev
```

### Production Build

```bash
# Build for production
npm run build:prod && npm run make
# or
yarn build

# Alternative build command
npm run dist
# or
yarn dist
```

### Other Useful Commands

```bash
# Run database migrations
npm run migrate
# or
yarn migrate

# Create a new database migration
npm run migrate:make <migration_name>
# or
yarn migrate:make <migration_name>
```

## Architecture

### Electron Main Process

The main process (`src/index.js`) handles:
- Creating and managing the application window
- Setting up IPC communication channels
- Initializing the database
- Managing application lifecycle
- Handling system events (close, activate, etc.)

### Electron Renderer Process

The renderer process (React application) handles:
- User interface rendering
- State management through React Context
- Communication with the main process via IPC
- Navigation between different application pages

### Database

The application uses SQLite as its database with Knex.js as the query builder. The database schema includes:
- Categories
- Suppliers
- Products
- Sales
- Sale Items
- Stock Adjustments
- Settings
- Expense Categories
- Expenses
- Product Price History

Migrations are used to manage schema changes, and seeds can be used to populate initial data.

### IPC Communication

The application uses Electron's IPC (Inter-Process Communication) to securely communicate between the main and renderer processes. The preload script (`src/preload.js`) exposes a safe API to the renderer process, while the main process handles the actual implementation in handler files (`src/ipcHandlers/`).

### State Management

React Context API is used for state management, with separate contexts for:
- Database operations
- Application settings

### Internationalization

The application supports multiple languages using i18next, with translation files organized by language.

## Development Conventions

### Code Style

- JavaScript with modern ES6+ features
- React functional components with hooks
- CSS Modules for component-scoped styling
- Consistent naming conventions for components and files

### Component Structure

Components are organized by feature:
- Common components (reusable UI elements)
- Pages (top-level route components)
- Feature-specific components (organized in subdirectories)

### Database Migrations

New database schema changes should be implemented as migrations using Knex.js migration files.

### Testing

Currently, the project does not have a comprehensive testing suite. When adding tests, consider:
- Unit tests for utility functions
- Integration tests for database operations
- UI tests for critical user flows

### Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Environment Variables

The application uses a `.env` file for configuration. Key variables include:
- `DB_PATH`: Path to the SQLite database file
- `BACKUP_*`: Database backup settings
- `JSON_BACKUP_*`: JSON export backup settings
- `EXCEL_BACKUP_*`: Excel export backup settings
- `ENABLE_EXCEL_BACKUP_ON_EXIT`: Prompt for Excel backup on exit
- `REPO_PATH`: Local path to the repository for update checks
- `CHECK_UPDATES_ON_STARTUP`: Enable/disable update checks on startup

## Security

- Uses Electron's context isolation for security
- Secure IPC communication through preload script
- Input validation for user data
- SQLite database with proper foreign key constraints

## Troubleshooting

- Ensure all dependencies are correctly installed
- Check database connectivity
- Verify barcode scanner configuration
- Check that the required directories for database and backups exist with proper permissions

## License

MIT License