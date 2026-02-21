CREATE TABLE `api_rate_call` (
	`id` text PRIMARY KEY NOT NULL,
	`endpoint` text NOT NULL,
	`lastAttemptAt` integer NOT NULL,
	`lastSuccessAt` integer,
	`errorCount` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_rate_call_endpoint_unique` ON `api_rate_call` (`endpoint`);--> statement-breakpoint
CREATE INDEX `api_rate_call_endpoint_idx` ON `api_rate_call` (`endpoint`);