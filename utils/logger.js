export class Logger {
  static info(message) {
    console.log(message);
  }
  
  static error(message, error = null) {
    console.error(`ERROR: ${message}`);
    if (error) {
      console.error('Details:', error.message);
      if (error.stack) console.error('Stack:', error.stack);
    }
  }
  
  static progress(propertyKey, mediaCount, currentCount, totalProcessed, coverage) {
    if (totalProcessed % 5 === 0 || mediaCount > 0) {
      console.log(`[${totalProcessed}] ${propertyKey}: ${mediaCount} media | Coverage: ${coverage}%`);
    }
  }
  
  static stats(stats) {
    console.log('\n=== FINAL RESULTS ===');
    console.log(`Properties: ${stats.totalProperties}`);
    console.log(`Media: ${stats.totalMedia}`);
    console.log(`Coverage: ${stats.coverage}%`);
    console.log('====================');
  }
}