ALTER TABLE `plan_tasks` ADD `resource_ids` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
-- Mevcut tekil kaynağı listeye taşı — hiçbir görev kaynağını kaybetmesin.
UPDATE `plan_tasks` SET `resource_ids` = '[' || `resource_id` || ']' WHERE `resource_id` IS NOT NULL;
