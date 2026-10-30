import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, Package, Search, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Switch } from "../../components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { EmptyState, Field, LoadingState, PageHeader, Pager, Toolbar } from "../../components/page";
import { ProductImage, formatKrw } from "../../components/product/ProductCard";
import {
  adminCreateProduct,
  adminDeleteProduct,
  adminDeleteProductImage,
  adminListProducts,
  adminUpdateProduct,
  adminUploadProductImage,
} from "../../api/product";
import { useTranslation } from "../../hooks/useTranslation";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "../../utils/constants";
import type { Product, ProductRequest, ProductStatus } from "../../types/product";

const BADGE_CLASS = "px-2 py-0.5 text-[10px] font-medium";

type FormState = {
  name: string;
  shopName: string;
  productUrl: string;
  priceKrw: string;
  category: string;
  description: string;
  status: ProductStatus;
  isFeatured: boolean;
  sortOrder: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  shopName: "",
  productUrl: "",
  priceKrw: "",
  category: "",
  description: "",
  status: "ACTIVE",
  isFeatured: false,
  sortOrder: "0",
};

function toForm(p: Product): FormState {
  return {
    name: p.name,
    shopName: p.shopName,
    productUrl: p.productUrl,
    priceKrw: String(p.priceKrw),
    category: p.category ?? "",
    description: p.description ?? "",
    status: p.status,
    isFeatured: p.isFeatured,
    sortOrder: String(p.sortOrder),
  };
}

function statusKey(status: ProductStatus) {
  return `admin.products.status.${status}` as "admin.products.status.ACTIVE" | "admin.products.status.HIDDEN";
}

