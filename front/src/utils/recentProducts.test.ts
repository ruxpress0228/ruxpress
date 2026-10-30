import { beforeEach, describe, expect, it } from "vitest";
import {
  clearRecentSearches,
  isNewProduct,
  readRecentProducts,
  readRecentSearches,
  rememberProduct,
  rememberSearch,
} from "./recentProducts";
import type { Product } from "../types/product";

const product = (id: number): Product => ({
  id,
  name: `P${id}`,
  shopName: "Shop",
  productUrl: "https://example.com",
  priceKrw: 1000 * id,
  category: null,
  description: null,
  imageUrl: null,
  imageFilename: null,
  status: "ACTIVE",
  isFeatured: false,
  sortOrder: 0,
  viewCount: 0,
  createdAt: "2026-10-01T00:00:00",
  updatedAt: "2026-10-01T00:00:00",
});

describe("recent products", () => {
  beforeEach(() => localStorage.clear());

  it("keeps the most recent first, without duplicates, capped at twelve", () => {
    for (let i = 1; i <= 14; i++) rememberProduct(product(i));
    rememberProduct(product(3));
    const ids = readRecentProducts().map((p) => p.id);
    expect(ids[0]).toBe(3);
    expect(ids).toHaveLength(12);
    expect(new Set(ids).size).toBe(12);
  });

  it("survives a corrupt store", () => {
    localStorage.setItem("ruxpress_recent_products", "{not json");
    expect(readRecentProducts()).toEqual([]);
  });
});

describe("recent searches", () => {
  beforeEach(() => localStorage.clear());

  it("dedupes case-insensitively and ignores blanks", () => {
    rememberSearch("  ");
    rememberSearch("Essence");
    rememberSearch("essence");
    rememberSearch("shoes");
    // Most recent first; the second "essence" replaced the first instead of duplicating it.
    expect(readRecentSearches()).toEqual(["shoes", "essence"]);
    clearRecentSearches();
    expect(readRecentSearches()).toEqual([]);
  });
});

describe("isNewProduct", () => {
  it("is true within two weeks and false after", () => {
    const now = new Date("2026-10-30T00:00:00Z").getTime();
    expect(isNewProduct("2026-10-20T00:00:00Z", now)).toBe(true);
    expect(isNewProduct("2026-10-10T00:00:00Z", now)).toBe(false);
    expect(isNewProduct("not a date", now)).toBe(false);
  });
});
