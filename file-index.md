# Inventory Pro - File Index

This document provides a comprehensive overview of the Inventory Pro project structure to help LLMs understand the codebase organization and relationships.

## Project Overview

Inventory Pro is a comprehensive stock management application built with Electron.js and React, offering inventory management, POS functionality, reporting, and other business management features.

## Project Structure

```
inventory-pro/
├── .env                    # Environment variables (not version controlled)
├── .env.example            # Example environment variables
├── .git/                   # Git repository data
├── .gitignore              # Git ignore patterns
├── README.md               # Project documentation
├── PRODUCTION-BUILD.md     # Production build guide
├── USING-AS-COMPONENT.md   # Guide for using components
├── dist/                   # Distribution output
├── electron-builder.json   # Electron Builder configuration
├── features.md             # Feature documentation
├── file-index.md           # This file - project structure overview
├── forge.config.js         # Electron Forge configuration for building
├── node_modules/           # Dependencies
├── out/                    # Build output directory
├── package-lock.json       # Lock file for package versions
├── package.json            # Project metadata, dependencies, and scripts
├── scripts/                # Build and utility scripts
└── src/                    # Source code
    ├── components/         # React components
    │   ├── App.jsx         # Main React application component
    │   ├── LanguageInitializer.jsx # Initializes i18n
    │   ├── common/         # Shared/reusable UI components
    │   └── dashboard/      # Dashboard-specific components
    ├── context/            # React context providers
    │   └── DatabaseContext.jsx # Database context provider
    ├── database/           # Database-related code
    │   ├── STRESS-TEST.md              # Stress testing documentation
    │   ├── backup.js                   # Database backup functionality
    │   ├── backups/                    # Backup storage location
    │   ├── config.js                   # Database configuration
    │   ├── connection.js               # Database connection
    │   ├── dbManager.js                # Database management utilities
    │   ├── excel-backup-scheduler.js   # Scheduled backup service
    │   ├── excel-backup.js             # Excel export functionality
    │   ├── fix-migration.js            # Migration fixing utility
    │   ├── force-seed.js               # Database seeding utility
    │   ├── inventory-pro.db            # SQLite database file
    │   ├── json-backup.js              # JSON export functionality
    │   ├── knexfile.js                 # Knex.js ORM configuration
    │   ├── migrations/                 # Database schema migrations
    │   ├── run-stress-test.js          # Stress test runner
    │   ├── seeds/                      # Seed data for the database
    │   └── stress-test-generator.js    # Stress testing utility
    ├── hooks/              # Custom React hooks
    │   ├── useSalesHistory.js          # Sales history data hook
    │   └── useTranslation.js           # Translation hook
    ├── i18n.js             # i18n configuration
    ├── index.css           # Global styles
    ├── index.html          # Main HTML entry
    ├── index.js            # App initialization
    ├── main.js             # Electron main process
    ├── models/             # Data models
    │   ├── Setting.js      # Settings model
    │   └── index.js        # Models exports
    ├── pages/              # Application pages/screens
    │   ├── Dashboard.jsx             # Main dashboard screen
    │   ├── POS.jsx                   # Point of Sale system
    │   ├── ProductManagement.jsx     # Product management interface
    │   ├── Reports.jsx               # Reporting and analytics
    │   ├── SalesHistory.jsx          # Sales history and records
    │   ├── Settings.jsx              # Application settings
    │   └── StockUpdate.jsx           # Stock update management
    ├── preload.js          # Electron preload script
    ├── renderer.js         # Electron renderer process
    ├── services/           # Business logic services
    │   └── DatabaseService.js        # Database service
    ├── styles/             # CSS styles
    │   ├── components/     # Component-specific styles
    │   │   ├── buttons.css           # Button styles
    │   │   ├── chart.css             # Chart component styles
    │   │   ├── charts.css            # Charts collection styles
    │   │   ├── forms.css             # Form styles
    │   │   ├── index.css             # Components index styles
    │   │   ├── loading-spinner.css   # Loading spinner styles
    │   │   ├── modal.css             # Modal dialog styles
    │   │   ├── stat-card.css         # Statistics card styles
    │   │   └── table.css             # Table styles
    │   ├── main.css        # Main application styles
    │   └── pages/          # Page-specific styles
    │       ├── dashboard.css         # Dashboard page styles
    │       ├── pos.css               # POS page styles
    │       ├── product-management.css# Product management page styles
    │       ├── reports.css           # Reports page styles
    │       ├── sales-history.css     # Sales history page styles
    │       ├── settings.css          # Settings page styles
    │       └── stock-update.css      # Stock update page styles
    ├── test/               # Testing utilities
    │   ├── performance-test.js       # Performance testing
    │   └── profit-metrics-test.js    # Profit metrics testing
    ├── test-metrics.js     # Test metrics utility
    ├── translations/       # Translation files
    │   ├── en/             # English translations
    │   │   ├── common.json           # Common English translations
    │   │   ├── dashboard.json        # Dashboard English translations
    │   │   ├── pos.json              # POS English translations
    │   │   ├── products.json         # Products English translations
    │   │   ├── reports.json          # Reports English translations
    │   │   ├── sales.json            # Sales English translations
    │   │   └── settings.json         # Settings English translations
    │   └── tr/             # Turkish translations
    │       ├── common.json           # Common Turkish translations
    │       ├── dashboard.json        # Dashboard Turkish translations
    │       ├── pos.json              # POS Turkish translations
    │       ├── products.json         # Products Turkish translations
    │       ├── reports.json          # Reports Turkish translations
    │       ├── sales.json            # Sales Turkish translations
    │       └── settings.json         # Settings Turkish translations
    └── utils/              # Utility functions
        ├── calculations.js           # Business calculations 
        ├── formatters.js             # Data formatters
        └── receiptPrinter.js         # Receipt printing functionality
```

