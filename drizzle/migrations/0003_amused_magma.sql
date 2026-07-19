CREATE TABLE `coach_applications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`subjects` text,
	`experience` text,
	`link` text,
	`message` text,
	`status` text DEFAULT 'yeni' NOT NULL,
	`reviewed_by_user_id` text,
	`source` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `coach_applications_status_idx` ON `coach_applications` (`status`);--> statement-breakpoint
CREATE TABLE `cohort_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`donem_label` text DEFAULT 'Güncel Dönem' NOT NULL,
	`display_capacity` integer,
	`display_filled` integer DEFAULT 0 NOT NULL,
	`closes_on` integer,
	`status` text DEFAULT 'acik' NOT NULL,
	`waitlist_open` integer DEFAULT true NOT NULL,
	`scarcity_visible` integer DEFAULT true NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `waitlist_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`exam` text,
	`message` text,
	`status` text DEFAULT 'bekliyor' NOT NULL,
	`source` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `waitlist_status_idx` ON `waitlist_entries` (`status`);