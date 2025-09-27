import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

// Create Supabase client with environment variables
export const supabase = createClient(
  environment.supabase?.url || 'https://placeholder.supabase.co',
  environment.supabase?.anonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce' // Use PKCE flow for better security
    },
    realtime: {
      params: {
        eventsPerSecond: 2
      }
    }
  }
);

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any): string => {
  if (error?.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Configuration for different environments
export const supabaseConfig = {
  url: environment.supabase?.url || 'YOUR_SUPABASE_URL',
  anonKey: environment.supabase?.anonKey || 'YOUR_SUPABASE_ANON_KEY',
  
  // Service role key (only use server-side for admin operations)
  serviceRoleKey: environment.supabase?.serviceRoleKey || 'YOUR_SERVICE_ROLE_KEY',
  
  // Database configuration
  database: {
    schema: 'public',
    // Connection pooling settings for production
    pooling: {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  },
  
  // Storage configuration for file uploads
  storage: {
    buckets: {
      avatars: 'avatars',
      vehiclePhotos: 'vehicle-photos',
      beforeAfterPhotos: 'before-after-photos'
    }
  }
};

// Type-safe database client
export type AppSupabaseClient = typeof supabase;
