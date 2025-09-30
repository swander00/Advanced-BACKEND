// ===============================================================================================
// COMBINED SYNC ORCHESTRATOR (IDX + VOW)
// ===============================================================================================
// Runs both IDX and VOW syncs sequentially with progress tracking and database status
// ===============================================================================================

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { runSequentialSync } from './sync/sequential.js';
import { parseArgs } from './utils/args.js';
import { fetchPropertyCount } from './services/api.js';

dotenv.config({ path: './environment.env' });

// ===============================================================================================
// [1] HELPER FUNCTION - GET EXISTING DATABASE RECORDS
// ===============================================================================================

async function getExistingRecordCount() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const { count: propertyCount } = await supabase
    .from('Property')
    .select('*', { count: 'exact', head: true });
  
  return propertyCount || 0;
}

// ===============================================================================================
// [1] END
// ===============================================================================================


// ===============================================================================================
// [2] MAIN FUNCTION
// ===============================================================================================

async function main() {
  const args = parseArgs();
  
  console.log('========================================');
  console.log('TRREB Complete Sync (IDX + VOW)');
  console.log('========================================\n');
  
  const totalStart = Date.now();
  
  try {
    // [2.1] Fetch counts for both IDX and VOW upfront
    console.log('>>> Fetching total counts...\n');
    
    const idxCount = await fetchPropertyCount('IDX', '2024-01-01T00:00:00Z', '0');
    const vowCount = await fetchPropertyCount('VOW', '2024-01-01T00:00:00Z', '0');
    const totalCount = idxCount + vowCount;
    
    console.log(`IDX Properties: ${idxCount.toLocaleString()}`);
    console.log(`VOW Properties: ${vowCount.toLocaleString()}`);
    console.log(`TOTAL Properties: ${totalCount.toLocaleString()}`);
    
    // [2.2] Get existing database count
    const existingRecords = await getExistingRecordCount();
    console.log(`\nAlready in database: ${existingRecords.toLocaleString()}`);
    console.log(`Remaining to sync: ${(totalCount - existingRecords).toLocaleString()}\n`);
    // [2.2] End
    
    // [2.3] Sync IDX
    console.log('>>> Starting IDX Sync...\n');
    await runSequentialSync({
      limit: args.limit,
      syncType: 'IDX',
      reset: args.reset
    });
    
    console.log('\n>>> IDX Sync Complete!\n');
    // [2.3] End
    
    // [2.4] Sync VOW
    console.log('>>> Starting VOW Sync...\n');
    await runSequentialSync({
      limit: args.limit,
      syncType: 'VOW',
      reset: args.reset
    });
    
    console.log('\n>>> VOW Sync Complete!\n');
    // [2.4] End
    
    // [2.5] Final summary
    const totalTime = ((Date.now() - totalStart) / 1000 / 60).toFixed(2);
    const finalCount = await getExistingRecordCount();
    
    console.log('========================================');
    console.log('COMBINED SYNC COMPLETE');
    console.log('========================================');
    console.log(`Total Records in Database: ${finalCount.toLocaleString()}`);
    console.log(`Records Added This Run: ${(finalCount - existingRecords).toLocaleString()}`);
    console.log(`Total Time: ${totalTime} minutes`);
    console.log('========================================\n');
    
    console.log('SUCCESS: All syncs completed!');
    // [2.5] End
    
  } catch (error) {
    console.error('\nSYNC FAILED');
    console.error(error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

// ===============================================================================================
// [2] END
// ===============================================================================================

main();