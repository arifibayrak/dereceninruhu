ALTER TABLE `coach_profiles` ADD `slug` text;--> statement-breakpoint
ALTER TABLE `coach_profiles` ADD `title` text;--> statement-breakpoint
ALTER TABLE `coach_profiles` ADD `location` text;--> statement-breakpoint
ALTER TABLE `coach_profiles` ADD `headline` text;--> statement-breakpoint
ALTER TABLE `coach_profiles` ADD `cover_image_url` text;--> statement-breakpoint
ALTER TABLE `coach_profiles` ADD `links` text;--> statement-breakpoint
ALTER TABLE `coach_profiles` ADD `proof_url` text;--> statement-breakpoint
CREATE UNIQUE INDEX `coach_profiles_slug_unique` ON `coach_profiles` (`slug`);