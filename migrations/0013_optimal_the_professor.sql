ALTER TABLE `Box` ADD `baseCurrencyId` text REFERENCES Currency(id);--> statement-breakpoint
CREATE INDEX `Box_baseCurrencyId_idx` ON `Box` (`baseCurrencyId`);