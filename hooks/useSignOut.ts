'use client';

import { signOut } from 'next-auth/react';
import { deleteCookie } from 'cookies-next';

export function useSignOut() {
    const handleSignOut = async () => {
        try {
            // Clear client-side accessible cookies
            deleteCookie('dashboard-auth');
            deleteCookie('needs-onboarding');
            deleteCookie('currentPaymentIntent');

            // First call our custom logout endpoint
            await fetch('/api/auth/logout');

            // Then perform NextAuth signOut
            await signOut({
                callbackUrl: '/sign-in',
                redirect: true
            });
        } catch (error) {
            console.error('Error during sign out:', error);
            // Fallback redirect
            window.location.href = '/sign-in';
        }
    };

    return handleSignOut;
}