import { APIClient } from '../services/api.js';
import { 
  upsertProperty, 
  upsertMedia, 
  upsertRooms, 
  upsertOpenHouse,
  getSyncState,
  updateSyncState,
  completeSyncState,
  failSyncState,
  resetSyncState
} from '../db/client.js';
import { mapProperty } from '../mappers/property.js';
import { mapMedia } from '../mappers/media.js';
import { mapRooms } from '../mappers/rooms.js';
import { mapOpenHouse } from '../mappers/openhouse.js';

export class SequentialSync {
  constructor() {
    this.api = new APIClient();
    this.stats = {
      totalProperties: 0,
      totalMedia: 0,
      totalRooms: 0,
      totalOpenHouse: 0,
      propertiesWithMedia: 0,
      propertiesWithRooms: 0,
      propertiesWithOpenHouse: 0,
      mediaCoverage: 0,
      roomsCoverage: 0,
      openHouseCoverage: 0
    };
    this.totalAvailable = 0;
    this.currentSyncType = 'IDX';
    this.checkpointInterval = 1000;
  }

  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  async run(options = {}) {
    const { limit, syncType = 'IDX', reset = false } = options;
    const batchSize = parseInt(process.env.BATCH_SIZE_PROPERTY) || 100;
    this.currentSyncType = syncType;
    
    console.log(`\nSequential ${syncType} sync starting (limit: ${limit || 'none'}, reset: ${reset})`);

    try {
      if (reset) {
        console.log(`Resetting sync state for ${syncType}...`);
        await resetSyncState(syncType);
        console.log('Sync state reset complete.');
      }

      const savedState = await getSyncState(syncType);
      console.log(`Resuming from last checkpoint:`);
      console.log(`  Last Timestamp: ${savedState.LastTimestamp}`);
      console.log(`  Last Key: ${savedState.LastKey}`);
      console.log(`  Previously Processed: ${this.formatNumber(savedState.TotalProcessed)}`);

      let cursor = {
        lastTimestamp: savedState.LastTimestamp,
        lastKey: savedState.LastKey
      };

      console.log('\nFetching total property count...');
      this.totalAvailable = await this.api.getTotalCount(cursor, syncType);
      console.log(`Total ${syncType} properties available: ${this.formatNumber(this.totalAvailable)}\n`);

      let processedCount = savedState.TotalProcessed || 0;
      let batchProcessedCount = 0;
      let recordsInCurrentWindow = 0;
      const WINDOW_LIMIT = 95000;

      while (true) {
        const properties = await this.api.fetchProperties(cursor, batchSize, syncType);
        
        if (properties.length === 0) {
          console.log('\nNo more properties found');
          break;
        }

        recordsInCurrentWindow += properties.length;

        if (recordsInCurrentWindow >= WINDOW_LIMIT) {
          console.log(`\n[PAGINATION] Approaching 100K limit. Resetting query window...`);
          console.log(`[PAGINATION] Records in window: ${this.formatNumber(recordsInCurrentWindow)}`);
          
          const lastProperty = properties[properties.length - 1];
          cursor.lastTimestamp = lastProperty.ModificationTimestamp;
          cursor.lastKey = '0';
          recordsInCurrentWindow = 0;
          
          console.log(`[PAGINATION] New window starts at: ${cursor.lastTimestamp}\n`);
        }

        for (const rawProperty of properties) {
          if (limit && processedCount >= limit) {
            console.log(`\nReached limit of ${limit} properties`);
            break;
          }

          processedCount++;
          batchProcessedCount++;
          const counts = await this.processProperty(rawProperty, processedCount);
          
          const index = processedCount.toString().padStart(6);
          const total = this.formatNumber(this.totalAvailable).padStart(9);
          const mls = counts.listingKey.padEnd(12);
          const type = syncType.padEnd(3);
          const media = counts.media.toString().padStart(3);
          const rooms = counts.rooms.toString().padStart(3);
          const openHouse = counts.openHouse.toString().padStart(3);
          
          console.log(
            `#${index} / ${total} | ${mls} | ${type} | ` +
            `Property (1) | Media (${media}) | Rooms (${rooms}) | OpenHouse (${openHouse})`
          );
          
          cursor.lastTimestamp = rawProperty.ModificationTimestamp;
          cursor.lastKey = rawProperty.ListingKey;

          this.updateCoverage();
          
          if (batchProcessedCount >= this.checkpointInterval) {
            await updateSyncState(syncType, cursor, processedCount);
            console.log(`\n[CHECKPOINT] Saved progress at ${this.formatNumber(processedCount)} properties`);
            console.log(`[CHECKPOINT] Cursor: ${cursor.lastTimestamp} | ${cursor.lastKey}`);
            console.log(`[CHECKPOINT] Window records: ${this.formatNumber(recordsInCurrentWindow)}\n`);
            batchProcessedCount = 0;
          }
          
          if (processedCount % 1000 === 0) {
            this.printCoverageSummary(processedCount);
          }
        }

        if (limit && processedCount >= limit) break;
        if (properties.length < batchSize) break;
      }

      await updateSyncState(syncType, cursor, processedCount);
      await completeSyncState(syncType, processedCount);

      this.updateCoverage();
      this.printFinalSummary();
      
      console.log(`\n[FINAL CHECKPOINT] Sync completed. State saved.`);
      console.log(`[FINAL CHECKPOINT] Final Cursor: ${cursor.lastTimestamp} | ${cursor.lastKey}\n`);
      
      return this.stats;

    } catch (error) {
      await failSyncState(syncType, error.message);
      throw error;
    }
  }

