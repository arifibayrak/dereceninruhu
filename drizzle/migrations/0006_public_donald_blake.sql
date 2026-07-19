CREATE TABLE `payment_notices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`enrollment_id` integer NOT NULL,
	`invoice_id` integer,
	`amount_kurus` integer NOT NULL,
	`paid_on` integer NOT NULL,
	`method` text DEFAULT 'havale' NOT NULL,
	`note` text,
	`status` text DEFAULT 'bekliyor' NOT NULL,
	`resolved_payment_id` integer,
	`resolved_by_user_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`resolved_payment_id`) REFERENCES `payments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`resolved_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `payment_notices_enrollment_idx` ON `payment_notices` (`enrollment_id`);--> statement-breakpoint
CREATE INDEX `payment_notices_status_idx` ON `payment_notices` (`status`);