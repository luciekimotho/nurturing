export const AUTH_MODE = (import.meta.env.VITE_AUTH_MODE ?? "header").toLowerCase();

export const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export const isClerkAuth = AUTH_MODE === "clerk";
