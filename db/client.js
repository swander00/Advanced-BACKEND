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

export async function upsertProperty(property) {
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
}

export async function upsertMedia(mediaRecords) {
  if (mediaRecords.length === 0) return 0;
  
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
}