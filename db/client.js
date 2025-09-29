import { createClient } from '@supabase/supabase-js';
import { Logger } from '../utils/logger.js';

let supabase = null;

export function initDB() {
  if (!supabase) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    Logger.info('Database connection initialized');
  }
  return supabase;
}

// Helper function for retries
async function retryOperation(operation, maxRetries = 3, delayMs = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        console.log(`[RETRY] Attempt ${attempt}/${maxRetries} failed. Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  
  throw lastError;
}

export async function upsertProperty(property) {
  return await retryOperation(async () => {
    const db = initDB();
    
    const { error } = await db
      .from('Property')
      .upsert(property, { 
        onConflict: 'ListingKey',
        ignoreDuplicates: false 
      });
      
    if (error) {
      throw new Error(`Property upsert failed: ${error.message}`);
    }
  });
}

export async function upsertMedia(mediaRecords) {
  if (mediaRecords.length === 0) return 0;
  
  return await retryOperation(async () => {
    const db = initDB();
    
    const { error } = await db
      .from('Media')
      .upsert(mediaRecords, { 
        onConflict: 'MediaKey',
        ignoreDuplicates: false 
      });
      
    if (error) {
      throw new Error(`Media upsert failed: ${error.message}`);
    }
    
    return mediaRecords.length;
  });
}

export async function upsertRooms(roomRecords) {
  if (roomRecords.length === 0) return 0;
  
  return await retryOperation(async () => {
    const db = initDB();
    
    const { error } = await db
      .from('PropertyRooms')
      .upsert(roomRecords, { 
        onConflict: 'RoomKey',
        ignoreDuplicates: false 
      });
      
    if (error) {
      throw new Error(`Rooms upsert failed: ${error.message}`);
    }
    
    return roomRecords.length;
  });
}

export async function upsertOpenHouse(openHouseRecords) {
  if (openHouseRecords.length === 0) return 0;
  
  return await retryOperation(async () => {
    const db = initDB();
    
    const { error } = await db
      .from('OpenHouse')
      .upsert(openHouseRecords, { 
        onConflict: 'OpenHouseKey',
        ignoreDuplicates: false 
      });
      
    if (error) {
      throw new Error(`OpenHouse upsert failed: ${error.message}`);
    }
    
    return openHouseRecords.length;
  });
}

// ===============================
// Sync State Management
// ===============================

export async function getSyncState(syncType) {
  return await retryOperation(async () => {
    const db = initDB();
    
    const { data, error } = await db
      .from('SyncState')
      .select('*')
      .eq('SyncType', syncType)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return {
          LastTimestamp: process.env.SYNC_START_DATE || '2024-01-01T00:00:00Z',
          LastKey: '0',
          TotalProcessed: 0
        };
      }
      throw new Error(`Failed to get sync state: ${error.message}`);
    }
    
    return data;
  });
}

export async function updateSyncState(syncType, cursor, totalProcessed) {
  return await retryOperation(async () => {
    const db = initDB();
    
    const { error } = await db
      .from('SyncState')
      .upsert({
        SyncType: syncType,
        LastTimestamp: cursor.lastTimestamp,
        LastKey: cursor.lastKey,
        TotalProcessed: totalProcessed,
        Status: 'running',
        LastRunStarted: new Date().toISOString()
      }, {
        onConflict: 'SyncType'
      });
    
    if (error) {
      throw new Error(`Failed to update sync state: ${error.message}`);
    }
  });
}

export async function completeSyncState(syncType, totalProcessed) {
  return await retryOperation(async () => {
    const db = initDB();
    
    const { error } = await db
      .from('SyncState')
      .update({
        TotalProcessed: totalProcessed,
        Status: 'completed',
        LastRunCompleted: new Date().toISOString()
      })
      .eq('SyncType', syncType);
    
    if (error) {
      throw new Error(`Failed to complete sync state: ${error.message}`);
    }
  });
}

export async function failSyncState(syncType, errorMessage) {
  try {
    await retryOperation(async () => {
      const db = initDB();
      
      const { error } = await db
        .from('SyncState')
        .update({
          Status: 'failed',
          LastRunCompleted: new Date().toISOString()
        })
        .eq('SyncType', syncType);
      
      if (error) {
        throw error;
      }
    });
  } catch (error) {
    console.error(`Failed to update failed sync state: ${error.message}`);
  }
}

export async function resetSyncState(syncType) {
  return await retryOperation(async () => {
    const db = initDB();
    
    const { error } = await db
      .from('SyncState')
      .upsert({
        SyncType: syncType,
        LastTimestamp: process.env.SYNC_START_DATE || '2024-01-01T00:00:00Z',
        LastKey: '0',
        TotalProcessed: 0,
        Status: 'idle',
        LastRunStarted: null,
        LastRunCompleted: null
      }, {
        onConflict: 'SyncType'
      });
    
    if (error) {
      throw new Error(`Failed to reset sync state: ${error.message}`);
    }
  });
}