CREATE TABLE `ai_audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor_user_id` text NOT NULL,
	`enrollment_id` integer,
	`thread_id` integer,
	`tool_name` text NOT NULL,
	`args_json` text,
	`decision` text NOT NULL,
	`result_status` text,
	`error` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`thread_id`) REFERENCES `chat_threads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ai_audit_log_actor_idx` ON `ai_audit_log` (`actor_user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `ai_audit_log_enrollment_idx` ON `ai_audit_log` (`enrollment_id`);--> statement-breakpoint
CREATE TABLE `ai_proposals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`transcript_id` integer NOT NULL,
	`enrollment_id` integer NOT NULL,
	`kind` text NOT NULL,
	`payload_json` text NOT NULL,
	`source_quote` text,
	`confidence` real,
	`status` text DEFAULT 'proposed' NOT NULL,
	`result_json` text,
	`reviewed_by_user_id` text,
	`applied_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`transcript_id`) REFERENCES `transcripts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ai_proposals_transcript_idx` ON `ai_proposals` (`transcript_id`);--> statement-breakpoint
CREATE INDEX `ai_proposals_enrollment_idx` ON `ai_proposals` (`enrollment_id`);--> statement-breakpoint
CREATE INDEX `ai_proposals_status_idx` ON `ai_proposals` (`status`);--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`thread_id` integer NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`tool_calls_json` text,
	`input_tokens` integer,
	`output_tokens` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`thread_id`) REFERENCES `chat_threads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `chat_messages_thread_idx` ON `chat_messages` (`thread_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `chat_threads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`enrollment_id` integer,
	`owner_user_id` text NOT NULL,
	`audience` text NOT NULL,
	`title` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `chat_threads_owner_idx` ON `chat_threads` (`owner_user_id`);--> statement-breakpoint
CREATE INDEX `chat_threads_enrollment_idx` ON `chat_threads` (`enrollment_id`);--> statement-breakpoint
CREATE TABLE `transcripts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`enrollment_id` integer NOT NULL,
	`coaching_session_id` integer,
	`source` text NOT NULL,
	`audio_r2_key` text,
	`raw_text` text,
	`language` text DEFAULT 'tr' NOT NULL,
	`word_count` integer,
	`digest` text,
	`status` text DEFAULT 'uploaded' NOT NULL,
	`consent_state` text DEFAULT 'pending' NOT NULL,
	`error_message` text,
	`created_by_user_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`coaching_session_id`) REFERENCES `coaching_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `transcripts_enrollment_idx` ON `transcripts` (`enrollment_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `transcripts_session_idx` ON `transcripts` (`coaching_session_id`);--> statement-breakpoint
CREATE INDEX `transcripts_status_idx` ON `transcripts` (`status`);--> statement-breakpoint
ALTER TABLE `coaching_sessions` ADD `meeting_url` text;--> statement-breakpoint
ALTER TABLE `coaching_sessions` ADD `meeting_provider` text;