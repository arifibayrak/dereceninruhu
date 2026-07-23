CREATE TABLE `resource_question_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`enrollment_id` integer NOT NULL,
	`resource_id` integer NOT NULL,
	`log_date` integer NOT NULL,
	`question_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `resource_question_logs_enrollment_resource_date_uq` ON `resource_question_logs` (`enrollment_id`,`resource_id`,`log_date`);--> statement-breakpoint
CREATE INDEX `resource_question_logs_enrollment_idx` ON `resource_question_logs` (`enrollment_id`);--> statement-breakpoint
ALTER TABLE `resources` ADD `url` text;