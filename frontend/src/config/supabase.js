import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 'https://oahnrywyhuhjncibeuq.supabase.co';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9haG5yZXd5aHVoam5jaWJldWlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDY3MTgyNCwiZXhwIjoyMDY2MjQ3ODI0fQ.WzMTygdy6w_h0ZtTW0ycnGGqmqFYMHH1X8sJnLSp4Wc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: {
      getItem: (key) => {
        // Implement secure storage for tokens
        return null;
      },
      setItem: (key, value) => {
        // Implement secure storage for tokens
      },
      removeItem: (key) => {
        // Implement secure storage for tokens
      },
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase; 