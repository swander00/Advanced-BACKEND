import { Logger } from '../utils/logger.js';

export class APIClient {
  constructor() {
    this.rateLimitDelay = 60000 / (parseInt(process.env.AMPRE_RATE_LIMIT_PER_MINUTE) || 120);
    this.lastRequestTime = 0;
  }

  async makeRequest(url, token) {
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
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText}\nURL: ${url}\nResponse: ${errorText}`);
    }

    const data = await response.json();
    return data.value || [];
  }

  async getTotalCount(cursor, syncType = 'IDX') {
    const token = syncType === 'IDX' ? process.env.IDX_TOKEN : process.env.VOW_TOKEN;
    const baseUrl = syncType === 'IDX' ? process.env.IDX_URL : process.env.VOW_URL;
    
    let url = baseUrl
      .replace(/@lastTimestamp/g, cursor.lastTimestamp)
      .replace(/@lastKey/g, cursor.lastKey);
    
    url += url.includes('?') ? '&' : '?';
    url += `$top=0&$count=true`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Count request failed: ${response.status}`);
    }

    const data = await response.json();
    return data['@odata.count'] || 0;
  }

  async fetchProperties(cursor, batchSize, syncType = 'IDX') {
    const token = syncType === 'IDX' ? process.env.IDX_TOKEN : process.env.VOW_TOKEN;
    const baseUrl = syncType === 'IDX' ? process.env.IDX_URL : process.env.VOW_URL;
    
    let url = baseUrl
      .replace(/@lastTimestamp/g, cursor.lastTimestamp)
      .replace(/@lastKey/g, cursor.lastKey);
    
    url += url.includes('?') ? '&' : '?';
    url += `$top=${batchSize}`;
    
    return await this.makeRequest(url, token);
  }

  async fetchMediaForProperty(propertyKey) {
    const token = process.env.IDX_TOKEN;
    const filter = `ResourceRecordKey eq '${propertyKey}' and MediaStatus eq 'Active' and ImageSizeDescription eq 'Largest'`;
    const url = `https://query.ampre.ca/odata/Media?$filter=${encodeURIComponent(filter)}&$top=500`;
    
    return await this.makeRequest(url, token);
  }

  async fetchRoomsForProperty(propertyKey) {
    const token = process.env.IDX_TOKEN;
    const baseUrl = process.env.ROOMS_URL;
    const url = baseUrl.replace('@propertyKey', propertyKey);
    
    return await this.makeRequest(url, token);
  }

  async fetchOpenHouseForProperty(propertyKey) {
    const token = process.env.IDX_TOKEN;
    const today = new Date().toISOString().split('T')[0];
    const filter = `ListingKey eq '${propertyKey}' and OpenHouseDate ge ${today}`;
    const url = `https://query.ampre.ca/odata/OpenHouse?$filter=${encodeURIComponent(filter)}&$orderby=OpenHouseKey`;
    
    return await this.makeRequest(url, token);
  }
}