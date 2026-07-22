CREATE TABLE `site_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`whatsapp_phone` text,
	`whatsapp_message` text DEFAULT 'Merhaba, YKS koçluk süreci hakkında bilgi almak istiyorum.' NOT NULL,
	`whatsapp_visible` integer DEFAULT true NOT NULL,
	`instagram_url` text,
	`tiktok_url` text,
	`youtube_url` text,
	`public_stats_visible` integer DEFAULT false NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `question_logs` ADD `correct_count` integer;--> statement-breakpoint
ALTER TABLE `question_logs` ADD `wrong_count` integer;--> statement-breakpoint
ALTER TABLE `question_logs` ADD `blank_count` integer;