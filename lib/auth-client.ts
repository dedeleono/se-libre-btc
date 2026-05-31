"use client";

import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";

const DEFAULT_AUTH_REDIRECT = "/api/auth/post-login";

function getSafeClientCallbackUrl(callbackUrl?: string | null) {
  if (!callbackUrl) return null;

  try {
    const url = new URL(callbackUrl, window.location.origin);
    if (url.origin !== window.location.origin) return null;

    const value = `${url.pathname}${url.search}${url.hash}`;
    if (value === "/sign-in" || value.startsWith("/api/auth")) {
      return null;
    }

    return value;
  } catch {
    return null;
  }
}

export const authClient = createAuthClient({
  plugins: [magicLinkClient()],
});

export const useSession = authClient.useSession;

export function getAuthCallbackUrl(callbackUrl?: string | null) {
  return getSafeClientCallbackUrl(callbackUrl) ?? DEFAULT_AUTH_REDIRECT;
}

export async function signInWithMagicLink(email: string, callbackUrl?: string | null) {
  return authClient.signIn.magicLink({
    email,
    name: email,
    callbackURL: getAuthCallbackUrl(callbackUrl),
    newUserCallbackURL: DEFAULT_AUTH_REDIRECT,
    errorCallbackURL: "/sign-in",
  });
}

export async function signInWithGoogle(callbackUrl?: string | null) {
  return authClient.signIn.social({
    provider: "google",
    callbackURL: getAuthCallbackUrl(callbackUrl),
    newUserCallbackURL: DEFAULT_AUTH_REDIRECT,
    errorCallbackURL: "/sign-in",
  });
}

export const signOut = authClient.signOut;

export async function updateUser(data: { name?: string; image?: string | null }) {
  return authClient.updateUser(data);
}
