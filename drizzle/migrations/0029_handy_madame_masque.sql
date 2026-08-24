CREATE TABLE `impact_stats` (
	`id` integer PRIMARY KEY NOT NULL,
	`total_questions` integer DEFAULT 0 NOT NULL,
	`total_mocks` integer DEFAULT 0 NOT NULL,
	`median_net_gain` real,
	`computed_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
