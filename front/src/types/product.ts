export type ProductStatus = "ACTIVE" | "HIDDEN";

/** Catalogue ordering understood by the public list endpoint. */
export type ProductSort = "recommended" | "latest" | "popular" | "priceAsc" | "priceDesc";
export const PRODUCT_SORTS: ProductSort[] = ["recommended", "latest", "popular", "priceAsc", "priceDesc"];

/** Admin-curated product shown in the public catalogue. */
export interface Product {
  id: number;
  name: string;
  shopName: string;
  productUrl: string;
  priceKrw: number;
  category: string | null;
  description: string | null;
  /** Browser-viewable image URL, or null when no image was uploaded. */
  imageUrl: string | null;
  imageFilename: string | null;
  status: ProductStatus;
  isFeatured: boolean;
  sortOrder: number;
  /** Times the public product page was opened. */
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

/** One saved product on a member's wishlist. */
export interface WishlistItem {
  id: number;
  product: Product;
  createdAt: string;
}

export interface WishToggle {
  productId: number;
  wished: boolean;
  /** Wishlist size after the change. */
  count: number;
}

export interface ProductRequest {
  name: string;
  shopName: string;
  productUrl: string;
  priceKrw: number;
  category?: string | null;
  description?: string | null;
  status?: ProductStatus;
  isFeatured?: boolean;
  sortOrder?: number;
}
