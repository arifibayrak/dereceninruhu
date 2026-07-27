ALTER TABLE `enrollments` ADD `secondary_exam_template_id` integer REFERENCES exam_templates(id);--> statement-breakpoint
ALTER TABLE `enrollments` ADD `secondary_track_id` integer REFERENCES tracks(id);--> statement-breakpoint
-- Otomatik yayın geçişi: "Programı Yayınla" adımı kaldırıldı. Koçun kurduğu ve
-- en az bir görevi olan geçmiş taslaklar da artık öğrenciye açık olmalı.
-- Öğrencinin KENDİ önerileri (proposed_by_student) koç onayını beklemeye devam
-- eder. `mode: "timestamp"` saniye tutar — unixepoch() birimiyle uyumludur.
UPDATE `weekly_plans`
SET `status` = 'published', `updated_at` = unixepoch()
WHERE `status` = 'draft'
  AND `proposed_by_student` = 0
  AND EXISTS (
    SELECT 1 FROM `plan_tasks` WHERE `plan_tasks`.`weekly_plan_id` = `weekly_plans`.`id`
  );
