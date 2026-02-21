ALTER TABLE `Box` ADD `userId` text NOT NULL REFERENCES users(id);--> statement-breakpoint
CREATE INDEX `Box_userId_idx` ON `Box` (`userId`);--> statement-breakpoint
ALTER TABLE `Collection` ADD `userId` text NOT NULL REFERENCES users(id);--> statement-breakpoint
CREATE INDEX `Collection_userId_idx` ON `Collection` (`userId`);--> statement-breakpoint
ALTER TABLE `Sadaqah` ADD `userId` text NOT NULL REFERENCES users(id);--> statement-breakpoint
CREATE INDEX `Sadaqah_userId_idx` ON `Sadaqah` (`userId`);