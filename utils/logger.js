export class Logger {
  static info(message) {
    console.log(message);
  }
  
  static error(message, error = null) {
    console.error(`ERROR: ${message}`);
    if (error) console.error('Details:', error.message);
  }
  
  static progress(count, stats) {
    console.log(`[${count}] Media: ${stats.mediaCoverage}% | Rooms: ${stats.roomsCoverage}% | OpenHouse: ${stats.openHouseCoverage}%`);
  }
  
  static stats(stats) {
    console.log('\n=== FINAL RESULTS ===');
    console.log(`Properties: ${stats.totalProperties}`);
    console.log(`Media: ${stats.totalMedia} (${stats.mediaCoverage}% coverage)`);
    console.log(`Rooms: ${stats.totalRooms} (${stats.roomsCoverage}% coverage)`);
    console.log(`OpenHouse: ${stats.totalOpenHouse} (${stats.openHouseCoverage}% coverage)`);
    console.log('====================');
  }
}