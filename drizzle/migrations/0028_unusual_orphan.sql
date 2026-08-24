ALTER TABLE `enrollment_packages` ADD `renewal` text DEFAULT 'yok' NOT NULL;--> statement-breakpoint
ALTER TABLE `enrollment_packages` ADD `hours_per_period` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `packages` ADD `renewal` text DEFAULT 'yok' NOT NULL;