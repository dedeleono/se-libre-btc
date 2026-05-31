'use client';

import { deleteCookie } from 'cookies-next';
import { signOut } from '@/lib/auth-client';

export function useSignOut() {
    const handleSignOut = async () => {
        try {
            // Clear client-side accessible cookies
            deleteCookie('dashboard-auth');
            deleteCookie('needs-onboarding');
            deleteCookie('currentPaymentIntent');

            // First call our custom logout endpoint
            await fetch('/api/auth/logout');

            await signOut({
                fetchOptions: {
                    onSuccess: () => {
                        window.location.href = '/sign-in';
                    },
                },
            });
        } catch (error) {
            console.error('Error during sign out:', error);
            // Fallback redirect
            window.location.href = '/sign-in';
        }
    };

    return handleSignOut;
}
