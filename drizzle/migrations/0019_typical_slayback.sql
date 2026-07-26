CREATE TABLE `plan_day_layouts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`enrollment_id` integer NOT NULL,
	`day` integer NOT NULL,
	`subject_ids` text DEFAULT '[]' NOT NULL,
	`color` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `plan_day_layouts_enrollment_day_uq` ON `plan_day_layouts` (`enrollment_id`,`day`);--> statement-breakpoint
ALTER TABLE `mock_exams` ADD `is_combined` integer DEFAULT false NOT NULL;