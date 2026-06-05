import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { Upload, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
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
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t("inquiry.form.title")}</h1>
        <p className="text-gray-600 mt-2">
          {t("inquiry.form.subtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("inquiry.form.cardTitle")}</CardTitle>
            <CardDescription>
              {t("inquiry.form.cardDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">{t("inquiry.form.categoryLabel")}</Label>
              <Select required value={category} onValueChange={(v) => setCategory(v as InquiryCategory)}>
                <SelectTrigger>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">{t("inquiry.form.titleLabel")}</Label>
              <Input
                id="title"
                placeholder={t("inquiry.form.titlePlaceholder")}
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">{t("inquiry.form.contentLabel")}</Label>
              <Textarea
                id="content"
                placeholder={t("inquiry.form.contentPlaceholder")}
                rows={8}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={5000}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("inquiry.form.attachmentsTitle")}</CardTitle>
            <CardDescription>
              {t("inquiry.form.attachmentsDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 cursor-pointer transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                {t("inquiry.form.uploadHint")}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {t("inquiry.form.uploadHintDetail")}
              </p>
            </div>
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {imagePreviews.map((p) => (
                  <div key={`${p.file.name}-${p.index}`} className="relative group">
                    <img
                      src={p.url}
                      alt={p.file.name}
                      className="h-28 w-full object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-8 w-8 bg-white/80 hover:bg-white"
                      onClick={() => removeFile(p.index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="mt-1 text-xs text-gray-600 truncate">{p.file.name}</div>
                  </div>
                ))}
              </div>
            )}
            {files.some((f) => !isImageFile(f)) && (
              <ul className="space-y-2">
                {files.map((file, index) =>
                  isImageFile(file) ? null : (
                    <li
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-2"
                    >
                      <span className="truncate flex-1">{file.name}</span>
                      <span className="text-gray-500 ml-2">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="ml-2 h-8 w-8"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  )
                )}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="flex space-x-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => navigate(-1)}
            disabled={submitting}
          >
            {t("inquiry.form.cancel")}
          </Button>
          <Button type="submit" size="lg" className="flex-1" disabled={submitting}>
            {submitting ? t("inquiry.form.submitting") : t("inquiry.form.submit")}
          </Button>
        </div>
      </form>
    </div>
  );
}
