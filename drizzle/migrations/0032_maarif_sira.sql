-- Maarif konularını TYT'de eski konuların ARKASINA taşır — yalnız veri.
-- 0031 sıra numaralarını seed'e göre verdi (ör. Matematik 30-39), ama prod'da
-- TYT derslerinde seed dışı eklenmiş konular var (Matematik'te 51 eski konu),
-- bu yüzden Maarif konuları onların arasına karışıyordu. +1000 kendi aralarındaki
-- sırayı korur. `< 1000` koşulu tekrar çalıştırmayı güvenli kılar. DGS'ye
-- dokunulmaz (orada seed dışı konu yok).
UPDATE `topics` SET `sort_order` = `sort_order` + 1000
WHERE `name` LIKE 'Maarif · %' AND `sort_order` < 1000
AND `subject_id` IN (
  SELECT s.`id` FROM `subjects` s
  JOIN `exam_sections` es ON es.`id` = s.`exam_section_id`
  JOIN `exam_templates` et ON et.`id` = es.`exam_template_id`
  WHERE et.`code` = 'YKS' AND es.`code` = 'TYT'
);
