import { Logger } from '../utils/logger.js';

export class APIClient {
  constructor() {
    this.rateLimitDelay = 60000 / (parseInt(process.env.AMPRE_RATE_LIMIT_PER_MINUTE) || 120);
    this.lastRequestTime = 0;
  }

  async makeRequest(url, token) {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      // Get response body for better error details
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText}\nURL: ${url}\nResponse: ${errorText}`);
    }

    const data = await response.json();
    return data.value || [];
  }

  async fetchProperties(cursor, batchSize, syncType = 'IDX') {
    const token = syncType === 'IDX' ? process.env.IDX_TOKEN : process.env.VOW_TOKEN;
    const baseUrl = syncType === 'IDX' ? process.env.IDX_URL : process.env.VOW_URL;
    
    // Replace cursor placeholders if they exist in URL
    let url = baseUrl
      .replace(/@lastTimestamp/g, cursor.lastTimestamp)
      .replace(/@lastKey/g, cursor.lastKey);
    
    // Add batch size
    url += url.includes('?') ? '&' : '?';
    url += `$top=${batchSize}`;

    // Debug: log the full URL
    console.log('DEBUG: Full URL:', url);
    
    return await this.makeRequest(url, token);
  }

  async fetchMediaForProperty(propertyKey) {
    const token = process.env.IDX_TOKEN;
    
    // Simple direct filter construction
    const filter = `ResourceRecordKey eq '${propertyKey}' and ImageSizeDescription eq 'Largest'`;
    const url = `https://query.ampre.ca/odata/Media?$filter=${encodeURIComponent(filter)}&$top=500`;
    
    return await this.makeRequest(url, token);
  }
}