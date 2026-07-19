"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";

import { getDb, getR2 } from "@/db";
import {
  blogPosts,
  coachProfiles,
  faqs,
  packages,
  testimonials,
} from "@/db/schema";
import {
  saveMyProfileSchema,
  upsertBlogPostSchema,
  upsertFaqSchema,
  upsertPackageSchema,
  upsertTestimonialSchema,
} from "@/lib/validation";
import { slugifyTr } from "@/lib/slug";
import {
  actionError,
  fieldErrorsOf,
  guarded,
  requireAdmin,
  requireCoach,
  type ActionResult,
} from "@/actions/_guard";

/**
 * Hafif CMS CRUD + Zod. Pazarlama içeriği (yorum/paket/SSS/koç profili) tek
 * markadır → requireAdmin; blog ise requireCoach. Public sayfalar force-dynamic
 * olduğu için revalidatePath çağrıları esasen client router cache'ini tazeler.
 */

const clean = (v?: string) => {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
};

function idParam(input: unknown): number | null {
  const n = Number(input);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/* -------------------------------- Yorumlar -------------------------------- */

export async function upsertTestimonial(
  input: unknown,
): Promise<ActionResult<{ id: number }>> {
  return guarded(async () => {
    await requireAdmin();
    const parsed = upsertTestimonialSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        "Lütfen formu kontrol edin.",
        fieldErrorsOf(parsed.error.issues),
      );
    }
    const v = parsed.data;
    const db = getDb();
    const values = {
      studentName: v.studentName.trim(),
      exam: v.exam,
      result: clean(v.result),
      quote: v.quote.trim(),
      sortOrder: v.sortOrder,
      isActive: v.isActive,
    };
    if (v.id) {
      await db.update(testimonials).set(values).where(eq(testimonials.id, v.id));
      revalidateMarketing();
      return { ok: true, data: { id: v.id } };
    }
    const [row] = await db
      .insert(testimonials)
      .values(values)
      .returning({ id: testimonials.id });
    revalidateMarketing();
    return { ok: true, data: { id: row.id } };
  });
}

export async function deleteTestimonial(
  input: unknown,
): Promise<ActionResult<void>> {
  return guarded(async () => {
    await requireAdmin();
    const id = idParam(input);
    if (!id) return actionError("Geçersiz kayıt.");
    const db = getDb();
    await db.delete(testimonials).where(eq(testimonials.id, id));
    revalidateMarketing();
    return { ok: true, data: undefined };
  });
}

/* -------------------------------- Paketler -------------------------------- */

export async function upsertPackage(
  input: unknown,
): Promise<ActionResult<{ id: number }>> {
  return guarded(async () => {
    await requireAdmin();
    const parsed = upsertPackageSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        "Lütfen formu kontrol edin.",
        fieldErrorsOf(parsed.error.issues),
      );
    }
    const v = parsed.data;
    const db = getDb();
    const values = {
      name: v.name.trim(),
      priceKurus: v.priceKurus,
      period: clean(v.period),
      features: JSON.stringify(v.features),
      sortOrder: v.sortOrder,
      isActive: v.isActive,
      updatedAt: new Date(),
    };
    if (v.id) {
      await db.update(packages).set(values).where(eq(packages.id, v.id));
      revalidateMarketing();
      return { ok: true, data: { id: v.id } };
    }
    const [row] = await db
      .insert(packages)
      .values(values)
      .returning({ id: packages.id });
    revalidateMarketing();
    return { ok: true, data: { id: row.id } };
  });
}

export async function deletePackage(input: unknown): Promise<ActionResult<void>> {
  return guarded(async () => {
    await requireAdmin();
    const id = idParam(input);
    if (!id) return actionError("Geçersiz kayıt.");
    const db = getDb();
    await db.delete(packages).where(eq(packages.id, id));
    revalidateMarketing();
    return { ok: true, data: undefined };
  });
}

/* ----------------------------------- SSS ---------------------------------- */

