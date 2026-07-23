-- KPSS Genel Yetenek (KPSS_GY) soru-takibi düzeltmesi (2026-07-23)
-- Koç geri bildirimi: Türkçe altına "Paragraf" eklensin; Matematik altındaki
-- "Sayısal Mantık" -> "Problemler" olsun. Kod (MANTIK) korunur; girilmiş veriler
-- bağlı kalır. Idempotent — tekrar çalıştırmak güvenli.

-- Sıralamayı Paragraf, Türkçe'nin hemen altına gelecek şekilde aç.
UPDATE subjects SET sort_order = 3
 WHERE code = 'MAT'
   AND exam_section_id = (SELECT id FROM exam_sections WHERE code = 'KPSS_GY');

UPDATE subjects SET sort_order = 4
 WHERE code = 'GEO'
   AND exam_section_id = (SELECT id FROM exam_sections WHERE code = 'KPSS_GY');

-- "Sayısal Mantık" -> "Problemler" (kod MANTIK korunur).
UPDATE subjects SET name = 'Problemler', sort_order = 5
 WHERE code = 'MANTIK'
   AND exam_section_id = (SELECT id FROM exam_sections WHERE code = 'KPSS_GY');

-- Türkçe altına "Paragraf" (puanlanmaz; TUR'a roll-up). (section, code) tekil
-- indeks sayesinde OR IGNORE ile tekrar eklenmez.
INSERT OR IGNORE INTO subjects
  (exam_section_id, code, name, parent_subject_id, is_scored, sort_order, is_active)
SELECT sec.id, 'PARAGRAF', 'Paragraf', tur.id, 0, 2, 1
  FROM exam_sections sec
  JOIN subjects tur ON tur.exam_section_id = sec.id AND tur.code = 'TUR'
 WHERE sec.code = 'KPSS_GY';
