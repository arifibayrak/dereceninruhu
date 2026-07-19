CREATE TABLE `extension_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`coach_user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`label` text,
	`last_used_at` integer,
	`revoked_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`coach_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `extension_tokens_token_hash_unique` ON `extension_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `extension_tokens_coach_idx` ON `extension_tokens` (`coach_user_id`);