ALTER TABLE `fee_plans` ADD `auto_renew` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `fee_plans` ADD `next_billing_on` integer;