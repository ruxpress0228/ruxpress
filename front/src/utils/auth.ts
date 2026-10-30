import { STORAGE_KEYS } from "./constants";
import { readAuthValue } from "./api";

/** Role claim of a JWT, or null when the token cannot be read. */
export function decodeTokenRole(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const json = JSON.parse(atob(padded)) as { role?: string };
    return json.role ?? null;
  } catch {
    return null;
  }
}

export function isAdminRole(role: string | null): boolean {
  return role === "SUPER_ADMIN" || role === "COUNSELOR";
}

export type SessionKind = "user" | "admin" | null;

/** Who is signed in right now, judged from the stored token. */
export function currentSession(): SessionKind {
  const token = readAuthValue(STORAGE_KEYS.TOKEN);
  if (!token) return null;
  return isAdminRole(decodeTokenRole(token)) ? "admin" : "user";
}

/**
 * Keep only same-origin, relative, non-auth paths as a post-login destination.
 * Anything else (absolute URLs, protocol-relative, auth pages) is dropped.
 */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null;
  if (/^\/(login|signup|forgot-password|reset-password|admin)(\/|\?|$)/.test(raw)) return null;
  return raw;
}

/** The validated `next` query parameter of a location search string. */
export function readNextParam(search: string): string | null {
  return safeNextPath(new URLSearchParams(search).get("next"));
}

function withNext(base: string, next?: string | null): string {
  const safe = safeNextPath(next);
  return safe ? `${base}?next=${encodeURIComponent(safe)}` : base;
}

/** `/login`, carrying where to return to after signing in. */
export const loginPath = (next?: string | null): string => withNext("/login", next);

/** `/signup`, carrying the same return path through to the login step. */
export const signupPath = (next?: string | null): string => withNext("/signup", next);
