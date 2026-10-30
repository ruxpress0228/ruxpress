import { api } from "../utils/api";
import type { PageResponse } from "../types";
import type { WishlistItem, WishToggle } from "../types/product";

const BASE = "/v1/wishlist";

export async function getWishlist(params: { page?: number; size?: number } = {}): Promise<PageResponse<WishlistItem>> {
  const q = new URLSearchParams();
  if (params.page != null) q.set("page", String(params.page));
  if (params.size != null) q.set("size", String(params.size));
  const suffix = q.toString() ? `?${q.toString()}` : "";
  const res = await api.get<PageResponse<WishlistItem>>(`${BASE}${suffix}`);
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to load wishlist");
  return res.data;
}

export async function getWishlistIds(): Promise<number[]> {
  const res = await api.get<number[]>(`${BASE}/ids`);
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to load wishlist");
  return res.data;
}

export async function addWish(productId: number): Promise<WishToggle> {
  const res = await api.post<WishToggle>(`${BASE}/${productId}`, {});
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to save");
  return res.data;
}

export async function removeWish(productId: number): Promise<WishToggle> {
  const res = await api.delete<WishToggle>(`${BASE}/${productId}`);
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to remove");
  return res.data;
}
