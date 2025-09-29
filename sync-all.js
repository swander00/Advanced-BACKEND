import dotenv from 'dotenv';
import { runSequentialSync } from './sync/sequential.js';
import { parseArgs } from './utils/args.js';
import { fetchPropertyCount } from './services/api.js';

dotenv.config({ path: './environment.env' });

async function main() {
  const args = parseArgs();
  
  console.log('========================================');
  console.log('TRREB Complete Sync (IDX + VOW)');
  console.log('========================================\n');
  
  const totalStart = Date.now();
  
  try {
    // [1] Fetch counts for both IDX and VOW upfront
    console.log('>>> Fetching total counts...\n');
    
    const idxCount = await fetchPropertyCount('IDX', '2024-01-01T00:00:00Z', '0');
    const vowCount = await fetchPropertyCount('VOW', '2024-01-01T00:00:00Z', '0');
    const totalCount = idxCount + vowCount;
    
    console.log(`IDX Properties: ${idxCount.toLocaleString()}`);
    console.log(`VOW Properties: ${vowCount.toLocaleString()}`);
    console.log(`TOTAL Properties: ${totalCount.toLocaleString()}\n`);
    
    // [2] Sync IDX
    console.log('>>> Starting IDX Sync...\n');
    await runSequentialSync({
      limit: args.limit,
      syncType: 'IDX',
      reset: args.reset
    });
    
    console.log('\n>>> IDX Sync Complete!\n');
    
    // [3] Sync VOW
    console.log('>>> Starting VOW Sync...\n');
    await runSequentialSync({
      limit: args.limit,
      syncType: 'VOW',
      reset: args.reset
    });
    
    console.log('\n>>> VOW Sync Complete!\n');
    
    const totalTime = ((Date.now() - totalStart) / 1000 / 60).toFixed(2);
    
    console.log('========================================');
    console.log('COMBINED SYNC COMPLETE');
    console.log('========================================');
    console.log(`Total Time: ${totalTime} minutes`);
    console.log('========================================\n');
    
    console.log('SUCCESS: All syncs completed!');
    
  } catch (error) {
    console.error('\nSYNC FAILED');
    console.error(error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

main();