import dotenv from 'dotenv';
import { SequentialSync } from './sync/sequential.js';
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
    const idxSync = new SequentialSync();
    const idxResults = await idxSync.run({
      limit: args.limit,
      syncType: 'IDX',
      reset: args.reset,
      totalExpected: idxCount // Pass to sync for progress tracking
    });
    
    console.log('\n>>> IDX Sync Complete!');
    console.log(`    Properties: ${idxResults.totalProperties}`);
    console.log(`    Media: ${idxResults.totalMedia}`);
    console.log(`    Rooms: ${idxResults.totalRooms}`);
    console.log(`    OpenHouse: ${idxResults.totalOpenHouse}\n`);
    
    // [3] Sync VOW
    console.log('>>> Starting VOW Sync...\n');
    const vowSync = new SequentialSync();
    const vowResults = await vowSync.run({
      limit: args.limit,
      syncType: 'VOW',
      reset: args.reset,
      totalExpected: vowCount // Pass to sync for progress tracking
    });
    
    console.log('\n>>> VOW Sync Complete!');
    console.log(`    Properties: ${vowResults.totalProperties}`);
    console.log(`    Media: ${vowResults.totalMedia}`);
    console.log(`    Rooms: ${vowResults.totalRooms}`);
    console.log(`    OpenHouse: ${vowResults.totalOpenHouse}\n`);
    
    // [4] Combined summary
    const totalProperties = idxResults.totalProperties + vowResults.totalProperties;
    const totalMedia = idxResults.totalMedia + vowResults.totalMedia;
    const totalRooms = idxResults.totalRooms + vowResults.totalRooms;
    const totalOpenHouse = idxResults.totalOpenHouse + vowResults.totalOpenHouse;
    const totalTime = ((Date.now() - totalStart) / 1000 / 60).toFixed(2);
    
    console.log('========================================');
    console.log('COMBINED SYNC RESULTS');
    console.log('========================================');
    console.log(`Total Properties: ${totalProperties.toLocaleString()}`);
    console.log(`Total Media:      ${totalMedia.toLocaleString()}`);
    console.log(`Total Rooms:      ${totalRooms.toLocaleString()}`);
    console.log(`Total OpenHouse:  ${totalOpenHouse.toLocaleString()}`);
    console.log(`Total Time:       ${totalTime} minutes`);
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