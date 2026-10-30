export type ProductStatus = "ACTIVE" | "HIDDEN";

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
  createdAt: string;
  updatedAt: string;
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
