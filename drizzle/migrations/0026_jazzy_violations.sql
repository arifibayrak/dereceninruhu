CREATE TABLE `dev_usage_snapshot` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`measured_at` integer NOT NULL,
	`first_at` integer,
	`last_at` integer,
	`model` text NOT NULL,
	`calls` integer DEFAULT 0 NOT NULL,
	`input_tokens` integer DEFAULT 0 NOT NULL,
	`output_tokens` integer DEFAULT 0 NOT NULL,
	`cache_read_tokens` integer DEFAULT 0 NOT NULL,
	`cache_write_5m_tokens` integer DEFAULT 0 NOT NULL,
	`cache_write_1h_tokens` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `dev_usage_snapshot_measured_idx` ON `dev_usage_snapshot` (`measured_at`);