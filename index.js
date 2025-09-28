import dotenv from 'dotenv';
import { SequentialSync } from './sync/sequential.js';
import { parseArgs } from './utils/args.js';
import { Logger } from './utils/logger.js';

dotenv.config({ path: './environment.env' });

async function main() {
  const args = parseArgs();
  
  Logger.info(`TRREB Sequential Sync Starting (${args.limit ? `limit: ${args.limit}` : 'full sync'})`);

  try {
    const sync = new SequentialSync();
    const results = await sync.run(args);
    
    if (results.coverage >= 95) {
      Logger.info('SUCCESS: Excellent media coverage achieved!');
    } else {
      Logger.info('WARNING: Media coverage below 95%');
    }
    
  } catch (error) {
    Logger.error('Sync failed', error);
    process.exit(1);
  }
}

main();