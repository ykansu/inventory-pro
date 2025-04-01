# Using Inventory Pro as a Component in Other Applications

This guide explains how to use Inventory Pro as a component within your other applications.

## Building the Executable

Before you can use Inventory Pro as a component, you need to create a packaged executable:

1. **Build a Portable Version**

   ```bash
   npm run package-portable
   ```

   This creates a portable version of the app in `out/Inventory Pro-win32-x64/`. 
   This folder contains the entire application and can be moved or copied as needed.

2. **Create an Installer** (optional)

   ```bash
   npm run dist
   ```

   This creates installation packages in `out/make/`. For Windows, you'll get:
   - A Squirrel-based installer (.exe) in `out/make/squirrel.windows/x64`
   - A portable zip file in `out/make/zip/win32/x64`

## Integration Options

There are several ways to integrate Inventory Pro with your other applications:

### Option 1: Launch the Executable (Simple)

The most straightforward approach is to simply launch the Inventory Pro executable from your application:

```javascript
const { spawn } = require('child_process');
const path = require('path');

// Path to the Inventory Pro executable
const inventoryAppPath = path.resolve('/path/to/Inventory Pro.exe');

// Launch the application
const inventoryApp = spawn(inventoryAppPath, [], {
  detached: true, // Run in background
  stdio: 'ignore'
});

// Allow your application to exit independently
inventoryApp.unref();
```

### Option 2: Create an API Wrapper

For more control, create a wrapper module that manages the Inventory Pro application:

```javascript
// inventory-api.js
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

class InventoryAPI {
  constructor(executablePath) {
    this.executablePath = executablePath;
    this.process = null;
    this.dataPath = path.join(os.homedir(), '.inventory-pro');
  }

  launch() {
    this.process = spawn(this.executablePath, [], {
      detached: true,
      stdio: 'ignore'
    });
    this.process.unref();
    return this.process;
  }

  getDatabasePath() {
    return path.join(this.dataPath, 'inventory-pro.db');
  }

  close() {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
}

module.exports = InventoryAPI;
```

Usage:

```javascript
const InventoryAPI = require('./inventory-api');

// Create an instance with the path to the executable
const inventoryAPI = new InventoryAPI('C:/path/to/Inventory Pro.exe');

// Launch the application
inventoryAPI.launch();

// Access the database path
console.log(`Database is located at: ${inventoryAPI.getDatabasePath()}`);

// Later, when done
inventoryAPI.close();
```

### Option 3: Direct Database Access

You can access the Inventory Pro database directly from your application:

```javascript
const knex = require('knex');
const path = require('path');
const os = require('os');

// Connect to the Inventory Pro database
const dbPath = path.join(os.homedir(), '.inventory-pro', 'inventory-pro.db');
const db = knex({
  client: 'sqlite3',
  connection: {
    filename: dbPath
  },
  useNullAsDefault: true
});

// Query the database
async function getProducts() {
  return await db('products').select('*');
}

// Don't forget to close the connection when done
function closeConnection() {
  db.destroy();
}
```

**Important Note:** When accessing the database directly, be careful about concurrent access. Ensure that Inventory Pro is not running when your application is making changes to the database to avoid conflicts.

### Option 4: Extending with a REST API

For a more loosely coupled integration, extend Inventory Pro with a REST API server:

1. Create a new file `api-server.js` in the Inventory Pro project:

```javascript
const express = require('express');
const cors = require('cors');
const { Product, Category } = require('./models');

function startApiServer(port = 3030) {
  const app = express();
  app.use(cors());
  app.use(express.json());
  
  app.get('/api/products', async (req, res) => {
    try {
      const products = await Product.getAllWithDetails();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Add more endpoints as needed
  
  app.listen(port, () => {
    console.log(`API server running on port ${port}`);
  });
}

module.exports = { startApiServer };
```

2. Update `src/index.js` to start the API server:

```javascript
// Add this to your main process
const { startApiServer } = require('./api-server');

app.whenReady().then(() => {
  // ... existing initialization code
  
  // Start the API server
  startApiServer();
});
```

3. Access the API from your other applications:

```javascript
async function getProducts() {
  const response = await fetch('http://localhost:3030/api/products');
  return await response.json();
}
```

## Best Practices

1. **Version Compatibility**: Ensure version compatibility between your app and Inventory Pro.
2. **Resource Management**: Be mindful of resource usage when running multiple processes.
3. **Database Concurrency**: Be careful with direct database access to avoid conflicts.
4. **Error Handling**: Implement robust error handling for inter-process communication.
5. **Security**: When using API-based integration, implement proper authentication and authorization.

## Troubleshooting

If you encounter issues when integrating Inventory Pro:

1. **Application Won't Launch**: Ensure all paths are correct and the executable has the necessary permissions.
2. **Database Access Issues**: Verify that the database path is correct and the database exists.
3. **API Connection Issues**: Check that the API server is running and network connectivity is available.
4. **Data Consistency Issues**: If using direct database access, check for concurrent modifications.

For additional support, contact: yasinkansu3@gmail.com 