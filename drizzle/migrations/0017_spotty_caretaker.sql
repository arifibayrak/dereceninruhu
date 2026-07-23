PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_plan_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`weekly_plan_id` integer NOT NULL,
	`day` integer,
	`slot` integer DEFAULT 0 NOT NULL,
	`subject_id` integer,
	`topic_id` integer,
	`resource_id` integer,
	`description` text,
	`target_questions` integer,
	`is_done` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`weekly_plan_id`) REFERENCES `weekly_plans`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_plan_tasks`("id", "weekly_plan_id", "day", "slot", "subject_id", "topic_id", "resource_id", "description", "target_questions", "is_done", "created_at") SELECT "id", "weekly_plan_id", "day", "slot", "subject_id", "topic_id", "resource_id", "description", "target_questions", "is_done", "created_at" FROM `plan_tasks`;--> statement-breakpoint
DROP TABLE `plan_tasks`;--> statement-breakpoint
ALTER TABLE `__new_plan_tasks` RENAME TO `plan_tasks`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `plan_tasks_plan_idx` ON `plan_tasks` (`weekly_plan_id`);--> statement-breakpoint
ALTER TABLE `weekly_plans` ADD `proposed_by_student` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `weekly_plans` ADD `student_submitted_at` integer;