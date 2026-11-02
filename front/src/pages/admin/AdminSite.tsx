import { useEffect, useRef, useState } from "react";
import { ExternalLink, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { FormSection, LoadingState, PageHeader } from "../../components/page";
import { HeroArtwork } from "../../components/landing/HeroArtwork";
import { adminRemoveHeroImage, adminUploadHeroImage, getHeroSettings } from "../../api/settings";
import { useTranslation } from "../../hooks/useTranslation";

/** Storefront settings: today the landing hero image (the default artwork or the admin's own picture). */
export default function AdminSite() {
  const { t } = useTranslation();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getHeroSettings()
      .then((s) => setImageUrl(s.imageUrl))
      .catch(() => toast.error(t("admin.site.toast.loadError")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const s = await adminUploadHeroImage(file);
      setImageUrl(s.imageUrl);
      toast.success(t("admin.site.hero.uploaded"));
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : t("admin.site.toast.uploadError"));
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    try {
      const s = await adminRemoveHeroImage();
      setImageUrl(s.imageUrl);
      toast.success(t("admin.site.hero.removed"));
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : t("admin.site.toast.removeError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-10 md:space-y-12">
      <PageHeader
        title={t("admin.site.title")}
        description={t("admin.site.subtitle")}
        actions={
          <Button variant="outline" size="sm" asChild>
            <a href="/" target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" strokeWidth={1.5} aria-hidden />
              {t("admin.site.hero.preview")}
            </a>
          </Button>
        }
      />

      {loading ? (
        <LoadingState label={t("admin.site.loading")} />
      ) : (
        <FormSection title={t("admin.site.hero.title")} description={t("admin.site.hero.desc")}>
          {/* Preview at the hero's proportions, so the admin sees roughly what visitors will */}
          <div className="relative aspect-[16/9] overflow-hidden border border-border bg-[#0a0a0a]" data-testid="hero-preview">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="absolute inset-0 size-full object-cover" />
            ) : (
              <HeroArtwork
                from={t("landing.hero.art.from")}
                to={t("landing.hero.art.to")}
                reducedMotion
                className="absolute inset-0 size-full"
              />
            )}
            <span className="absolute left-3 top-3 border border-white/30 bg-black/60 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-white">
              {imageUrl ? t("admin.site.hero.badgeCustom") : t("admin.site.hero.badgeDefault")}
            </span>
          </div>

          <p className="text-sm text-muted-foreground">
            {imageUrl ? t("admin.site.hero.statusCustom") : t("admin.site.hero.statusDefault")}
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <div className="flex flex-wrap gap-1.5">
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={busy}>
              <Upload className="size-4" strokeWidth={1.5} aria-hidden />
              {imageUrl ? t("admin.site.hero.replace") : t("admin.site.hero.upload")}
            </Button>
            {imageUrl ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => void handleRemove()} disabled={busy}>
                <X className="size-4" strokeWidth={1.5} aria-hidden />
                {t("admin.site.hero.remove")}
              </Button>
            ) : null}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{t("admin.site.hero.hint")}</p>
        </FormSection>
      )}
    </div>
  );
}
