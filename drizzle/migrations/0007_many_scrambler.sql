CREATE TABLE `study_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`enrollment_id` integer NOT NULL,
	`log_date` integer NOT NULL,
	`subject_id` integer,
	`minutes` integer NOT NULL,
	`source` text NOT NULL,
	`note` text,
	`proof_key` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `study_logs_enrollment_date_idx` ON `study_logs` (`enrollment_id`,`log_date`);--> statement-breakpoint
CREATE INDEX `study_logs_enrollment_subject_idx` ON `study_logs` (`enrollment_id`,`subject_id`);