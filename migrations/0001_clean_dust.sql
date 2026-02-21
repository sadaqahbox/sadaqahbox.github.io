CREATE TABLE `BoxTag` (
	`boxId` text NOT NULL,
	`tagId` text NOT NULL,
	FOREIGN KEY (`boxId`) REFERENCES `Box`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tagId`) REFERENCES `Tag`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `BoxTag_boxId_idx` ON `BoxTag` (`boxId`);--> statement-breakpoint
CREATE INDEX `BoxTag_tagId_idx` ON `BoxTag` (`tagId`);--> statement-breakpoint
CREATE TABLE `Tag` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Tag_name_unique` ON `Tag` (`name`);--> statement-breakpoint
CREATE INDEX `Tag_name_idx` ON `Tag` (`name`);