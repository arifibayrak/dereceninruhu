import { describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/d1";
import { contentItems } from "@/db/schema";
import * as schema from "@/db/schema";
import { visibleToEnrollment } from "./icerik";

/**
 * İçerik görünürlüğü ATAMA SAYISINDAN BAĞIMSIZ tek bir sorgu olmalı: eskiden
 * atanan id'ler `in (?, ?, …)` diye gömülüyordu ve D1'in 100 parametre sınırını
 * aşabiliyordu. Burada üretilen SQL'in şeklini ve parametre sayısını sabitliyoruz
 * (sorgu çalıştırılmaz — yalnız derlenir).
 */
const db = drizzle({} as unknown as D1Database, { schema });

const built = () =>
  db
    .select({ id: contentItems.id })
    .from(contentItems)
    .where(visibleToEnrollment(db, 42, 7))
    .toSQL();

describe("visibleToEnrollment", () => {
  it("atanan içerikleri id listesi yerine exists(…) ile çözer", () => {
    const { sql } = built();
    expect(sql).toContain("exists");
    expect(sql).toContain('"content_visibility"');
    expect(sql).not.toContain(" in (");
  });

  it("kütüphane kuralı korunur (is_library + sınav eşleşmesi/NULL)", () => {
    const { sql } = built();
    expect(sql).toContain('"content_items"."is_library"');
    expect(sql).toContain('"content_items"."exam_template_id" is null');
  });

  it("alt sorgu dış satırla ilişkilendirilir (correlated)", () => {
    const { sql } = built();
    expect(sql).toContain(
      '"content_visibility"."content_item_id" = "content_items"."id"',
    );
  });

  it("parametre sayısı sabit — atama sayısıyla büyümez", () => {
    const { params } = built();
    // is_library, exam_template_id, enrollment_id → 3 (booleans dahil).
    expect(params).toHaveLength(3);
    expect(params).toContain(42);
    expect(params).toContain(7);
  });
});
