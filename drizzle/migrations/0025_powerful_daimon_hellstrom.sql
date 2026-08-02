CREATE TABLE `ai_usage_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`feature` text NOT NULL,
	`model` text NOT NULL,
	`input_tokens` integer DEFAULT 0 NOT NULL,
	`output_tokens` integer DEFAULT 0 NOT NULL,
	`cached_input_tokens` integer DEFAULT 0 NOT NULL,
	`audio_seconds` integer,
	`enrollment_id` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ai_usage_log_created_idx` ON `ai_usage_log` (`created_at`);--> statement-breakpoint
CREATE INDEX `ai_usage_log_feature_created_idx` ON `ai_usage_log` (`feature`,`created_at`);