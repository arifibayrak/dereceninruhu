"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Browser auth client. Sign-in uses the phone-derived internal email
 * (see phoneToEmail in ./auth) with the PIN as password — the login UI
 * converts phone → email before calling signIn.email.
 */
export const authClient = createAuthClient();

export const { signIn, signOut, useSession } = authClient;
