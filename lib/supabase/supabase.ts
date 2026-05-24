import { createClient } from '@supabase/supabase-js';

// Helper function to validate environment variables
function validateEnvVar(name: string, value: string | undefined): string {
    if (!value) {
        throw new Error(`Missing environment variable: ${name}`);
    }
    return value;
}

// Validate and get environment variables
const supabaseUrl = validateEnvVar(
    'SUPABASE_URL',
    process.env.SUPABASE_URL
);

const supabaseAnonKey = validateEnvVar(
    'SUPABASE_ANON_KEY',
    process.env.SUPABASE_ANON_KEY
);

const supabaseServiceRoleKey = validateEnvVar(
    'SUPABASE_SERVICE_ROLE_KEY',
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