  async processProperty(rawProperty, index) {
    const property = mapProperty(rawProperty);
    const propertyKey = property.ListingKey;
    
    const counts = {
      listingKey: propertyKey,
      media: 0,
      rooms: 0,
      openHouse: 0
    };
    
    await upsertProperty(property);
    this.stats.totalProperties++;
    
    try {
      const rawMedia = await this.api.fetchMediaForProperty(propertyKey);
      if (rawMedia.length > 0) {
        const mappedMedia = rawMedia.map(mapMedia);
        await upsertMedia(mappedMedia);
        counts.media = mappedMedia.length;
        this.stats.totalMedia += mappedMedia.length;
        this.stats.propertiesWithMedia++;
      }
    } catch (error) {
      console.error(`ERROR: Media sync failed for ${propertyKey}: ${error.message}`);
    }
    
    try {
      const rawRooms = await this.api.fetchRoomsForProperty(propertyKey);
      if (rawRooms.length > 0) {
        const mappedRooms = rawRooms.map(mapRooms);
        await upsertRooms(mappedRooms);
        counts.rooms = mappedRooms.length;
        this.stats.totalRooms += mappedRooms.length;
        this.stats.propertiesWithRooms++;
      }
    } catch (error) {
      console.error(`ERROR: Rooms sync failed for ${propertyKey}: ${error.message}`);
    }
    
    try {
      const rawOpenHouse = await this.api.fetchOpenHouseForProperty(propertyKey);
      
      if (rawOpenHouse.length > 0) {
        const mappedOpenHouse = rawOpenHouse.map(mapOpenHouse);
        await upsertOpenHouse(mappedOpenHouse);
        counts.openHouse = mappedOpenHouse.length;
        this.stats.totalOpenHouse += mappedOpenHouse.length;
        this.stats.propertiesWithOpenHouse++;
      } else {
        counts.openHouse = 0;
      }
    } catch (error) {
      console.error(`ERROR: OpenHouse sync failed for ${propertyKey}: ${error.message}`);
      counts.openHouse = 0;
    }
    
    return counts;
  }

  updateCoverage() {
    const total = this.stats.totalProperties;
    this.stats.mediaCoverage = total > 0 ? Math.round((this.stats.propertiesWithMedia / total) * 100) : 0;
    this.stats.roomsCoverage = total > 0 ? Math.round((this.stats.propertiesWithRooms / total) * 100) : 0;
    this.stats.openHouseCoverage = total > 0 ? Math.round((this.stats.propertiesWithOpenHouse / total) * 100) : 0;
  }

  printCoverageSummary(count) {
    console.log(`\n--- Coverage after ${this.formatNumber(count)} records (${this.currentSyncType}) ---`);
    console.log(`Properties with Property:   ${this.formatNumber(this.stats.totalProperties)}/${this.formatNumber(count)} (100%)`);
    console.log(`Properties with Media:      ${this.formatNumber(this.stats.propertiesWithMedia)}/${this.formatNumber(count)} (${this.stats.mediaCoverage}%)`);
    console.log(`Properties with Rooms:      ${this.formatNumber(this.stats.propertiesWithRooms)}/${this.formatNumber(count)} (${this.stats.roomsCoverage}%)`);
    console.log(`Properties with OpenHouse:  ${this.formatNumber(this.stats.propertiesWithOpenHouse)}/${this.formatNumber(count)} (${this.stats.openHouseCoverage}%)`);
    console.log(`---\n`);
  }

  printFinalSummary() {
    console.log('\n========== FINAL SYNC RESULTS ==========');
    console.log(`Total Properties Processed: ${this.formatNumber(this.stats.totalProperties)}`);
    console.log(`Total Media Records:        ${this.formatNumber(this.stats.totalMedia)}`);
    console.log(`Total Room Records:         ${this.formatNumber(this.stats.totalRooms)}`);
    console.log(`Total OpenHouse Records:    ${this.formatNumber(this.stats.totalOpenHouse)}`);
    console.log('');
    console.log('Coverage:');
    console.log(`  Media:      ${this.stats.mediaCoverage}% (${this.formatNumber(this.stats.propertiesWithMedia)} properties)`);
    console.log(`  Rooms:      ${this.stats.roomsCoverage}% (${this.formatNumber(this.stats.propertiesWithRooms)} properties)`);
    console.log(`  OpenHouse:  ${this.stats.openHouseCoverage}% (${this.formatNumber(this.stats.propertiesWithOpenHouse)} properties)`);
    console.log('========================================\n');
  }
}