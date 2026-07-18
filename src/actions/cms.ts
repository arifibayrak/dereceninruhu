"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";

import { getDb } from "@/db";
import {
  blogPosts,
  coachProfiles,
  faqs,
  packages,
  testimonials,
} from "@/db/schema";
import {
  saveCoachProfileSchema,
  upsertBlogPostSchema,
  upsertFaqSchema,
  upsertPackageSchema,
  upsertTestimonialSchema,
} from "@/lib/validation";
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

/* ------------------------------- Koç profili ------------------------------ */

export async function saveCoachProfile(
  input: unknown,
): Promise<ActionResult<{ id: number }>> {
  return guarded(async () => {
    const coach = await requireAdmin();
    const parsed = saveCoachProfileSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        "Lütfen formu kontrol edin.",
        fieldErrorsOf(parsed.error.issues),
      );
    }
    const v = parsed.data;
    const db = getDb();
    const values = {
      displayName: v.displayName.trim(),
      bio: clean(v.bio),
      photoUrl: clean(v.photoUrl),
      subjects: JSON.stringify(v.subjects),
      achievements: JSON.stringify(v.achievements),
      isActive: v.isActive,
      updatedAt: new Date(),
    };
    if (v.id) {
      await db.update(coachProfiles).set(values).where(eq(coachProfiles.id, v.id));
      revalidateMarketing();
      return { ok: true, data: { id: v.id } };
    }
    // Profil yoksa mevcut koç kullanıcısına açılır (user_id unique).
    const existing = await db.query.coachProfiles.findFirst({
      where: eq(coachProfiles.userId, coach.id),
      columns: { id: true },
    });
    if (existing) {
      await db
        .update(coachProfiles)
        .set(values)
        .where(eq(coachProfiles.id, existing.id));
      revalidateMarketing();
      return { ok: true, data: { id: existing.id } };
    }
    const [row] = await db
      .insert(coachProfiles)
      .values({ ...values, userId: coach.id })
      .returning({ id: coachProfiles.id });
    revalidateMarketing();
    return { ok: true, data: { id: row.id } };
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
        columns: { publishedAt: true },
      });
      if (!existing) return actionError("Yazı bulunamadı.");
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
    await requireCoach();
    const id = idParam(input);
    if (!id) return actionError("Geçersiz kayıt.");
    const db = getDb();
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
