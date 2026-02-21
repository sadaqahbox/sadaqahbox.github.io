CREATE TABLE `currency_rate_attempt` (
	`id` text PRIMARY KEY NOT NULL,
	`currencyCode` text NOT NULL,
	`lastAttemptAt` integer NOT NULL,
	`lastSuccessAt` integer,
	`usdValue` real,
	`sourceApi` text,
	`attemptCount` integer DEFAULT 0 NOT NULL,
	`found` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `currency_rate_attempt_currencyCode_unique` ON `currency_rate_attempt` (`currencyCode`);--> statement-breakpoint
CREATE INDEX `currency_rate_attempt_code_idx` ON `currency_rate_attempt` (`currencyCode`);--> statement-breakpoint
CREATE INDEX `currency_rate_attempt_last_attempt_idx` ON `currency_rate_attempt` (`lastAttemptAt`);--> statement-breakpoint
CREATE INDEX `currency_rate_attempt_found_idx` ON `currency_rate_attempt` (`found`);