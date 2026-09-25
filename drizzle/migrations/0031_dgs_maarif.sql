-- DGS sınavı + Türkiye Yüzyılı Maarif Modeli TYT konuları — şema değişmez,
-- yalnız veri. Seed ile birebir aynı (src/db/seed/exam-templates.ts, topics.ts).
-- 1) Maarif konuları eski TYT konularının YANINA eklenir ("Maarif · " önekli,
--    eski konuların arkasında sıralanır); eski konulara dokunulmaz.
-- 2) DGS şablonu: tek bölüm, Türkçe + Matematik (+ Geometri alt dersi), 4 yanlış
--    1 doğru; bölümsüz. Konuları TYT'nin klasik + Maarif konularıdır.
-- INSERT OR IGNORE + tekil indeksler / NOT EXISTS sayesinde yeniden çalıştırılabilir.
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Sözcükte Anlam', 24, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Sözcükte Anlam');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Cümlede Anlam', 25, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Cümlede Anlam');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Paragrafta Anlam', 26, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Paragrafta Anlam');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Anlatım Biçimleri', 27, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Anlatım Biçimleri');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Düşünceyi Geliştirme Yolları', 28, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Düşünceyi Geliştirme Yolları');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Ses Bilgisi', 29, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Ses Bilgisi');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Yazım Kuralları', 30, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Yazım Kuralları');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Noktalama İşaretleri', 31, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Noktalama İşaretleri');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Sözcük Türleri', 32, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Sözcük Türleri');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Fiiller', 33, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Fiiller');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Ekler', 34, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Ekler');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Cümlenin Ögeleri', 35, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Cümlenin Ögeleri');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Anlatım Bozuklukları', 36, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Anlatım Bozuklukları');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 9. Sınıf Sayılar', 30, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 9. Sınıf Sayılar');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 9. Sınıf Nicelikler ve Değişimler', 31, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 9. Sınıf Nicelikler ve Değişimler');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 9. Sınıf Algoritma ve Bilişim', 32, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 9. Sınıf Algoritma ve Bilişim');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 9. Sınıf İstatistiksel Araştırma Süreci', 33, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 9. Sınıf İstatistiksel Araştırma Süreci');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 9. Sınıf Veriden Olasılığa', 34, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 9. Sınıf Veriden Olasılığa');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 10. Sınıf Sayılar', 35, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 10. Sınıf Sayılar');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 10. Sınıf Nicelikler ve Değişimler', 36, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 10. Sınıf Nicelikler ve Değişimler');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 10. Sınıf Sayma, Algoritma ve Bilişim', 37, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 10. Sınıf Sayma, Algoritma ve Bilişim');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 10. Sınıf İstatistiksel Araştırma Süreci', 38, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 10. Sınıf İstatistiksel Araştırma Süreci');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 10. Sınıf Veriden Olasılığa', 39, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 10. Sınıf Veriden Olasılığa');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 9. Sınıf Geometrik Şekiller', 14, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'GEO'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 9. Sınıf Geometrik Şekiller');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 9. Sınıf Eşlik ve Benzerlik', 15, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'GEO'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 9. Sınıf Eşlik ve Benzerlik');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 10. Sınıf Geometrik Şekiller (Trigonometriye Giriş)', 16, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'GEO'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 10. Sınıf Geometrik Şekiller (Trigonometriye Giriş)');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 10. Sınıf Analitik İnceleme', 17, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'GEO'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 10. Sınıf Analitik İnceleme');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Geçmişin İnşa Sürecinde Tarih', 15, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TYT_TAR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Geçmişin İnşa Sürecinde Tarih');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Eski Çağ Medeniyetleri', 16, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TYT_TAR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Eski Çağ Medeniyetleri');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Orta Çağ Medeniyetleri', 17, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TYT_TAR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Orta Çağ Medeniyetleri');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Coğrafyanın Doğası', 13, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TYT_COG'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Coğrafyanın Doğası');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Mekânsal Bilgi Teknolojileri', 14, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TYT_COG'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Mekânsal Bilgi Teknolojileri');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Doğal Sistemler ve Süreçler', 15, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TYT_COG'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Doğal Sistemler ve Süreçler');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Beşerî Sistemler ve Süreçler', 16, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TYT_COG'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Beşerî Sistemler ve Süreçler');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Ekonomik Faaliyetler', 17, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TYT_COG'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Ekonomik Faaliyetler');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Afetler ve Sürdürülebilir Çevre', 18, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TYT_COG'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Afetler ve Sürdürülebilir Çevre');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Bölgeler, Ülkeler ve Küresel Bağlantılar', 19, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TYT_COG'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Bölgeler, Ülkeler ve Küresel Bağlantılar');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Felsefeye Giriş ve Temel Kavramlar', 9, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TYT_FEL'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Felsefeye Giriş ve Temel Kavramlar');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 9-10. Sınıf Din Kültürü ve Ahlak', 9, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TYT_DIN'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 9-10. Sınıf Din Kültürü ve Ahlak');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 9. Sınıf Fizik Bilimi ve Kariyer Keşfi', 11, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TYT_FIZ'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 9. Sınıf Fizik Bilimi ve Kariyer Keşfi');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 9. Sınıf Kuvvet ve Hareket', 12, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TYT_FIZ'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 9. Sınıf Kuvvet ve Hareket');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 9. Sınıf Akışkanlar', 13, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TYT_FIZ'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 9. Sınıf Akışkanlar');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 9. Sınıf Enerji', 14, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TYT_FIZ'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 9. Sınıf Enerji');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 10. Sınıf Kuvvet ve Hareket', 15, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TYT_FIZ'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 10. Sınıf Kuvvet ve Hareket');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 10. Sınıf Enerji', 16, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TYT_FIZ'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 10. Sınıf Enerji');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 10. Sınıf Elektrik', 17, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TYT_FIZ'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 10. Sınıf Elektrik');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 10. Sınıf Dalgalar', 18, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TYT_FIZ'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 10. Sınıf Dalgalar');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Etkileşim', 11, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TYT_KIM'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Etkileşim');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Çeşitlilik', 12, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TYT_KIM'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Çeşitlilik');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Sürdürülebilirlik (Redoks, Yeşil Kimya)', 13, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TYT_KIM'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Sürdürülebilirlik (Redoks, Yeşil Kimya)');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 9. Sınıf Yaşam', 11, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TYT_BIY'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 9. Sınıf Yaşam');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 9. Sınıf Organizasyon', 12, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TYT_BIY'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 9. Sınıf Organizasyon');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 10. Sınıf Enerji', 13, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TYT_BIY'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 10. Sınıf Enerji');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 10. Sınıf Ekoloji', 14, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'YKS' AND es.`code` = 'TYT' AND s.`code` = 'TYT_BIY'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 10. Sınıf Ekoloji');--> statement-breakpoint
INSERT OR IGNORE INTO `exam_templates` (`code`, `name`, `is_active`, `created_at`, `updated_at`) VALUES ('DGS', 'DGS', 1, unixepoch(), unixepoch());--> statement-breakpoint
INSERT OR IGNORE INTO `exam_sections` (`exam_template_id`, `code`, `name`, `wrong_penalty_divisor`, `sort_order`, `created_at`)
SELECT `id`, 'DGS', 'Dikey Geçiş Sınavı', 4, 1, unixepoch() FROM `exam_templates` WHERE `code` = 'DGS';--> statement-breakpoint
INSERT OR IGNORE INTO `subjects` (`exam_section_id`, `code`, `name`, `parent_subject_id`, `is_scored`, `track_codes`, `official_question_count`, `sort_order`, `chart_color`, `is_active`)
SELECT es.`id`, 'TUR', 'Türkçe', NULL, 1, NULL, 50, 1, '#E11D48', 1 FROM `exam_sections` es
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS';--> statement-breakpoint
INSERT OR IGNORE INTO `subjects` (`exam_section_id`, `code`, `name`, `parent_subject_id`, `is_scored`, `track_codes`, `official_question_count`, `sort_order`, `chart_color`, `is_active`)
SELECT es.`id`, 'MAT', 'Matematik', NULL, 1, NULL, 50, 2, '#2563EB', 1 FROM `exam_sections` es
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS';--> statement-breakpoint
INSERT OR IGNORE INTO `subjects` (`exam_section_id`, `code`, `name`, `parent_subject_id`, `is_scored`, `track_codes`, `official_question_count`, `sort_order`, `chart_color`, `is_active`)
SELECT es.`id`, 'GEO', 'Geometri', (SELECT m.`id` FROM `subjects` m WHERE m.`exam_section_id` = es.`id` AND m.`code` = 'MAT'), 0, NULL, NULL, 3, NULL, 1 FROM `exam_sections` es
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS';--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Sözcükte Anlam', 1, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Sözcükte Anlam');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Söz Yorumu', 2, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Söz Yorumu');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Deyim ve Atasözü', 3, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Deyim ve Atasözü');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Cümlede Anlam', 4, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Cümlede Anlam');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Paragrafta Anlam ve Ana Düşünce', 5, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Paragrafta Anlam ve Ana Düşünce');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Paragrafta Yapı', 6, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Paragrafta Yapı');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Paragrafta Anlatım Teknikleri', 7, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Paragrafta Anlatım Teknikleri');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Ses Bilgisi', 8, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Ses Bilgisi');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Yazım Kuralları', 9, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Yazım Kuralları');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Noktalama İşaretleri', 10, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Noktalama İşaretleri');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Sözcükte Yapı ve Ekler', 11, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Sözcükte Yapı ve Ekler');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'İsimler', 12, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'İsimler');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Zamirler', 13, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Zamirler');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Sıfatlar', 14, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Sıfatlar');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Zarflar', 15, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Zarflar');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Edat-Bağlaç-Ünlem', 16, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Edat-Bağlaç-Ünlem');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Fiiller ve Ek Fiil', 17, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Fiiller ve Ek Fiil');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Fiilimsiler', 18, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Fiilimsiler');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Fiilde Çatı', 19, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Fiilde Çatı');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Cümlenin Ögeleri', 20, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Cümlenin Ögeleri');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Cümle Türleri', 21, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Cümle Türleri');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Anlatım Bozuklukları', 22, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Anlatım Bozuklukları');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Sözel Mantık', 23, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Sözel Mantık');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Sözcükte Anlam', 24, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Sözcükte Anlam');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Cümlede Anlam', 25, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Cümlede Anlam');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Paragrafta Anlam', 26, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Paragrafta Anlam');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Anlatım Biçimleri', 27, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Anlatım Biçimleri');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Düşünceyi Geliştirme Yolları', 28, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Düşünceyi Geliştirme Yolları');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Ses Bilgisi', 29, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Ses Bilgisi');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Yazım Kuralları', 30, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Yazım Kuralları');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Noktalama İşaretleri', 31, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Noktalama İşaretleri');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Sözcük Türleri', 32, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Sözcük Türleri');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Fiiller', 33, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Fiiller');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Ekler', 34, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Ekler');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Cümlenin Ögeleri', 35, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Cümlenin Ögeleri');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · Anlatım Bozuklukları', 36, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'TUR'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · Anlatım Bozuklukları');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Temel Kavramlar', 1, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Temel Kavramlar');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Sayı Basamakları', 2, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Sayı Basamakları');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Bölme ve Bölünebilme', 3, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Bölme ve Bölünebilme');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'EBOB-EKOK', 4, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'EBOB-EKOK');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Rasyonel Sayılar', 5, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Rasyonel Sayılar');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Ondalık Sayılar', 6, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Ondalık Sayılar');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Basit Eşitsizlikler', 7, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Basit Eşitsizlikler');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Mutlak Değer', 8, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Mutlak Değer');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Üslü Sayılar', 9, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Üslü Sayılar');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Köklü Sayılar', 10, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Köklü Sayılar');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Çarpanlara Ayırma', 11, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Çarpanlara Ayırma');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Oran-Orantı', 12, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Oran-Orantı');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Denklem Çözme', 13, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Denklem Çözme');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Sayı Problemleri', 14, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Sayı Problemleri');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Kesir Problemleri', 15, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Kesir Problemleri');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Yaş Problemleri', 16, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Yaş Problemleri');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Hareket Problemleri', 17, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Hareket Problemleri');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'İşçi-Havuz Problemleri', 18, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'İşçi-Havuz Problemleri');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Yüzde-Kar-Zarar Problemleri', 19, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Yüzde-Kar-Zarar Problemleri');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Faiz Problemleri', 20, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Faiz Problemleri');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Karışım Problemleri', 21, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Karışım Problemleri');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Grafik Problemleri', 22, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Grafik Problemleri');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Kümeler', 23, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Kümeler');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Fonksiyonlar', 24, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Fonksiyonlar');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Permütasyon', 25, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Permütasyon');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Kombinasyon', 26, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Kombinasyon');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Olasılık', 27, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Olasılık');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Veri ve İstatistik', 28, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Veri ve İstatistik');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Sayısal Mantık', 29, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Sayısal Mantık');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 9. Sınıf Sayılar', 30, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 9. Sınıf Sayılar');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 9. Sınıf Nicelikler ve Değişimler', 31, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 9. Sınıf Nicelikler ve Değişimler');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 9. Sınıf Algoritma ve Bilişim', 32, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 9. Sınıf Algoritma ve Bilişim');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 9. Sınıf İstatistiksel Araştırma Süreci', 33, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 9. Sınıf İstatistiksel Araştırma Süreci');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 9. Sınıf Veriden Olasılığa', 34, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 9. Sınıf Veriden Olasılığa');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 10. Sınıf Sayılar', 35, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 10. Sınıf Sayılar');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 10. Sınıf Nicelikler ve Değişimler', 36, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 10. Sınıf Nicelikler ve Değişimler');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 10. Sınıf Sayma, Algoritma ve Bilişim', 37, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 10. Sınıf Sayma, Algoritma ve Bilişim');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 10. Sınıf İstatistiksel Araştırma Süreci', 38, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 10. Sınıf İstatistiksel Araştırma Süreci');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 10. Sınıf Veriden Olasılığa', 39, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'MAT'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 10. Sınıf Veriden Olasılığa');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Doğruda Açılar', 1, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'GEO'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Doğruda Açılar');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Üçgende Açılar', 2, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'GEO'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Üçgende Açılar');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Üçgende Alan', 3, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'GEO'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Üçgende Alan');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Üçgende Benzerlik', 4, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'GEO'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Üçgende Benzerlik');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Açı-Kenar Bağıntıları', 5, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'GEO'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Açı-Kenar Bağıntıları');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Özel Üçgenler', 6, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'GEO'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Özel Üçgenler');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Açıortay', 7, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'GEO'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Açıortay');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Kenarortay', 8, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'GEO'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Kenarortay');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Çokgenler', 9, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'GEO'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Çokgenler');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Dörtgenler', 10, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'GEO'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Dörtgenler');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Çember ve Daire', 11, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'GEO'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Çember ve Daire');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Analitik Geometri', 12, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'GEO'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Analitik Geometri');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Katı Cisimler', 13, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'GEO'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Katı Cisimler');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 9. Sınıf Geometrik Şekiller', 14, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'GEO'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 9. Sınıf Geometrik Şekiller');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 9. Sınıf Eşlik ve Benzerlik', 15, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'GEO'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 9. Sınıf Eşlik ve Benzerlik');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 10. Sınıf Geometrik Şekiller (Trigonometriye Giriş)', 16, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'GEO'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 10. Sınıf Geometrik Şekiller (Trigonometriye Giriş)');--> statement-breakpoint
INSERT INTO `topics` (`subject_id`, `name`, `sort_order`, `is_active`, `created_at`)
SELECT s.`id`, 'Maarif · 10. Sınıf Analitik İnceleme', 17, 1, unixepoch() FROM `subjects` s
JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
WHERE et.`code` = 'DGS' AND es.`code` = 'DGS' AND s.`code` = 'GEO'
AND NOT EXISTS (SELECT 1 FROM `topics` t WHERE t.`subject_id` = s.`id` AND t.`name` = 'Maarif · 10. Sınıf Analitik İnceleme');
