import { cookies } from 'next/headers';

import { CookieOptions, createServerClient } from '@supabase/ssr';

export function createSsrClient() {
    const cookieStore = cookies()

    return createServerClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    cookieStore.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    cookieStore.delete({ name, ...options })
                },
            },
            auth: {
                persistSession: false,
                autoRefreshToken: false
            }
        }
    )
}