export async function upsertFaq(
  input: unknown,
): Promise<ActionResult<{ id: number }>> {
  return guarded(async () => {
    await requireAdmin();
    const parsed = upsertFaqSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        "Lütfen formu kontrol edin.",
        fieldErrorsOf(parsed.error.issues),
      );
    }
    const v = parsed.data;
    const db = getDb();
    const values = {
      question: v.question.trim(),
      answer: v.answer.trim(),
      sortOrder: v.sortOrder,
      isActive: v.isActive,
    };
    if (v.id) {
      await db.update(faqs).set(values).where(eq(faqs.id, v.id));
      revalidateMarketing();
      return { ok: true, data: { id: v.id } };
    }
    const [row] = await db.insert(faqs).values(values).returning({ id: faqs.id });
    revalidateMarketing();
    return { ok: true, data: { id: row.id } };
  });
}

export async function deleteFaq(input: unknown): Promise<ActionResult<void>> {
  return guarded(async () => {
    await requireAdmin();
    const id = idParam(input);
    if (!id) return actionError("Geçersiz kayıt.");
    const db = getDb();
    await db.delete(faqs).where(eq(faqs.id, id));
    revalidateMarketing();
    return { ok: true, data: undefined };
  });
}

/* --------------------------- Profil görsel yükleme ------------------------ */

