import dotenv from 'dotenv';
import { SequentialSync } from './sync/sequential.js';
import { parseArgs } from './utils/args.js';

dotenv.config({ path: './environment.env' });

async function main() {
  const args = parseArgs();
  
  console.log(`TRREB Sequential Sync Starting`);
  console.log(`Mode: ${args.syncType} | Limit: ${args.limit || 'none'}\n`);

  try {
    const sync = new SequentialSync();
    const results = await sync.run(args);
    
    if (results.mediaCoverage >= 95) {
      console.log('SUCCESS: Excellent media coverage achieved!');
    } else {
      console.log('WARNING: Media coverage below 95%');
    }
    
  } catch (error) {
    console.error('\nERROR: Sync failed');
    console.error(error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

main();