CREATE INDEX `Box_userId_createdAt_idx` ON `Box` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `Box_userId_count_idx` ON `Box` (`userId`,`count`);--> statement-breakpoint
CREATE INDEX `Box_userId_totalValue_idx` ON `Box` (`userId`,`totalValue`);--> statement-breakpoint
CREATE INDEX `Sadaqah_boxId_createdAt_idx` ON `Sadaqah` (`boxId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `Sadaqah_userId_createdAt_idx` ON `Sadaqah` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `Sadaqah_currencyId_value_idx` ON `Sadaqah` (`currencyId`,`value`);