ALTER TABLE `students` ADD `segment` text;--> statement-breakpoint
CREATE INDEX `students_segment_idx` ON `students` (`segment`);