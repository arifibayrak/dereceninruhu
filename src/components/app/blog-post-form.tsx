"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { SaveIcon, Trash2Icon } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { useRefresh } from "@/lib/use-refresh";
import { callAction } from "@/lib/action-client";
import { deleteBlogPost, upsertBlogPost } from "@/actions/cms";
import { slugifyTr } from "@/lib/slug";
import {
  upsertBlogPostSchema,
  type UpsertBlogPostInput,
} from "@/lib/validation";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const STATUSES = [
  { value: "draft", label: "Taslak" },
  { value: "published", label: "Yayında" },
  { value: "archived", label: "Arşiv" },
] as const;

type FormInput = z.input<typeof upsertBlogPostSchema>;

const FIELD_NAMES = [
  "title",
  "slug",
  "excerpt",
  "body",
  "coverImageUrl",
  "status",
] as const;
type FieldName = (typeof FIELD_NAMES)[number];

export type BlogPostFormValues = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  coverImageUrl: string | null;
  status: "draft" | "published" | "archived";
};

/** Blog yazısı editörü — başlıktan otomatik slug, yayınla/arşivle. */
export function BlogPostForm({ post }: { post?: BlogPostFormValues }) {
  const router = useRouter();
  const { refresh } = useRefresh();
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Slug elle değiştirilene kadar başlıktan türetilir.
  const [slugTouched, setSlugTouched] = useState(!!post);

  const form = useForm<FormInput, unknown, UpsertBlogPostInput>({
    resolver: zodResolver(upsertBlogPostSchema),
    defaultValues: {
      id: post?.id,
      title: post?.title ?? "",
      slug: post?.slug ?? "",
      excerpt: post?.excerpt ?? "",
      body: post?.body ?? "",
      coverImageUrl: post?.coverImageUrl ?? "",
      status: post?.status ?? "draft",
    },
  });
  const { errors } = form.formState;
  const slugValue = useWatch({ control: form.control, name: "slug" });

  const onSubmit = async (values: UpsertBlogPostInput) => {
    setSubmitting(true);
    const res = await callAction(upsertBlogPost, values);
    setSubmitting(false);
    if (!res.ok) {
      if (res.fieldErrors) {
        for (const [name, message] of Object.entries(res.fieldErrors)) {
          if ((FIELD_NAMES as readonly string[]).includes(name)) {
            form.setError(name as FieldName, { message });
          }
        }
      }
      toast.error(res.error);
      return;
    }
    toast.success(post ? "Yazı güncellendi" : "Yazı oluşturuldu");
    router.push("/koc/blog");
    refresh();
  };

  const onDelete = async () => {
    if (!post) return;
    if (!window.confirm(`"${post.title}" kalıcı olarak silinsin mi?`)) return;
    setDeleting(true);
    const res = await callAction(deleteBlogPost, post.id);
    setDeleting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Yazı silindi");
    router.push("/koc/blog");
    refresh();
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field data-invalid={errors.title ? true : undefined}>
          <FieldLabel htmlFor="post-baslik">Başlık *</FieldLabel>
          <Input
            id="post-baslik"
            placeholder="Örn. Deneme Analizi Nasıl Yapılır?"
            aria-invalid={errors.title ? true : undefined}
            {...form.register("title", {
              onChange: (e) => {
                if (!slugTouched) {
                  form.setValue("slug", slugifyTr(e.target.value));
                }
              },
            })}
          />
          <FieldError errors={[errors.title]} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={errors.slug ? true : undefined}>
            <FieldLabel htmlFor="post-slug">Slug *</FieldLabel>
            <Input
              id="post-slug"
              placeholder="deneme-analizi-nasil-yapilir"
              className="font-mono text-sm"
              aria-invalid={errors.slug ? true : undefined}
              {...form.register("slug", {
                onChange: () => setSlugTouched(true),
              })}
            />
            <FieldError errors={[errors.slug]} />
            <FieldDescription>
              Adres: /blog/{slugValue || "…"}
            </FieldDescription>
          </Field>

          <Field data-invalid={errors.status ? true : undefined}>
            <FieldLabel htmlFor="post-durum">Durum *</FieldLabel>
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Select
                  items={[...STATUSES]}
                  value={field.value}
                  onValueChange={(value) => field.onChange(value)}
                >
                  <SelectTrigger id="post-durum" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.status]} />
            <FieldDescription>
              Yalnız &quot;Yayında&quot; olan yazılar sitede görünür.
            </FieldDescription>
          </Field>
        </div>

        <Field data-invalid={errors.excerpt ? true : undefined}>
          <FieldLabel htmlFor="post-ozet">Özet</FieldLabel>
          <Textarea
            id="post-ozet"
            rows={2}
            placeholder="Listede ve arama sonuçlarında görünen 1-2 cümle."
            aria-invalid={errors.excerpt ? true : undefined}
            {...form.register("excerpt")}
          />
          <FieldError errors={[errors.excerpt]} />
        </Field>

        <Field data-invalid={errors.coverImageUrl ? true : undefined}>
          <FieldLabel htmlFor="post-kapak">Kapak görseli URL</FieldLabel>
          <Input
            id="post-kapak"
            inputMode="url"
            placeholder="https://…"
            aria-invalid={errors.coverImageUrl ? true : undefined}
            {...form.register("coverImageUrl")}
          />
          <FieldError errors={[errors.coverImageUrl]} />
          <FieldDescription>
            İsteğe bağlı — şimdilik saklanır, ileride listede gösterilecek.
          </FieldDescription>
        </Field>

        <Field data-invalid={errors.body ? true : undefined}>
          <FieldLabel htmlFor="post-govde">İçerik *</FieldLabel>
          <Textarea
            id="post-govde"
            rows={16}
            className="font-mono text-sm leading-relaxed"
            placeholder={"## Başlık\n\nParagraf metni…\n\n- madde\n- madde\n\n> alıntı"}
            aria-invalid={errors.body ? true : undefined}
            {...form.register("body")}
          />
          <FieldError errors={[errors.body]} />
          <FieldDescription>
            Basit biçim: &quot;## başlık&quot;, &quot;- liste&quot;, &quot;&gt;
            alıntı&quot;, **kalın**, [link](/iletisim).
          </FieldDescription>
        </Field>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="lg" disabled={submitting}>
            <SaveIcon data-icon="inline-start" />
            {submitting ? "Kaydediliyor…" : post ? "Kaydet" : "Yazıyı oluştur"}
          </Button>
          {post && (
            <Button
              type="button"
              variant="destructive"
              size="lg"
              disabled={deleting}
              onClick={onDelete}
            >
              <Trash2Icon data-icon="inline-start" />
              {deleting ? "Siliniyor…" : "Sil"}
            </Button>
          )}
        </div>
      </FieldGroup>
    </form>
  );
}
