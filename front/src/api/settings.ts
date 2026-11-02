import { api } from "../utils/api";

/** Public storefront settings the landing reads (GET /v1/settings/hero). */
export interface HeroSettings {
  /** Browser-openable URL of the admin's own hero image, or null to show the default artwork. */
  imageUrl: string | null;
}

export async function getHeroSettings(): Promise<HeroSettings> {
  const res = await api.get<HeroSettings>("/v1/settings/hero");
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to load hero settings");
  return res.data;
}

export async function adminUploadHeroImage(file: File): Promise<HeroSettings> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await api.upload<HeroSettings>("/v1/admin/settings/hero-image", fd);
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to upload hero image");
  return res.data;
}

export async function adminRemoveHeroImage(): Promise<HeroSettings> {
  const res = await api.delete<HeroSettings>("/v1/admin/settings/hero-image");
  if (res.code !== 200 || res.data == null) throw new Error(res.message || "Failed to remove hero image");
  return res.data;
}