## File Descriptions

### Root Directory Files

| File | Description |
|---------------|-------------|
| package.json | Project metadata, dependencies, and scripts |
| package-lock.json | Lock file for package versions |
| webpack.config.js | Webpack bundler configuration |
| forge.config.js | Electron Forge configuration for building |
| electron-builder.json | Electron Builder configuration |
| .env.example | Example environment variables |
| .env | Environment variables (not version controlled) |
| .gitignore | Git ignore patterns |
| README.md | Project documentation |
| features.md | Feature documentation |
| PRODUCTION-BUILD.md | Production build guide |
| USING-AS-COMPONENT.md | Guide for using components |
| file-index.md | This file - project structure overview |

### Core Files

| File | Description |
|---------------|-------------|
| src/main.js | Electron main process entry point |
| src/preload.js | Electron preload script for secure IPC |
| src/renderer.js | Electron renderer process entry point |
| src/index.js | Main application initialization |
| src/index.html | Main HTML entry point |
| src/index.css | Global application styles |
| src/i18n.js | Internationalization configuration |

### Components

| Directory/File | Description |
|---------------|-------------|
| src/components/common/ | Shared/reusable UI components |
| src/components/dashboard/ | Dashboard-specific components |
| src/components/App.jsx | Main React application component |
| src/components/LanguageInitializer.jsx | Initializes i18n for the application |

### Pages

| File | Description |
|---------------|-------------|
| src/pages/Dashboard.jsx | Main dashboard screen |
| src/pages/ProductManagement.jsx | Product management interface |
| src/pages/POS.jsx | Point of Sale system |
| src/pages/Reports.jsx | Reporting and analytics |
| src/pages/SalesHistory.jsx | Sales history and records |
| src/pages/Settings.jsx | Application settings |
| src/pages/StockUpdate.jsx | Stock update management |

### CSS Styles

