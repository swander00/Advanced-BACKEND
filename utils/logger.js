// ===============================================================================================
// LOGGER UTILITY
// ===============================================================================================
// Provides formatted console logging for sync operations
// ===============================================================================================

export class Logger {
  // [1] Info Level Logging
  static info(message) {
    console.log(message);
  }
  // [1] End

  // [2] Success Level Logging
  static success(message) {
    console.log(`✓ ${message}`);
  }
  // [2] End

  // [3] Warning Level Logging
  static warn(message) {
    console.warn(`⚠ ${message}`);
  }
  // [3] End

  // [4] Error Level Logging
  static error(message, error = null) {
    console.error(`ERROR: ${message}`);
    if (error) console.error('Details:', error.message);
  }
  // [4] End

  // [5] Progress Logging - Updated to match sequential.js call signature
  static progress(processedCount, totalCount, listingKey, syncType, childCounts) {
    const progress = `# ${processedCount.toLocaleString().padStart(7)} / ${totalCount.toLocaleString()}`;
    const key = `| ${listingKey.padEnd(10)}`;
    const type = `| ${syncType.padEnd(3)}`;
    const property = `| Property (${childCounts.property})`;
    const media = `| Media (${childCounts.media.toString().padStart(3)})`;
    const rooms = `| Rooms (${childCounts.rooms.toString().padStart(2)})`;
    const openHouse = `| OpenHouse (${childCounts.openHouse})`;
    
    console.log(`${progress} ${key} ${type} ${property} ${media} ${rooms} ${openHouse}`);
  }
  // [5] End

  // [6] Final Statistics Logging
  static stats(stats) {
    console.log('\n=== FINAL RESULTS ===');
    console.log(`Properties: ${stats.totalProperties}`);
    console.log(`Media: ${stats.totalMedia} (${stats.mediaCoverage}% coverage)`);
    console.log(`Rooms: ${stats.totalRooms} (${stats.roomsCoverage}% coverage)`);
    console.log(`OpenHouse: ${stats.totalOpenHouse} (${stats.openHouseCoverage}% coverage)`);
    console.log('====================');
  }
  // [6] End
}