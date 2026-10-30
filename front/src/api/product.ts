import { api } from "../utils/api";
import type { PageResponse } from "../types";
import type { Product, ProductRequest, ProductStatus } from "../types/product";

const PUBLIC_BASE = "/v1/products";
const ADMIN_BASE = "/v1/admin/products";

function query(params: Record<string, string | number | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

// ─── Public ───────────────────────────────────────────────

export async function getProducts(params: {
  page?: number;
  size?: number;
  category?: string | null;
  keyword?: string;
}): Promise<PageResponse<Product>> {
  const res = await api.get<PageResponse<Product>>(`${PUBLIC_BASE}${query(params)}`);
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to load products");
  return res.data;
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  const res = await api.get<Product[]>(`${PUBLIC_BASE}/featured${query({ limit })}`);
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to load products");
  return res.data;
}

export async function getProductCategories(): Promise<string[]> {
  const res = await api.get<string[]>(`${PUBLIC_BASE}/categories`);
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to load categories");
  return res.data;
}

export async function getProduct(id: number): Promise<Product> {
  const res = await api.get<Product>(`${PUBLIC_BASE}/${id}`);
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Product not found");
  return res.data;
}

// ─── Admin ────────────────────────────────────────────────

export async function adminListProducts(params: {
  page?: number;
  size?: number;
  keyword?: string;
  status?: ProductStatus | "";
}): Promise<PageResponse<Product>> {
  const res = await api.get<PageResponse<Product>>(`${ADMIN_BASE}${query(params)}`);
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to load products");
  return res.data;
}

export async function adminCreateProduct(body: ProductRequest): Promise<Product> {
  const res = await api.post<Product>(ADMIN_BASE, body);
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to create product");
  return res.data;
}

export async function adminUpdateProduct(id: number, body: ProductRequest): Promise<Product> {
  const res = await api.put<Product>(`${ADMIN_BASE}/${id}`, body);
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to update product");
  return res.data;
}

export async function adminDeleteProduct(id: number): Promise<void> {
  const res = await api.delete<null>(`${ADMIN_BASE}/${id}`);
  if (res.code !== 200) throw new Error(res.message || "Failed to delete product");
}

export async function adminUploadProductImage(id: number, file: File): Promise<Product> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await api.upload<Product>(`${ADMIN_BASE}/${id}/image`, fd);
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to upload image");
  return res.data;
}

export async function adminDeleteProductImage(id: number): Promise<Product> {
  const res = await api.delete<Product>(`${ADMIN_BASE}/${id}/image`);
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to remove image");
  return res.data;
}

/** Query string that pre-fills the purchase request form from a product. */
export function purchaseRequestPathFor(product: Product): string {
  const q = new URLSearchParams({
    name: product.name,
    url: product.productUrl,
    shop: product.shopName,
    price: String(product.priceKrw),
  });
  return `/purchase/new?${q.toString()}`;
}
