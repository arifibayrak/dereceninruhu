PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_coach_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text,
	`slug` text,
	`display_name` text NOT NULL,
	`title` text,
	`location` text,
	`headline` text,
	`bio` text,
	`photo_url` text,
	`cover_image_url` text,
	`subjects` text,
	`achievements` text,
	`links` text,
	`proof_url` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_coach_profiles`("id", "user_id", "slug", "display_name", "title", "location", "headline", "bio", "photo_url", "cover_image_url", "subjects", "achievements", "links", "proof_url", "sort_order", "is_active", "created_at", "updated_at") SELECT "id", "user_id", "slug", "display_name", "title", "location", "headline", "bio", "photo_url", "cover_image_url", "subjects", "achievements", "links", "proof_url", "sort_order", "is_active", "created_at", "updated_at" FROM `coach_profiles`;--> statement-breakpoint
DROP TABLE `coach_profiles`;--> statement-breakpoint
ALTER TABLE `__new_coach_profiles` RENAME TO `coach_profiles`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `coach_profiles_user_id_unique` ON `coach_profiles` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `coach_profiles_slug_unique` ON `coach_profiles` (`slug`);