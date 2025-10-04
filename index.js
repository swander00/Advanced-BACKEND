import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { runSequentialSync } from './sync/sequential.js';
import { parseArgs } from './utils/args.js';

dotenv.config({ path: './environment.env' });

// ===============================================================================================
// [1] EXPRESS SERVER SETUP
// ===============================================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static('public'));

// CORS - Allow dashboard to call API from any origin
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// [1.1] Serve Dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// [1.2] Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'TRREB Sync Service'
  });
});

// [1.3] Trigger Sync Endpoint (for dashboard buttons)
app.post('/trigger-sync', async (req, res) => {
  const { type = 'IDX', reset = false, limit = null } = req.body;
  
  console.log(`Manual sync triggered: ${type} | Reset: ${reset} | Limit: ${limit}`);
  
  // Send immediate response
  res.json({ 
    success: true, 
    message: `${type} sync triggered`,
    timestamp: new Date().toISOString()
  });
  
  // Run sync in background (don't await)
  runSyncInBackground({ syncType: type, reset, limit });
});

// [1] END

// ===============================================================================================
// [2] SYNC EXECUTION FUNCTIONS
// ===============================================================================================

async function runSyncInBackground(args) {
  try {
    console.log(`\nTRREB Sequential Sync Starting`);
    console.log(`Mode: ${args.syncType} | Limit: ${args.limit || 'none'}\n`);

    // Use the imported function directly
    await runSequentialSync(args);
    
    console.log('SUCCESS: Sync completed!');
  } catch (error) {
    console.error('\nERROR: Sync failed');
    console.error(error.message);
    if (error.stack) console.error(error.stack);
  }
}

// [2] END

// ===============================================================================================
// [3] SERVER STARTUP
// ===============================================================================================

const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`TRREB Sync Service running on port ${PORT}`);
  console.log(`Dashboard: http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  
  // Check if running as cron or manual mode
  const args = parseArgs();
  if (process.env.RUN_SYNC_ON_START === 'true') {
    console.log('\nAuto-sync enabled - starting initial sync...');
    runSyncInBackground(args);
  } else {
    console.log('\nWaiting for manual trigger or cron schedule...');
  }
});

// [3] END