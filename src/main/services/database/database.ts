import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class DatabaseService {
  private supabase: SupabaseClient | null = null;
  private isInitialized = false;

  constructor() {
    // Constructor is lightweight now
  }

  async initialize(): Promise<void> {
    try {
      // Get Supabase configuration from environment variables
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error(
          'Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.'
        );
      }

      // Create Supabase client
      this.supabase = createClient(supabaseUrl, supabaseKey);
      
      // Test the connection
      const { error } = await this.supabase.from('service_calls').select('count', { count: 'exact', head: true });
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (expected for first run)
        console.warn('Database connection test warning:', error.message);
      }
      
      this.isInitialized = true;
      console.log('Supabase database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Supabase database:', error);
      throw error;
    }
  }

  getClient(): SupabaseClient {
    if (!this.supabase || !this.isInitialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.supabase;
  }

  async close(): Promise<void> {
    // Supabase client doesn't need explicit closing
    this.supabase = null;
    this.isInitialized = false;
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    if (!this.supabase) return false;
    
    try {
      const { error } = await this.supabase.from('service_calls').select('count', { count: 'exact', head: true });
      return !error || error.code === 'PGRST116'; // PGRST116 = table doesn't exist (acceptable)
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService(); 