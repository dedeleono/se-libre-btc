import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'missing-anon-key';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'missing-service-role-key';

// Create a client for client-side operations
export const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
        realtime: {
            params: {
                eventsPerSecond: 10
            }
        },
        auth: {
            persistSession: true,
            autoRefreshToken: true,
        }
    }
);

// Create a client with service role for server-side operations
export const supabaseAdmin = createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);
