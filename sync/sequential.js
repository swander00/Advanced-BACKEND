import { APIClient } from '../services/api.js';
import { upsertProperty, upsertMedia } from '../db/client.js';
import { mapProperty } from '../mappers/property.js';
import { mapMedia } from '../mappers/media.js';
import { Logger } from '../utils/logger.js';

export class SequentialSync {
  constructor() {
    this.api = new APIClient();
    this.stats = {
      totalProperties: 0,
      totalMedia: 0,
      propertiesWithMedia: 0,
      coverage: 0
    };
  }

  async run(options = {}) {
    const { limit } = options;
    const batchSize = parseInt(process.env.BATCH_SIZE_PROPERTY) || 100;
    
    Logger.info(`Sequential sync starting (limit: ${limit || 'none'})`);

    let cursor = {
      lastTimestamp: process.env.SYNC_START_DATE || '1970-01-01T00:00:00Z',
      lastKey: '0'
    };

    let processedCount = 0;

    while (true) {
      const properties = await this.api.fetchProperties(cursor, batchSize);
      
      if (properties.length === 0) {
        Logger.info('No more properties found');
        break;
      }

      Logger.info(`Processing batch of ${properties.length} properties...`);

      for (const rawProperty of properties) {
        if (limit && processedCount >= limit) {
          Logger.info(`Reached limit of ${limit} properties`);
          break;
        }

        const mediaCount = await this.processProperty(rawProperty);
        processedCount++;
        
        cursor.lastTimestamp = rawProperty.ModificationTimestamp;
        cursor.lastKey = rawProperty.ListingKey;

        this.updateCoverage();
        Logger.progress(
          rawProperty.ListingKey, 
          mediaCount, 
          processedCount, 
          this.stats.totalProperties, 
          this.stats.coverage
        );
      }

      if (limit && processedCount >= limit) break;
      if (properties.length < batchSize) break;
    }

    this.updateCoverage();
    Logger.stats(this.stats);
    return this.stats;
  }

  async processProperty(rawProperty) {
    const property = mapProperty(rawProperty);
    
    await upsertProperty(property);
    this.stats.totalProperties++;
    
    const rawMedia = await this.api.fetchMediaForProperty(property.ListingKey);
    
    let mediaCount = 0;
    if (rawMedia.length > 0) {
      const mappedMedia = rawMedia.map(mapMedia);
      await upsertMedia(mappedMedia);
      this.stats.totalMedia += mappedMedia.length;
      this.stats.propertiesWithMedia++;
      mediaCount = mappedMedia.length;
    }
    
    return mediaCount;
  }

  updateCoverage() {
    this.stats.coverage = this.stats.totalProperties > 0 
      ? Math.round((this.stats.propertiesWithMedia / this.stats.totalProperties) * 100)
      : 0;
  }
}