| File | Description |
|---------------|-------------|
| src/index.css | Global application styles |
| src/styles/main.css | Main application styles |
| src/styles/components/buttons.css | Button styles |
| src/styles/components/chart.css | Chart component styles |
| src/styles/components/charts.css | Charts collection styles |
| src/styles/components/forms.css | Form styles |
| src/styles/components/index.css | Components index styles |
| src/styles/components/loading-spinner.css | Loading spinner styles |
| src/styles/components/modal.css | Modal dialog styles |
| src/styles/components/stat-card.css | Statistics card styles |
| src/styles/components/table.css | Table styles |
| src/styles/pages/dashboard.css | Dashboard page styles |
| src/styles/pages/pos.css | POS page styles |
| src/styles/pages/product-management.css | Product management page styles |
| src/styles/pages/reports.css | Reports page styles |
| src/styles/pages/sales-history.css | Sales history page styles |
| src/styles/pages/settings.css | Settings page styles |
| src/styles/pages/stock-update.css | Stock update page styles |

### Database

| File/Directory | Description |
|---------------|-------------|
| src/database/connection.js | Database connection management |
| src/database/config.js | Database configuration settings |
| src/database/knexfile.js | Knex.js ORM configuration |
| src/database/dbManager.js | Database management utilities |
| src/database/backup.js | Database backup functionality |
| src/database/excel-backup.js | Excel export functionality |
| src/database/json-backup.js | JSON export functionality |
| src/database/excel-backup-scheduler.js | Scheduled backup services |
| src/database/migrations/ | Database schema migrations |
| src/database/backups/ | Database backup storage location |
| src/database/seeds/ | Seed data for the database |
| src/database/stress-test-generator.js | Stress testing utility |
| src/database/run-stress-test.js | Stress test runner |
| src/database/force-seed.js | Forced database seeding |
| src/database/fix-migration.js | Migration repair utility |
| src/database/STRESS-TEST.md | Stress testing documentation |
| src/database/inventory-pro.db | SQLite database file |

### Models

| File | Description |
|---------------|-------------|
| src/models/index.js | Exports all models |
| src/models/Setting.js | Settings model for application configuration |

### Context

| File | Description |
|---------------|-------------|
| src/context/DatabaseContext.jsx | Database context provider |

### Hooks

| File | Description |
|---------------|-------------|
| src/hooks/useTranslation.js | Translation hook |
| src/hooks/useSalesHistory.js | Sales history data hook |

### Utils

| File | Description |
|---------------|-------------|
| src/utils/calculations.js | Business calculations |
| src/utils/formatters.js | Data formatters |
| src/utils/receiptPrinter.js | Receipt printing functionality |

### Translations

| File | Description |
|---------------|-------------|
| src/translations/en/common.json | Common English translations |
| src/translations/en/dashboard.json | Dashboard English translations |
| src/translations/en/pos.json | POS English translations |
| src/translations/en/products.json | Products English translations |
| src/translations/en/reports.json | Reports English translations |
| src/translations/en/sales.json | Sales English translations |
| src/translations/en/settings.json | Settings English translations |
| src/translations/tr/common.json | Common Turkish translations |
| src/translations/tr/dashboard.json | Dashboard Turkish translations |
| src/translations/tr/pos.json | POS Turkish translations |
| src/translations/tr/products.json | Products Turkish translations |
| src/translations/tr/reports.json | Reports Turkish translations |
| src/translations/tr/sales.json | Sales Turkish translations |
| src/translations/tr/settings.json | Settings Turkish translations |

## Tech Stack

- **Frontend**: 
  - React
  - React Router
  - Chart.js
  - React Hot Toast
  - CSS

- **Backend**: 
  - Electron
  - Node.js

- **Database**: 
  - SQLite
  - Knex.js ORM

- **Build Tools**: 
  - Webpack
  - Babel
  - Electron Forge
  - Electron Builder

- **Internationalization**: 
  - i18next
  - react-i18next

## Other Important Information

- The application uses SQLite as its database through Knex.js ORM
- Electron is used to create a cross-platform desktop application
- React is used for the UI components and state management
- i18next provides internationalization support
- Chart.js is used for data visualization and reporting
- The app supports data backup/export to Excel and JSON formats
- Testing includes stress-testing for database performance 