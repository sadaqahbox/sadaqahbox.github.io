CREATE TABLE `Box` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`count` integer DEFAULT 0 NOT NULL,
	`totalValue` real DEFAULT 0 NOT NULL,
	`currencyId` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`currencyId`) REFERENCES `Currency`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `Box_createdAt_idx` ON `Box` (`createdAt`);--> statement-breakpoint
CREATE TABLE `Collection` (
	`id` text PRIMARY KEY NOT NULL,
	`boxId` text NOT NULL,
	`emptiedAt` integer NOT NULL,
	`sadaqahsCollected` integer NOT NULL,
	`totalValue` real NOT NULL,
	`currencyId` text NOT NULL,
	FOREIGN KEY (`boxId`) REFERENCES `Box`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`currencyId`) REFERENCES `Currency`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `Collection_boxId_idx` ON `Collection` (`boxId`);--> statement-breakpoint
CREATE INDEX `Collection_emptiedAt_idx` ON `Collection` (`emptiedAt`);--> statement-breakpoint
CREATE INDEX `Collection_currencyId_idx` ON `Collection` (`currencyId`);--> statement-breakpoint
CREATE TABLE `Currency` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`symbol` text,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Currency_code_unique` ON `Currency` (`code`);--> statement-breakpoint
CREATE INDEX `Currency_code_idx` ON `Currency` (`code`);--> statement-breakpoint
CREATE TABLE `Sadaqah` (
	`id` text PRIMARY KEY NOT NULL,
	`boxId` text NOT NULL,
	`value` real NOT NULL,
	`currencyId` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`boxId`) REFERENCES `Box`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`currencyId`) REFERENCES `Currency`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `Sadaqah_boxId_idx` ON `Sadaqah` (`boxId`);--> statement-breakpoint
CREATE INDEX `Sadaqah_createdAt_idx` ON `Sadaqah` (`createdAt`);--> statement-breakpoint
CREATE INDEX `Sadaqah_currencyId_idx` ON `Sadaqah` (`currencyId`);