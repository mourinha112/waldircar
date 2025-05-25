import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';

// Supabase URL and anon key
// Fixed URL format to ensure proper connection (remove any trailing slashes)
export const supabaseUrl = 'https://jwiylwnwzifaenvdmnbq.supabase.co';
// Supabase anon key
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3aXlsd253emlmYWVudmRtbmJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzIyMDQsImV4cCI6MjA2MzQ0ODIwNH0.dNhfG_rgcIYxY6d7zqQ7Yhr8MKp4ZwPZ4Ajm2oMumF4';
// Supabase service key (mesma que a anon key por enquanto)
export const supabaseServiceKey = supabaseAnonKey;

// Debug flag - set to true to enable logging
const DEBUG = true;

// Create a custom logger that only logs in debug mode
const logger = {
  log: (...args: any[]) => {
    if (DEBUG) console.log(...args);
  },
  error: (...args: any[]) => {
    if (DEBUG) console.error(...args);
  }
};

// Override fetch for React Native environment
// This is necessary because React Native's fetch implementation 
// can sometimes cause issues with Supabase
const customFetch = async (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
  logger.log(`[FETCH] Request to: ${typeof url === 'string' ? url : url.toString()}`);
  
  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    // Create options with signal
    const fetchOptions = {
      ...options,
      signal: controller.signal,
      headers: {
        ...options?.headers,
        'X-Client-Info': 'react-native',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    
    // Perform fetch
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);
    
    logger.log(`[FETCH] Response: ${response.status} ${response.statusText}`);
    return response;
  } catch (error: any) {
    logger.error(`[FETCH] Error: ${error.message}`);
    
    // If the error is a timeout or network error, provide a clearer message
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your internet connection.');
    }
    
    throw error;
  }
};

// Create the Supabase client with optimized settings for React Native
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: customFetch,
  },
});

// Create a service role client for admin operations (bypassing RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false,
  },
  global: {
    fetch: customFetch,
  },
});

// Retry mechanism for auth operations
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.log(`[RETRY] Attempt ${attempt}/${maxRetries}`);
      return await operation();
    } catch (error) {
      lastError = error;
      logger.error(`[RETRY] Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        const waitTime = delay * attempt;
        logger.log(`[RETRY] Waiting ${waitTime}ms before retrying...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  logger.error(`[RETRY] All ${maxRetries} attempts failed`);
  throw lastError;
};

// Helper for authenticated operations
export const authenticatedFetch = async <T>(
  operation: () => Promise<T>,
  name: string
): Promise<T> => {
  try {
    logger.log(`[SUPABASE] Starting operation: ${name}`);
    const result = await retryOperation(operation);
    logger.log(`[SUPABASE] Completed operation: ${name}`);
    return result;
  } catch (error: any) {
    logger.error(`[SUPABASE ERROR] Operation failed: ${name}`);
    logger.error('[SUPABASE ERROR] Message:', error.message);
    throw error;
  }
};

// Test network connectivity
export const debugNetworkIssues = async (): Promise<boolean> => {
  try {
    logger.log('[DEBUG] Testing general network connectivity...');
    const response = await fetch('https://www.google.com');
    logger.log(`[DEBUG] Network test succeeded: ${response.status}`);
    return true;
  } catch (error) {
    logger.error('[DEBUG] Network test failed:', error);
    return false;
  }
};

// Test Supabase connectivity specifically
export const testSupabaseConnection = async (): Promise<{success: boolean, message: string}> => {
  try {
    logger.log('[DEBUG] Testing Supabase connectivity...');
    
    // Try a simple health check request
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      logger.log('[DEBUG] Supabase connection test succeeded');
      return { 
        success: true, 
        message: 'Successfully connected to Supabase' 
      };
    } else {
      const errorText = await response.text();
      logger.error(`[DEBUG] Supabase connection test failed: ${response.status} - ${errorText}`);
      return { 
        success: false, 
        message: `Connection failed with status ${response.status}: ${errorText}` 
      };
    }
  } catch (error: any) {
    logger.error('[DEBUG] Supabase connection test error:', error);
    return { 
      success: false, 
      message: `Connection error: ${error.message}` 
    };
  }
}; 