-- KPSS düzeyleri (Lisans / Ön Lisans / Ortaöğretim) — şema değişmez, yalnız
-- veri: `tracks` tablosuna KPSS şablonunun üç bölümü eklenir. Seed ile birebir
-- aynı (bkz. src/db/seed/exam-templates.ts, src/lib/tracks.ts).
-- `insert or ignore` + (exam_template_id, code) tekil indeksi sayesinde
-- yeniden çalıştırılabilir; mevcut kayıtların düzeyi NULL kalır (koç seçer).
INSERT OR IGNORE INTO `tracks` (`exam_template_id`, `code`, `name`, `sort_order`)
SELECT `id`, 'LISANS', 'Lisans', 1 FROM `exam_templates` WHERE `code` = 'KPSS';--> statement-breakpoint
INSERT OR IGNORE INTO `tracks` (`exam_template_id`, `code`, `name`, `sort_order`)
SELECT `id`, 'ONLISANS', 'Ön Lisans', 2 FROM `exam_templates` WHERE `code` = 'KPSS';--> statement-breakpoint
INSERT OR IGNORE INTO `tracks` (`exam_template_id`, `code`, `name`, `sort_order`)
SELECT `id`, 'ORTAOGRETIM', 'Ortaöğretim', 3 FROM `exam_templates` WHERE `code` = 'KPSS';
