import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { Paperclip, Upload, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Field, FormActions, FormSection, PageHeader } from "../../components/page";
import { toast } from "sonner";
import { api } from "../../utils/api";
import { unwrap } from "../../utils/exception";
import { useTranslation } from "../../hooks/useTranslation";
import type { InquiryCategory } from "../../types";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

function getCategoryOptions(t: (key: string) => string): { value: InquiryCategory; label: string }[] {
  return [
    { value: "ORDER", label: t("inquiry.category.order") },
    { value: "SHIPPING", label: t("inquiry.category.shipping") },
    { value: "PAYMENT", label: t("inquiry.category.payment") },
    { value: "ETC", label: t("inquiry.category.etc") },
  ];
}

/** 구매 목록 등에서 `navigate('/inquiry/new', { state })`로 전달 */
export type InquiryFormPrefillState = {
  category?: InquiryCategory;
  title?: string;
  content?: string;
};

export default function InquiryForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<InquiryCategory | "">("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const imagePreviews = useMemo(
    () =>
      files
        .map((file, index) => ({ file, index }))
        .filter(({ file }) => isImageFile(file))
        .map(({ file, index }) => ({ file, index, url: URL.createObjectURL(file) })),
    [files]
  );

  useEffect(() => {
    return () => {
      imagePreviews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [imagePreviews]);

  const categoryOptions = getCategoryOptions(t);

  useEffect(() => {
    const st = location.state as InquiryFormPrefillState | null | undefined;
    if (!st || (!st.category && !st.title?.trim() && !st.content?.trim())) return;
    if (st.category) setCategory(st.category);
    if (typeof st.title === "string" && st.title.trim()) setTitle(st.title);
    if (typeof st.content === "string" && st.content.trim()) setContent(st.content);
  }, [location.key]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const valid: File[] = [];
    for (const file of selected) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(t("inquiry.form.toastFileSizeExceeded"));
        continue;
      }
      valid.push(file);
    }
    const combined = [...files, ...valid].slice(0, MAX_FILES);
    if (combined.length > MAX_FILES) {
      toast.error(t("inquiry.form.toastMaxFiles"));
    }
    setFiles(combined.slice(0, MAX_FILES));
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) {
      toast.error(t("inquiry.form.toastSelectCategory"));
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append(
        "inquiry",
        new Blob([JSON.stringify({ category, title, content })], ({ type: "application/json" }) as BlobPropertyBag)
      );
      files.forEach((file) => formData.append("files", file));
      const response = await (api.upload)<{ id: number }>("/v1/inquiries", formData);
      const data = unwrap(response);
      toast.success(t("inquiry.form.toastSuccess"));
      navigate(`/inquiry/${data.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("inquiry.form.toastError");
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title={t("inquiry.form.title")} description={t("inquiry.form.subtitle")} />

      <form onSubmit={handleSubmit}>
        <FormSection title={t("inquiry.form.cardTitle")} description={t("inquiry.form.cardDescription")}>
          <Field htmlFor="category" label={t("inquiry.form.categoryLabel")}>
            <Select required value={category} onValueChange={(v) => setCategory(v as InquiryCategory)}>
              <SelectTrigger id="category">
                <SelectValue placeholder={t("inquiry.form.categoryPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field htmlFor="title" label={t("inquiry.form.titleLabel")}>
            <Input
              id="title"
              placeholder={t("inquiry.form.titlePlaceholder")}
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </Field>

          <Field htmlFor="content" label={t("inquiry.form.contentLabel")}>
            <Textarea
              id="content"
              placeholder={t("inquiry.form.contentPlaceholder")}
              rows={8}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={5000}
            />
          </Field>
        </FormSection>

        <FormSection title={t("inquiry.form.attachmentsTitle")} description={t("inquiry.form.attachmentsDesc")}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="block w-full border border-dashed border-input p-8 text-center text-sm text-muted-foreground transition-colors hover:border-foreground"
          >
            <Upload className="mx-auto size-6" strokeWidth={1.25} aria-hidden />
            <span className="mt-3 block">{t("inquiry.form.uploadHint")}</span>
            <span className="mt-1 block text-xs">{t("inquiry.form.uploadHintDetail")}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          {files.length > 0 && (
            <ul className="border-t border-border">
              {files.map((file, index) => {
                const preview = imagePreviews.find((p) => p.index === index);
                return (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-3 border-b border-border py-2.5 text-sm"
                  >
                    {preview ? (
                      <img src={preview.url} alt="" className="size-10 shrink-0 border border-border object-cover" />
                    ) : (
                      <Paperclip className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} aria-hidden />
                    )}
                    <span className="min-w-0 flex-1 truncate">{file.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground figure">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      title={t("admin.common.delete")}
                      aria-label={t("admin.common.delete")}
                      onClick={() => removeFile(index)}
                    >
                      <X className="size-4" strokeWidth={1.5} aria-hidden />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </FormSection>

        <FormActions>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(-1)}
            disabled={submitting}
          >
            {t("inquiry.form.cancel")}
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? t("inquiry.form.submitting") : t("inquiry.form.submit")}
          </Button>
        </FormActions>
      </form>
    </div>
  );
}