/** İzin verilen görsel türleri → dosya uzantısı. */
const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Koç, profil fotoğrafını/kapağını cihazından yükler → R2'ye yazılır, dahili
 * `/api/uploads/…` yolu döner (form bunu photoUrl/coverImageUrl'a koyar).
 * Her koç yalnız kendi klasörüne (profiles/{userId}/) yazar.
 */
export async function uploadProfileImage(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  return guarded(async () => {
    const coach = await requireCoach();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return actionError("Dosya bulunamadı.");
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return actionError("Görsel en fazla 5 MB olabilir.");
    }
    const ext = IMAGE_EXT[file.type];
    if (!ext) {
      return actionError("Yalnız görsel yükleyebilirsin (JPG, PNG, WebP, GIF).");
    }
    const key = `profiles/${coach.id}/${crypto.randomUUID()}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    await getR2().put(key, bytes, { httpMetadata: { contentType: file.type } });
    return { ok: true, data: { url: `/api/uploads/${key}` } };
  });
}

/* ------------------------------- Koç profili ------------------------------ */

/**
 * displayName'den benzersiz slug türetir. Aynı slug BAŞKA bir koça aitse
 * `-2`, `-3`… ekler. `selfUserId` sahibinin kendi satırını çakışma saymaz.
 */
async function uniqueProfileSlug(
  displayName: string,
  selfUserId: string,
): Promise<string> {
  const db = getDb();
  const base = slugifyTr(displayName) || "koc";
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const clash = await db.query.coachProfiles.findFirst({
      where: eq(coachProfiles.slug, candidate),
      columns: { userId: true },
    });
    if (!clash || clash.userId === selfUserId) return candidate;
  }
  // Aşırı çakışma — kullanıcı id kuyruğuyla garanti benzersiz.
  return `${base}-${selfUserId.slice(0, 6)}`;
}

/**
 * Koç kendi herkese açık profilini kaydeder (/koc/profil). Kimlik oturumdan
 * gelir; her koç YALNIZ kendi satırını yazar (user_id unique). Yeni profil,
 * öne çıkan koçun (Ahmet, sort_order 0) altına eklenir.
 */
export async function saveMyProfile(
  input: unknown,
): Promise<ActionResult<{ slug: string }>> {
  return guarded(async () => {
    const coach = await requireCoach();
    const parsed = saveMyProfileSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        "Lütfen formu kontrol edin.",
        fieldErrorsOf(parsed.error.issues),
      );
    }
    const v = parsed.data;
    const db = getDb();
    const slug = await uniqueProfileSlug(v.displayName, coach.id);
    const values = {
      slug,
      displayName: v.displayName.trim(),
      title: clean(v.title),
      location: clean(v.location),
      headline: clean(v.headline),
      bio: clean(v.bio),
      photoUrl: clean(v.photoUrl),
      coverImageUrl: clean(v.coverImageUrl),
      subjects: JSON.stringify(v.subjects),
      achievements: JSON.stringify(v.achievements),
      links: JSON.stringify(v.links),
      proofUrl: clean(v.proofUrl),
      isActive: v.isActive,
      updatedAt: new Date(),
    };

    const existing = await db.query.coachProfiles.findFirst({
      where: eq(coachProfiles.userId, coach.id),
      columns: { id: true },
    });
    if (existing) {
      await db
        .update(coachProfiles)
        .set(values)
        .where(eq(coachProfiles.id, existing.id));
    } else {
      // Yeni profil öne çıkan koçun altına: mevcut en yüksek sort_order + 1.
      const rows = await db
        .select({ sortOrder: coachProfiles.sortOrder })
        .from(coachProfiles);
      const nextSort = rows.reduce((m, r) => Math.max(m, r.sortOrder), 0) + 1;
      await db
        .insert(coachProfiles)
        .values({ ...values, userId: coach.id, sortOrder: nextSort });
    }
    revalidateMarketing();
    revalidatePath(`/koclar/${slug}`);
    revalidatePath("/koc/profil");
    return { ok: true, data: { slug } };
  });
}

/* ---------------------------------- Blog ---------------------------------- */

export async function upsertBlogPost(
  input: unknown,
): Promise<ActionResult<{ id: number; slug: string }>> {
  return guarded(async () => {
    const coach = await requireCoach();
    const parsed = upsertBlogPostSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        "Lütfen formu kontrol edin.",
        fieldErrorsOf(parsed.error.issues),
      );
    }
    const v = parsed.data;
    const db = getDb();

    // Slug çakışması — D1 unique hatası yerine okunur mesaj.
    const conflict = await db.query.blogPosts.findFirst({
      where: v.id
        ? and(eq(blogPosts.slug, v.slug), ne(blogPosts.id, v.id))
        : eq(blogPosts.slug, v.slug),
      columns: { id: true },
    });
    if (conflict) {
      return actionError("Bu slug zaten kullanılıyor.", {
        slug: "Bu slug zaten kullanılıyor — başka bir slug seçin.",
      });
    }

    const base = {
      title: v.title.trim(),
      slug: v.slug,
      excerpt: clean(v.excerpt),
      body: v.body,
      coverImageUrl: clean(v.coverImageUrl),
      status: v.status,
      updatedAt: new Date(),
    };

    if (v.id) {
      const existing = await db.query.blogPosts.findFirst({
        where: eq(blogPosts.id, v.id),
        columns: { publishedAt: true, authorUserId: true },
      });
      if (!existing) return actionError("Yazı bulunamadı.");
      // Koç yalnız kendi yazısını düzenleyebilir; yönetici hepsini.
      if (coach.role === "coach" && existing.authorUserId !== coach.id) {
        return actionError("Bu yazı sana ait değil.");
      }
      await db
        .update(blogPosts)
        .set({
          ...base,
          // İlk yayına alışta damgalanır; sonraki düzenlemelerde korunur.
          publishedAt:
            v.status === "published"
              ? (existing.publishedAt ?? new Date())
              : existing.publishedAt,
        })
        .where(eq(blogPosts.id, v.id));
      revalidateBlog(v.slug);
      return { ok: true, data: { id: v.id, slug: v.slug } };
    }

    const [row] = await db
      .insert(blogPosts)
      .values({
        ...base,
        publishedAt: v.status === "published" ? new Date() : null,
        authorUserId: coach.id,
      })
      .returning({ id: blogPosts.id });
    revalidateBlog(v.slug);
    return { ok: true, data: { id: row.id, slug: v.slug } };
  });
}

export async function deleteBlogPost(input: unknown): Promise<ActionResult<void>> {
  return guarded(async () => {
    const user = await requireCoach();
    const id = idParam(input);
    if (!id) return actionError("Geçersiz kayıt.");
    const db = getDb();
    const post = await db.query.blogPosts.findFirst({
      where: eq(blogPosts.id, id),
      columns: { id: true, authorUserId: true },
    });
    if (!post) return actionError("Yazı bulunamadı.");
    // Koç yalnız kendi yazısını silebilir; yönetici hepsini.
    if (user.role === "coach" && post.authorUserId !== user.id) {
      return actionError("Bu yazı sana ait değil.");
    }
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
    revalidateBlog();
    return { ok: true, data: undefined };
  });
}

/* --------------------------------- Yardımcı ------------------------------- */

function revalidateMarketing() {
  for (const p of ["/", "/koclar", "/fiyatlar", "/basarilar", "/sss", "/koc/site"]) {
    revalidatePath(p);
  }
}

function revalidateBlog(slug?: string) {
  revalidatePath("/blog");
  revalidatePath("/koc/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
}
