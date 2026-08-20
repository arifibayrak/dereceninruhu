CREATE TABLE `enrollment_packages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`enrollment_id` integer NOT NULL,
	`package_id` integer,
	`name_snapshot` text NOT NULL,
	`price_kurus_snapshot` integer NOT NULL,
	`kind` text DEFAULT 'kocluk' NOT NULL,
	`lesson_hours_granted` integer DEFAULT 0 NOT NULL,
	`starts_on` integer,
	`ends_on` integer,
	`status` text DEFAULT 'aktif' NOT NULL,
	`note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`package_id`) REFERENCES `packages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `enrollment_packages_enrollment_idx` ON `enrollment_packages` (`enrollment_id`,`status`);--> statement-breakpoint
CREATE TABLE `private_lessons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`enrollment_id` integer NOT NULL,
	`enrollment_package_id` integer,
	`subject_id` integer,
	`topic_id` integer,
	`instructor_user_id` text,
	`instructor_profile_id` integer,
	`scheduled_at` integer,
	`held_at` integer,
	`duration_minutes` integer DEFAULT 60 NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`counts_against_quota` integer DEFAULT true NOT NULL,
	`note` text,
	`student_visible_note` text,
	`meeting_url` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`enrollment_package_id`) REFERENCES `enrollment_packages`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`instructor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`instructor_profile_id`) REFERENCES `coach_profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `private_lessons_enrollment_idx` ON `private_lessons` (`enrollment_id`,`scheduled_at`);--> statement-breakpoint
CREATE INDEX `private_lessons_package_idx` ON `private_lessons` (`enrollment_package_id`);--> statement-breakpoint
ALTER TABLE `fee_plans` ADD `enrollment_package_id` integer REFERENCES enrollment_packages(id);--> statement-breakpoint
ALTER TABLE `packages` ADD `kind` text DEFAULT 'kocluk' NOT NULL;--> statement-breakpoint
ALTER TABLE `packages` ADD `lesson_hours` integer;--> statement-breakpoint
ALTER TABLE `packages` ADD `period_months` integer;