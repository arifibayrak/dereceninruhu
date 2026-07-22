ALTER TABLE `testimonials` ADD `proof_image_url` text;--> statement-breakpoint
ALTER TABLE `testimonials` ADD `video_url` text;--> statement-breakpoint
ALTER TABLE `testimonials` ADD `is_featured` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `testimonials` ADD `consent_at` integer;