/** Admin catalogue: list, create/edit dialog with image upload, soft delete. */
export default function AdminProducts() {
  const { t, locale } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(0);
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "ALL">("ALL");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminListProducts({ page, size, keyword, status: statusFilter === "ALL" ? "" : statusFilter })
      .then((data) => {
        setProducts(data.content);
        setTotalPages(data.totalPages);
      })
      .catch(() => {
        toast.error(t("admin.products.loadError"));
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [page, size, keyword, statusFilter, t]);

  useEffect(() => {
    load();
  }, [load]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setPendingImage(null);
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm(toForm(p));
    setPendingImage(null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (submitting || uploading) return;
    setDialogOpen(false);
    setEditing(null);
    setPendingImage(null);
  };

  const buildRequest = (): ProductRequest | null => {
    const price = Number(form.priceKrw);
    if (!form.name.trim() || !form.shopName.trim() || !form.productUrl.trim() || !Number.isFinite(price) || price < 0) {
      toast.error(t("admin.products.validation"));
      return null;
    }
    if (!/^https?:\/\//i.test(form.productUrl.trim())) {
      toast.error(t("admin.products.validation"));
      return null;
    }
    const sortOrder = Number(form.sortOrder);
    return {
      name: form.name.trim(),
      shopName: form.shopName.trim(),
      productUrl: form.productUrl.trim(),
      priceKrw: Math.round(price),
      category: form.category.trim() || null,
      description: form.description.trim() || null,
      status: form.status,
      isFeatured: form.isFeatured,
      sortOrder: Number.isFinite(sortOrder) ? Math.trunc(sortOrder) : 0,
    };
  };

  const handleSave = async () => {
    const body = buildRequest();
    if (!body) return;
    setSubmitting(true);
    try {
      let saved = editing ? await adminUpdateProduct(editing.id, body) : await adminCreateProduct(body);
      if (pendingImage) {
        setUploading(true);
        try {
          saved = await adminUploadProductImage(saved.id, pendingImage);
          toast.success(t("admin.products.imageUploaded"));
        } catch {
          toast.error(t("admin.common.uploadError"));
        } finally {
          setUploading(false);
        }
      }
      toast.success(editing ? t("admin.products.updated") : t("admin.products.created"));
      setEditing(saved);
      setForm(toForm(saved));
      setPendingImage(null);
      setDialogOpen(false);
      load();
    } catch {
      toast.error(t("admin.common.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (p: Product) => {
    if (!window.confirm(t("admin.products.deleteConfirm"))) return;
    try {
      await adminDeleteProduct(p.id);
      toast.success(t("admin.common.deleteDone"));
      if (editing?.id === p.id) closeDialog();
      load();
    } catch {
      toast.error(t("admin.common.deleteError"));
    }
  };

  const handleImageChange = async (file: File | null) => {
    if (!file) return;
    if (!editing) {
      // New product: keep the file and upload it right after the product is created.
      setPendingImage(file);
      return;
    }
    setUploading(true);
    try {
      const updated = await adminUploadProductImage(editing.id, file);
      setEditing(updated);
      toast.success(t("admin.products.imageUploaded"));
      load();
    } catch {
      toast.error(t("admin.common.uploadError"));
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!editing) {
      setPendingImage(null);
      return;
    }
    setUploading(true);
    try {
      const updated = await adminDeleteProductImage(editing.id);
      setEditing(updated);
      load();
    } catch {
      toast.error(t("admin.common.deleteError"));
    } finally {
      setUploading(false);
    }
  };

  const previewUrl = pendingImage ? URL.createObjectURL(pendingImage) : editing?.imageUrl ?? null;
  const busy = submitting || uploading;

  return (
    <div className="space-y-10 md:space-y-12">
      <PageHeader
        title={t("admin.products.title")}
        description={t("admin.products.subtitle")}
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" strokeWidth={1.5} aria-hidden />
            {t("admin.products.create")}
          </Button>
        }
      />

      <div className="space-y-4">
        <Toolbar
          trailing={
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as ProductStatus | "ALL");
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[10rem]" aria-label={t("admin.products.field.status")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("admin.common.all")}</SelectItem>
                <SelectItem value="ACTIVE">{t("admin.products.status.ACTIVE")}</SelectItem>
                <SelectItem value="HIDDEN">{t("admin.products.status.HIDDEN")}</SelectItem>
              </SelectContent>
            </Select>
          }
        >
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.5}
              aria-hidden
            />
            <Input
              className="pl-9"
              placeholder={t("admin.products.searchPlaceholder")}
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setKeyword(keywordInput.trim());
                  setPage(0);
                }
              }}
              aria-label={t("admin.products.searchPlaceholder")}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setKeyword(keywordInput.trim());
              setPage(0);
            }}
          >
            {t("common.apply")}
          </Button>
        </Toolbar>

        {loading ? (
          <LoadingState label={t("admin.common.loading")} />
        ) : products.length === 0 ? (
          <EmptyState compact icon={Package} title={t("admin.products.empty")} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.products.col.product")}</TableHead>
                <TableHead>{t("admin.products.field.category")}</TableHead>
                <TableHead className="text-right">{t("admin.products.col.price")}</TableHead>
                <TableHead>{t("admin.common.col.status")}</TableHead>
                <TableHead className="text-right">{t("admin.products.col.sort")}</TableHead>
                <TableHead className="text-right">{t("admin.common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => openEdit(p)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <ProductImage product={p} size="xs" className="w-10 shrink-0 border border-border" />
                      <div className="min-w-0">
                        <p className="max-w-xs truncate font-medium">
                          {p.isFeatured ? (
                            <Badge className="mr-2 px-1.5 py-0 align-middle text-[10px] font-medium">{t("products.featured")}</Badge>
                          ) : null}
                          {p.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{p.shopName}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.category ?? "—"}</TableCell>
                  <TableCell className="text-right figure">{formatKrw(p.priceKrw, locale)}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "ACTIVE" ? "default" : "secondary"} className={BADGE_CLASS}>
                      {t(statusKey(p.status))}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground figure">{p.sortOrder}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => openEdit(p)}
                        title={t("admin.common.edit")}
                        aria-label={t("admin.common.edit")}
                      >
                        <Pencil className="size-4" strokeWidth={1.5} aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(p)}
                        title={t("admin.common.delete")}
                        aria-label={t("admin.common.delete")}
                      >
                        <Trash2 className="size-4" strokeWidth={1.5} aria-hidden />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {!loading && products.length > 0 ? (
          <Pager
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => p - 1)}
            onNext={() => setPage((p) => p + 1)}
            prevLabel={t("admin.common.prev")}
            nextLabel={t("admin.common.next")}
            leading={
              <>
                <span>{t("admin.common.pageSize")}</span>
                <Select
                  value={String(size)}
                  onValueChange={(v) => {
                    setSize(Number(v));
                    setPage(0);
                  }}
                >
                  <SelectTrigger size="sm" className="w-[5.5rem] text-xs" aria-label={t("admin.common.pageSize")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        {t("admin.common.pageSizeSuffix", { n: s })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            }
          />
        ) : null}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => (o ? setDialogOpen(true) : closeDialog())}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? t("admin.products.editTitle") : t("admin.products.createTitle")}</DialogTitle>
            <DialogDescription>{t("admin.products.subtitle")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 md:grid-cols-[12rem_minmax(0,1fr)]">
            {/* Image */}
            <div className="space-y-3">
              <p className="text-sm font-medium">{t("admin.products.field.image")}</p>
              <ProductImage
                product={{ imageUrl: previewUrl, name: form.name, shopName: form.shopName }}
                className="w-40 border border-border md:w-full"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  void handleImageChange(e.target.files?.[0] ?? null);
                  e.target.value = "";
                }}
              />
              <div className="flex flex-wrap gap-1.5">
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={busy}>
                  <Upload className="size-4" strokeWidth={1.5} aria-hidden />
                  {previewUrl ? t("admin.products.replaceImage") : t("admin.products.uploadImage")}
                </Button>
                {previewUrl ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => void handleRemoveImage()} disabled={busy}>
                    <X className="size-4" strokeWidth={1.5} aria-hidden />
                    {t("admin.products.removeImage")}
                  </Button>
                ) : null}
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{t("admin.products.imageHint")}</p>
            </div>

            {/* Fields */}
            <div className="space-y-5">
              <Field htmlFor="product-name" label={t("admin.products.field.name")} required>
                <Input id="product-name" value={form.name} onChange={(e) => setField("name", e.target.value)} disabled={busy} />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field htmlFor="product-shop" label={t("admin.products.field.shop")} required>
                  <Input id="product-shop" value={form.shopName} onChange={(e) => setField("shopName", e.target.value)} disabled={busy} />
                </Field>
                <Field htmlFor="product-category" label={t("admin.products.field.category")}>
                  <Input id="product-category" value={form.category} onChange={(e) => setField("category", e.target.value)} disabled={busy} />
                </Field>
              </div>
              <Field htmlFor="product-url" label={t("admin.products.field.url")} required>
                <Input
                  id="product-url"
                  type="url"
                  placeholder="https://"
                  value={form.productUrl}
                  onChange={(e) => setField("productUrl", e.target.value)}
                  disabled={busy}
                />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field htmlFor="product-price" label={t("admin.products.field.price")} required>
                  <Input
                    id="product-price"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    className="figure"
                    value={form.priceKrw}
                    onChange={(e) => setField("priceKrw", e.target.value)}
                    disabled={busy}
                  />
                </Field>
                <Field htmlFor="product-sort" label={t("admin.products.field.sortOrder")}>
                  <Input
                    id="product-sort"
                    type="number"
                    inputMode="numeric"
                    step="1"
                    className="figure"
                    value={form.sortOrder}
                    onChange={(e) => setField("sortOrder", e.target.value)}
                    disabled={busy}
                  />
                </Field>
              </div>
              <Field htmlFor="product-description" label={t("admin.products.field.description")}>
                <Textarea
                  id="product-description"
                  className="min-h-28"
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  disabled={busy}
                />
              </Field>
              <Field htmlFor="product-status" label={t("admin.products.field.status")}>
                <Select value={form.status} onValueChange={(v) => setField("status", v as ProductStatus)} disabled={busy}>
                  <SelectTrigger id="product-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">{t("admin.products.status.ACTIVE")}</SelectItem>
                    <SelectItem value="HIDDEN">{t("admin.products.status.HIDDEN")}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <div className="flex items-center justify-between gap-4 border-y border-border py-3">
                <label htmlFor="product-featured" className="text-sm font-medium">
                  {t("admin.products.field.featured")}
                </label>
                <Switch
                  id="product-featured"
                  checked={form.isFeatured}
                  onCheckedChange={(checked) => setField("isFeatured", checked)}
                  disabled={busy}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            {editing ? (
              <Button variant="ghost" className="mr-auto text-destructive hover:text-destructive" onClick={() => handleDelete(editing)} disabled={busy}>
                {t("admin.common.delete")}
              </Button>
            ) : null}
            <Button variant="ghost" onClick={closeDialog} disabled={busy}>
              {t("admin.common.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={busy}>
              {busy ? t("admin.common.saving") : t("admin.common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
