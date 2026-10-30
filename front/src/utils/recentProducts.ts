import { STORAGE_KEYS } from "./constants";
import type { Product } from "../types/product";

const MAX_RECENT = 12;
const MAX_SEARCHES = 8;

/** Enough of a product to draw a card without another request. */
export type RecentProduct = Pick<Product, "id" | "name" | "shopName" | "priceKrw" | "imageUrl"> & { seenAt: string };

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or a full store: the feature degrades to nothing.
  }
}

export function readRecentProducts(): RecentProduct[] {
  const list = readJson<RecentProduct[]>(STORAGE_KEYS.RECENT_PRODUCTS, []);
  return Array.isArray(list) ? list.filter((p) => p && typeof p.id === "number") : [];
}

/** Moves (or adds) the product to the front of the recently-viewed list. */
export function rememberProduct(product: Product): void {
  const entry: RecentProduct = {
    id: product.id,
    name: product.name,
    shopName: product.shopName,
    priceKrw: product.priceKrw,
    imageUrl: product.imageUrl,
    seenAt: new Date().toISOString(),
  };
  const rest = readRecentProducts().filter((p) => p.id !== product.id);
  writeJson(STORAGE_KEYS.RECENT_PRODUCTS, [entry, ...rest].slice(0, MAX_RECENT));
}

export function readRecentSearches(): string[] {
  const list = readJson<string[]>(STORAGE_KEYS.RECENT_SEARCHES, []);
  return Array.isArray(list) ? list.filter((s) => typeof s === "string" && s.trim()) : [];
}

export function rememberSearch(term: string): void {
  const clean = term.trim();
  if (!clean) return;
  const rest = readRecentSearches().filter((s) => s.toLowerCase() !== clean.toLowerCase());
  writeJson(STORAGE_KEYS.RECENT_SEARCHES, [clean, ...rest].slice(0, MAX_SEARCHES));
}

export function clearRecentSearches(): void {
  writeJson(STORAGE_KEYS.RECENT_SEARCHES, []);
}

/** A product registered within the last two weeks counts as new. */
export function isNewProduct(createdAt: string, now = Date.now()): boolean {
  const t = new Date(createdAt).getTime();
  return Number.isFinite(t) && now - t < 14 * 24 * 60 * 60 * 1000;
}
