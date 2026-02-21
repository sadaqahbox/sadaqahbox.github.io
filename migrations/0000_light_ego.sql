CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `accounts_userId_idx` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE TABLE `api_rate_call` (
	`id` text PRIMARY KEY NOT NULL,
	`endpoint` text NOT NULL,
	`lastAttemptAt` integer NOT NULL,
	`lastSuccessAt` integer,
	`errorCount` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_rate_call_endpoint_unique` ON `api_rate_call` (`endpoint`);--> statement-breakpoint
CREATE INDEX `api_rate_call_endpoint_idx` ON `api_rate_call` (`endpoint`);--> statement-breakpoint
CREATE TABLE `apikeys` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`start` text,
	`prefix` text,
	`key` text NOT NULL,
	`user_id` text NOT NULL,
	`refill_interval` integer,
	`refill_amount` integer,
	`last_refill_at` integer,
	`enabled` integer DEFAULT true,
	`rate_limit_enabled` integer DEFAULT true,
	`rate_limit_time_window` integer DEFAULT 86400000,
	`rate_limit_max` integer DEFAULT 10,
	`request_count` integer DEFAULT 0,
	`remaining` integer,
	`last_request` integer,
	`expires_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`permissions` text,
	`metadata` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `apikeys_key_idx` ON `apikeys` (`key`);--> statement-breakpoint
CREATE INDEX `apikeys_userId_idx` ON `apikeys` (`user_id`);--> statement-breakpoint
CREATE TABLE `box` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`metadata` text,
	`count` integer DEFAULT 0 NOT NULL,
	`totalValue` real DEFAULT 0 NOT NULL,
	`totalValueExtra` text,
	`currencyId` text,
	`baseCurrencyId` text,
	`userId` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`currencyId`) REFERENCES `currency`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`baseCurrencyId`) REFERENCES `currency`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `box_created_at_idx` ON `box` (`createdAt`);--> statement-breakpoint
CREATE INDEX `box_user_id_idx` ON `box` (`userId`);--> statement-breakpoint
CREATE INDEX `box_base_currency_id_idx` ON `box` (`baseCurrencyId`);--> statement-breakpoint
CREATE INDEX `box_user_id_created_at_idx` ON `box` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `box_user_id_count_idx` ON `box` (`userId`,`count`);--> statement-breakpoint
CREATE INDEX `box_user_id_total_value_idx` ON `box` (`userId`,`totalValue`);--> statement-breakpoint
CREATE TABLE `collection` (
	`id` text PRIMARY KEY NOT NULL,
	`boxId` text NOT NULL,
	`userId` text NOT NULL,
	`emptiedAt` integer NOT NULL,
	`totalValue` real NOT NULL,
	`totalValueExtra` text,
	`metadata` text,
	`currencyId` text NOT NULL,
	FOREIGN KEY (`boxId`) REFERENCES `box`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`currencyId`) REFERENCES `currency`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `collection_box_id_idx` ON `collection` (`boxId`);--> statement-breakpoint
CREATE INDEX `collection_user_id_idx` ON `collection` (`userId`);--> statement-breakpoint
CREATE INDEX `collection_emptied_at_idx` ON `collection` (`emptiedAt`);--> statement-breakpoint
CREATE INDEX `collection_currency_id_idx` ON `collection` (`currencyId`);--> statement-breakpoint
CREATE TABLE `currency` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`symbol` text,
	`currencyTypeId` text,
	`usdValue` real,
	`lastRateUpdate` integer,
	FOREIGN KEY (`currencyTypeId`) REFERENCES `currency_type`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `currency_code_unique` ON `currency` (`code`);--> statement-breakpoint
CREATE INDEX `currency_code_idx` ON `currency` (`code`);--> statement-breakpoint
CREATE INDEX `currency_currency_type_id_idx` ON `currency` (`currencyTypeId`);--> statement-breakpoint
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
CREATE INDEX `currency_rate_attempt_found_idx` ON `currency_rate_attempt` (`found`);--> statement-breakpoint
CREATE TABLE `currency_type` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `currency_type_name_unique` ON `currency_type` (`name`);--> statement-breakpoint
CREATE INDEX `currency_type_name_idx` ON `currency_type` (`name`);--> statement-breakpoint
CREATE TABLE `passkeys` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`public_key` text NOT NULL,
	`user_id` text NOT NULL,
	`credential_id` text NOT NULL,
	`counter` integer NOT NULL,
	`device_type` text NOT NULL,
	`backed_up` integer NOT NULL,
	`transports` text,
	`created_at` integer,
	`aaguid` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `passkeys_userId_idx` ON `passkeys` (`user_id`);--> statement-breakpoint
CREATE INDEX `passkeys_credentialID_idx` ON `passkeys` (`credential_id`);--> statement-breakpoint
CREATE TABLE `sadaqah` (
	`id` text PRIMARY KEY NOT NULL,
	`boxId` text NOT NULL,
	`value` real NOT NULL,
	`currencyId` text NOT NULL,
	`userId` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`boxId`) REFERENCES `box`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`currencyId`) REFERENCES `currency`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sadaqah_box_id_idx` ON `sadaqah` (`boxId`);--> statement-breakpoint
CREATE INDEX `sadaqah_created_at_idx` ON `sadaqah` (`createdAt`);--> statement-breakpoint
CREATE INDEX `sadaqah_currency_id_idx` ON `sadaqah` (`currencyId`);--> statement-breakpoint
CREATE INDEX `sadaqah_user_id_idx` ON `sadaqah` (`userId`);--> statement-breakpoint
CREATE INDEX `sadaqah_box_id_created_at_idx` ON `sadaqah` (`boxId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `sadaqah_user_id_created_at_idx` ON `sadaqah` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `sadaqah_currency_id_value_idx` ON `sadaqah` (`currencyId`,`value`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	`timezone` text,
	`city` text,
	`country` text,
	`region` text,
	`region_code` text,
	`colo` text,
	`latitude` text,
	`longitude` text,
	`impersonated_by` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE INDEX `sessions_userId_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`role` text,
	`banned` integer DEFAULT false,
	`ban_reason` text,
	`ban_expires` integer,
	`default_box_id` text,
	`preferred_currency_id` text DEFAULT 'cur_279'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verifications_identifier_idx` ON `verifications` (`identifier`);

-- Insert default currency types
INSERT INTO `currency_type` (`id`, `name`, `description`) VALUES
	('ctyp_1', 'Fiat', 'Government-issued physical currency'),
	('ctyp_2', 'Crypto', 'Digital or cryptocurrency'),
	('ctyp_3', 'Commodity', 'Commodity-backed currency (gold, silver, etc.)');

-- Insert all currencies (229 total: 176 fiat, 23 commodities, 30 cryptos)
INSERT INTO `currency` (`id`, `code`, `name`, `symbol`, `currencyTypeId`) VALUES
  ('cur_100', 'XAU', 'Gold', 'XAU', 'ctyp_3'),
  ('cur_101', 'XAG', 'Silver', 'XAG', 'ctyp_3'),
  ('cur_102', 'XCU', 'Copper', 'Cu', 'ctyp_3'),
  ('cur_103', 'XAL', 'Aluminium', 'Al', 'ctyp_3'),
  ('cur_104', 'XCB', 'Crude Oil (Brent)', 'Brent', 'ctyp_3'),
  ('cur_105', 'XCO', 'Cobalt', 'Co', 'ctyp_3'),
  ('cur_106', 'XCOC', 'Cocoa', 'Cocoa', 'ctyp_3'),
  ('cur_107', 'XCOF', 'Coffee', 'Coffee', 'ctyp_3'),
  ('cur_108', 'XCT', 'Cotton', 'Cotton', 'ctyp_3'),
  ('cur_109', 'XIR', 'Iron Ore', 'Fe', 'ctyp_3'),
  ('cur_110', 'XLP', 'Lithium', 'Li', 'ctyp_3'),
  ('cur_111', 'XNI', 'Nickel', 'Ni', 'ctyp_3'),
  ('cur_112', 'XPB', 'Lead', 'Pb', 'ctyp_3'),
  ('cur_113', 'XPD', 'Palladium', 'XPD', 'ctyp_3'),
  ('cur_114', 'XPL', 'Plutonium', 'Pu', 'ctyp_3'),
  ('cur_115', 'XPT', 'Platinum', 'XPT', 'ctyp_3'),
  ('cur_116', 'XRUB', 'Natural Rubber', 'Rubber', 'ctyp_3'),
  ('cur_117', 'XSB', 'Sugar', 'Sugar', 'ctyp_3'),
  ('cur_118', 'XTN', 'Tin', 'Sn', 'ctyp_3'),
  ('cur_119', 'XUR', 'Uranium', 'U', 'ctyp_3'),
  ('cur_120', 'XWL', 'Wool', 'Wool', 'ctyp_3'),
  ('cur_121', 'XWT', 'Wheat', 'Wheat', 'ctyp_3'),
  ('cur_122', 'XZN', 'Zinc', 'Zn', 'ctyp_3'),
  ('cur_123', 'AED', 'United Arab Emirates Dirham', 'د.إ.', 'ctyp_1'),
  ('cur_124', 'AFN', 'Afghan Afghani', '؋', 'ctyp_1'),
  ('cur_125', 'ALL', 'Albanian Lek', 'L', 'ctyp_1'),
  ('cur_126', 'AMD', 'Armenian Dram', 'դր', 'ctyp_1'),
  ('cur_127', 'ANG', 'Netherlands Antillean Guilder', 'ƒ', 'ctyp_1'),
  ('cur_128', 'AOA', 'Angolan Kwanza', 'Kz', 'ctyp_1'),
  ('cur_129', 'ARS', 'Argentine Peso', '$', 'ctyp_1'),
  ('cur_130', 'AUD', 'Australian Dollar', '$', 'ctyp_1'),
  ('cur_131', 'AWG', 'Aruban Florin', 'ƒ', 'ctyp_1'),
  ('cur_132', 'AZN', 'Azerbaijani Manat', '₼', 'ctyp_1'),
  ('cur_133', 'BAM', 'Bosnia and Herzegovina Convertible Mark', 'КМ', 'ctyp_1'),
  ('cur_134', 'BBD', 'Barbadian Dollar', '$', 'ctyp_1'),
  ('cur_135', 'BDT', 'Bangladeshi Taka', '৳', 'ctyp_1'),
  ('cur_136', 'BGN', 'Bulgarian Lev', 'лв.', 'ctyp_1'),
  ('cur_137', 'BHD', 'Bahraini Dinar', 'د.ب.', 'ctyp_1'),
  ('cur_138', 'BIF', 'Burundian Franc', 'FBu', 'ctyp_1'),
  ('cur_139', 'BMD', 'Bermudian Dollar', '$', 'ctyp_1'),
  ('cur_140', 'BND', 'Brunei Dollar', '$', 'ctyp_1'),
  ('cur_141', 'BOB', 'Bolivian Boliviano', 'Bs.', 'ctyp_1'),
  ('cur_142', 'BOV', 'Bolivian Mvdol', 'BOV', 'ctyp_1'),
  ('cur_143', 'BRL', 'Brazilian Real', 'R$', 'ctyp_1'),
  ('cur_144', 'BSD', 'Bahamian Dollar', '$', 'ctyp_1'),
  ('cur_145', 'BTN', 'Bhutanese Ngultrum', 'Nu.', 'ctyp_1'),
  ('cur_146', 'BWP', 'Botswana Pula', 'P', 'ctyp_1'),
  ('cur_147', 'BYN', 'Belarusian Ruble', 'руб.', 'ctyp_1'),
  ('cur_148', 'BZD', 'Belize Dollar', '$', 'ctyp_1'),
  ('cur_149', 'CAD', 'Canadian Dollar', '$', 'ctyp_1'),
  ('cur_150', 'CDF', 'Congolese Franc', '₣', 'ctyp_1'),
  ('cur_151', 'CHF', 'Swiss Franc', '₣', 'ctyp_1'),
  ('cur_152', 'CKD', 'Cook Islands Dollar', '$', 'ctyp_1'),
  ('cur_153', 'CLF', 'Chilean Unidad de Fomento', 'UF', 'ctyp_1'),
  ('cur_154', 'CLP', 'Chilean Peso', '$', 'ctyp_1'),
  ('cur_155', 'CNY', 'Chinese Yuan', '¥元', 'ctyp_1'),
  ('cur_156', 'COP', 'Colombian Peso', '$', 'ctyp_1'),
  ('cur_157', 'CRC', 'Costa Rican Colon', '₡', 'ctyp_1'),
  ('cur_158', 'CUC', 'Cuban convertible Peso', '$', 'ctyp_1'),
  ('cur_159', 'CUP', 'Cuban Peso', '₱', 'ctyp_1'),
  ('cur_160', 'CVE', 'Cabo Verdean Escudo', '$', 'ctyp_1'),
  ('cur_161', 'CZK', 'Czech Koruna', 'Kč', 'ctyp_1'),
  ('cur_162', 'DJF', 'Djiboutian Franc', 'ف.ج.', 'ctyp_1'),
  ('cur_163', 'DKK', 'Danish Krone', 'kr.', 'ctyp_1'),
  ('cur_164', 'DOP', 'Dominican Peso', '$', 'ctyp_1'),
  ('cur_165', 'DZD', 'Algerian Dinar', 'د.ج.', 'ctyp_1'),
  ('cur_166', 'EGP', 'Egyptian Pound', 'ج.م.', 'ctyp_1'),
  ('cur_167', 'EHP', 'Sahrawi Peseta', 'Ptas.', 'ctyp_1'),
  ('cur_168', 'ERN', 'Eritrean Nakfa', 'ناكفا', 'ctyp_1'),
  ('cur_169', 'ETB', 'Ethiopian Birr', 'ብር', 'ctyp_1'),
  ('cur_170', 'EUR', 'Euro', '€', 'ctyp_1'),
  ('cur_171', 'FJD', 'Fijian Dollar', '$', 'ctyp_1'),
  ('cur_172', 'FKP', 'Falkland Islands Pound', '£', 'ctyp_1'),
  ('cur_173', 'FOK', 'Faroese Króna', 'kr', 'ctyp_1'),
  ('cur_174', 'GBP', 'Pound Sterling', '£', 'ctyp_1'),
  ('cur_175', 'GEL', 'Georgian Lari', '₾', 'ctyp_1'),
  ('cur_176', 'GGP', 'Guernsey Pound', '£', 'ctyp_1'),
  ('cur_177', 'GHS', 'Ghanaian Cedi', '₵', 'ctyp_1'),
  ('cur_178', 'GIP', 'Gibraltar Pound', '£', 'ctyp_1'),
  ('cur_179', 'GMD', 'Gambian Dalasi', 'D', 'ctyp_1'),
  ('cur_180', 'GNF', 'Guinean Franc', 'FG', 'ctyp_1'),
  ('cur_181', 'GTQ', 'Guatemalan Quetzal', '$', 'ctyp_1'),
  ('cur_182', 'GYD', 'Guyanese Dollar', '$', 'ctyp_1'),
  ('cur_183', 'HKD', 'Hong Kong Dollar', '$', 'ctyp_1'),
  ('cur_184', 'HNL', 'Honduran Lempira', 'L', 'ctyp_1'),
  ('cur_185', 'HRK', 'Croatian Kuna', 'kn', 'ctyp_1'),
  ('cur_186', 'HTG', 'Haitian Gourde', 'G', 'ctyp_1'),
  ('cur_187', 'HUF', 'Hungarian Forint', 'Ft', 'ctyp_1'),
  ('cur_188', 'IDR', 'Indonesian Rupiah', 'Rp', 'ctyp_1'),
  ('cur_189', 'ILS', 'Israeli new Shekel', '₪', 'ctyp_1'),
  ('cur_190', 'IMP', 'Manx Pound', '£', 'ctyp_1'),
  ('cur_191', 'INR', 'Indian Rupee', '₹', 'ctyp_1'),
  ('cur_192', 'IQD', 'Iraqi Dinar', 'د.ع.', 'ctyp_1'),
  ('cur_193', 'IRR', 'Iranian Rial', '﷼', 'ctyp_1'),
  ('cur_194', 'ISK', 'Icelandic Krona', 'kr', 'ctyp_1'),
  ('cur_195', 'JEP', 'Jersey Pound', '£', 'ctyp_1'),
  ('cur_196', 'JMD', 'Jamaican Dollar', '$', 'ctyp_1'),
  ('cur_197', 'JOD', 'Jordanian Dinar', 'د.أ.', 'ctyp_1'),
  ('cur_198', 'JPY', 'Japanese Yen', '¥', 'ctyp_1'),
  ('cur_199', 'KES', 'Kenyan Shilling', 'KSh', 'ctyp_1'),
  ('cur_200', 'KGS', 'Kyrgyzstani Som', 'с', 'ctyp_1'),
  ('cur_201', 'KHR', 'Cambodian Riel', '៛', 'ctyp_1'),
  ('cur_202', 'KID', 'Kiribati Dollar', '$', 'ctyp_1'),
  ('cur_203', 'KMF', 'Comorian Franc', 'CF', 'ctyp_1'),
  ('cur_204', 'KPW', 'North Korean Won', '₩', 'ctyp_1'),
  ('cur_205', 'KRW', 'South Korean Won', '₩', 'ctyp_1'),
  ('cur_206', 'KWD', 'Kuwaiti Dinar', 'د.ك.', 'ctyp_1'),
  ('cur_207', 'KYD', 'Cayman Islands Dollar', '$', 'ctyp_1'),
  ('cur_208', 'KZT', 'Kazakhstani Tenge', '₸', 'ctyp_1'),
  ('cur_209', 'LAK', 'Lao Kip', '₭', 'ctyp_1'),
  ('cur_210', 'LBP', 'Lebanese Pound', 'ل.ل.', 'ctyp_1'),
  ('cur_211', 'LKR', 'Sri Lankan Rupee', 'රු or ரூ', 'ctyp_1'),
  ('cur_212', 'LRD', 'Liberian Dollar', '$', 'ctyp_1'),
  ('cur_213', 'LSL', 'Lesotho Loti', 'L', 'ctyp_1'),
  ('cur_214', 'LYD', 'Libyan Dinar', 'ل.د.', 'ctyp_1'),
  ('cur_215', 'MAD', 'Moroccan Dirham', 'د.م.', 'ctyp_1'),
  ('cur_216', 'MDL', 'Moldovan Leu', 'L', 'ctyp_1'),
  ('cur_217', 'MGA', 'Malagasy Ariary', 'Ar', 'ctyp_1'),
  ('cur_218', 'MKD', 'Macedonian Denar', 'ден', 'ctyp_1'),
  ('cur_219', 'MMK', 'Myanmar Kyat', 'Ks', 'ctyp_1'),
  ('cur_220', 'MNT', 'Mongolian Tögrög', '₮', 'ctyp_1'),
  ('cur_221', 'MOP', 'Macanese Pataca', 'MOP$', 'ctyp_1'),
  ('cur_222', 'MRU', 'Mauritanian Ouguiya', 'أ.م.', 'ctyp_1'),
  ('cur_223', 'MUR', 'Mauritian Rupee', 'रु ', 'ctyp_1'),
  ('cur_224', 'MVR', 'Maldivian Rufiyaa', '.ރ', 'ctyp_1'),
  ('cur_225', 'MWK', 'Malawian Kwacha', 'MK', 'ctyp_1'),
  ('cur_226', 'MXN', 'Mexican Peso', '$', 'ctyp_1'),
  ('cur_227', 'MXV', 'Mexican Unidad de Inversion (UDI)', 'UDI', 'ctyp_1'),
  ('cur_228', 'MYR', 'Malaysian Ringgit', 'RM', 'ctyp_1'),
  ('cur_229', 'MZN', 'Mozambican Metical', 'MT', 'ctyp_1'),
  ('cur_230', 'NAD', 'Namibian Dollar', '$', 'ctyp_1'),
  ('cur_231', 'NGN', 'Nigerian Naira', '₦', 'ctyp_1'),
  ('cur_232', 'NIO', 'Nicaraguan Córdoba', 'C$', 'ctyp_1'),
  ('cur_233', 'NOK', 'Norwegian Krone', 'kr', 'ctyp_1'),
  ('cur_234', 'NPR', 'Nepalese Rupee', 'रू', 'ctyp_1'),
  ('cur_235', 'NZD', 'New Zealand Dollar', '$', 'ctyp_1'),
  ('cur_236', 'OMR', 'Omani Rial', 'ر.ع.', 'ctyp_1'),
  ('cur_237', 'PAB', 'Panamanian Balboa', 'B/.', 'ctyp_1'),
  ('cur_238', 'PEN', 'Peruvian Sol', 'S/.', 'ctyp_1'),
  ('cur_239', 'PGK', 'Papua New Guinean Kina', 'K', 'ctyp_1'),
  ('cur_240', 'PHP', 'Philippine Peso', '₱', 'ctyp_1'),
  ('cur_241', 'PKR', 'Pakistani Rupee', 'Rs', 'ctyp_1'),
  ('cur_242', 'PLN', 'Polish Zloty', 'zł', 'ctyp_1'),
  ('cur_243', 'PND', 'Pitcairn Islands Dollar', '$', 'ctyp_1'),
  ('cur_244', 'PRB', 'Transnistrian Ruble', 'р.', 'ctyp_1'),
  ('cur_245', 'PYG', 'Paraguayan Guaraní', '₲', 'ctyp_1'),
  ('cur_246', 'QAR', 'Qatari Riyal', 'ر.ق.', 'ctyp_1'),
  ('cur_247', 'RON', 'Romanian Leu', 'L', 'ctyp_1'),
  ('cur_248', 'RSD', 'Serbian Dinar', 'дин', 'ctyp_1'),
  ('cur_249', 'RUB', 'Russian Ruble', '₽', 'ctyp_1'),
  ('cur_250', 'RWF', 'Rwandan Franc', 'R₣', 'ctyp_1'),
  ('cur_251', 'SAR', 'Saudi Riyal', 'ر.س.', 'ctyp_1'),
  ('cur_252', 'SBD', 'Solomon Islands Dollar', '$', 'ctyp_1'),
  ('cur_253', 'SCR', 'Seychellois Rupee', 'Rs', 'ctyp_1'),
  ('cur_254', 'SDG', 'Sudanese Pound', 'ج.س.', 'ctyp_1'),
  ('cur_255', 'SEK', 'Swedish Krona', 'kr', 'ctyp_1'),
  ('cur_256', 'SGD', 'Singapore Dollar', '$', 'ctyp_1'),
  ('cur_257', 'SHP', 'Saint Helena Pound', '£', 'ctyp_1'),
  ('cur_258', 'SLL', 'Sierra Leonean Leone', 'Le', 'ctyp_1'),
  ('cur_259', 'SLS', 'Somaliland Shilling', 'Sl', 'ctyp_1'),
  ('cur_260', 'SOS', 'Somali Shilling', 'Ssh', 'ctyp_1'),
  ('cur_261', 'SRD', 'Surinamese Dollar', '$', 'ctyp_1'),
  ('cur_262', 'SSP', 'South Sudanese Pound', 'SS£', 'ctyp_1'),
  ('cur_263', 'STN', 'Sao Tome and Príncipe Dobra', 'Db', 'ctyp_1'),
  ('cur_264', 'SVC', 'Salvadoran Colón', '₡', 'ctyp_1'),
  ('cur_265', 'SYP', 'Syrian Pound', 'ل.س.', 'ctyp_1'),
  ('cur_266', 'SZL', 'Swazi Lilangeni', 'L', 'ctyp_1'),
  ('cur_267', 'THB', 'Thai Baht', '฿', 'ctyp_1'),
  ('cur_268', 'TJS', 'Tajikistani Somoni', 'SM', 'ctyp_1'),
  ('cur_269', 'TMT', 'Turkmenistan Manat', 'T', 'ctyp_1'),
  ('cur_270', 'TND', 'Tunisian Dinar', 'د.ت.', 'ctyp_1'),
  ('cur_271', 'TOP', 'Tongan Paʻanga', 'PT', 'ctyp_1'),
  ('cur_272', 'TRY', 'Turkish Lira', '₺', 'ctyp_1'),
  ('cur_273', 'TTD', 'Trinidad and Tobago Dollar', '$', 'ctyp_1'),
  ('cur_274', 'TVD', 'Tuvaluan Dollar', '$', 'ctyp_1'),
  ('cur_275', 'TWD', 'New Taiwan Dollar', '圓', 'ctyp_1'),
  ('cur_276', 'TZS', 'Tanzanian Shilling', 'TSh', 'ctyp_1'),
  ('cur_277', 'UAH', 'Ukrainian Hryvnia', 'грн', 'ctyp_1'),
  ('cur_278', 'UGX', 'Ugandan Shilling', 'Sh', 'ctyp_1'),
  ('cur_279', 'USD', 'United States Dollar', '$', 'ctyp_1'),
  ('cur_280', 'UYU', 'Uruguayan Peso', '$', 'ctyp_1'),
  ('cur_281', 'UZS', 'Uzbekistani Som', 'сум', 'ctyp_1'),
  ('cur_282', 'VED', 'Venezuelan bolívar digital', 'Bs.', 'ctyp_1'),
  ('cur_283', 'VES', 'Venezuelan Bolívar Soberano', 'Bs.F', 'ctyp_1'),
  ('cur_284', 'VND', 'Vietnamese Dong', '₫', 'ctyp_1'),
  ('cur_285', 'VUV', 'Vanuatu Vatu', 'VT', 'ctyp_1'),
  ('cur_286', 'WST', 'Samoan Tala', 'ST', 'ctyp_1'),
  ('cur_287', 'XAF', 'Central African CFA Franc BEAC', 'Fr.', 'ctyp_1'),
  ('cur_288', 'XCD', 'East Caribbean Dollar', '$', 'ctyp_1'),
  ('cur_289', 'XDR', 'SDR (Special Drawing Right)', 'SDR', 'ctyp_1'),
  ('cur_290', 'XOF', 'West African CFA Franc BCEAO', '₣', 'ctyp_1'),
  ('cur_291', 'XPF', 'CFP Franc (Franc Pacifique)', '₣', 'ctyp_1'),
  ('cur_292', 'XSU', 'SUCRE', 'XSU', 'ctyp_1'),
  ('cur_293', 'XUA', 'ADB Unit of Account', 'XUA', 'ctyp_1'),
  ('cur_294', 'YER', 'Yemeni Rial', 'ر.ي.', 'ctyp_1'),
  ('cur_295', 'ZAR', 'South African Rand', 'R', 'ctyp_1'),
  ('cur_296', 'ZMW', 'Zambian Kwacha', 'ZK', 'ctyp_1'),
  ('cur_297', 'ZWB', 'RTGS Dollar', NULL, 'ctyp_1'),
  ('cur_298', 'ZWL', 'Zimbabwean Dollar', '$', 'ctyp_1'),
  ('cur_299', 'ADA', 'Cardano', '₳', 'ctyp_2'),
  ('cur_300', 'APT', 'Aptos', 'APT', 'ctyp_2'),
  ('cur_301', 'AVAX', 'Avalanche', 'AVAX', 'ctyp_2'),
  ('cur_302', 'BCH', 'Bitcoin Cash', 'BCH', 'ctyp_2'),
  ('cur_303', 'BNB', 'BNB', 'BNB', 'ctyp_2'),
  ('cur_304', 'BTC', 'Bitcoin', '₿', 'ctyp_2'),
  ('cur_305', 'CRO', 'Cronos', 'CRO', 'ctyp_2'),
  ('cur_306', 'DAI', 'Dai', 'DAI', 'ctyp_2'),
  ('cur_307', 'DOGE', 'Dogecoin', 'Ð', 'ctyp_2'),
  ('cur_308', 'DOT', 'Polkadot', '●', 'ctyp_2'),
  ('cur_309', 'ETH', 'Ethereum', 'Ξ', 'ctyp_2'),
  ('cur_310', 'HBAR', 'Hedera', 'ℏ', 'ctyp_2'),
  ('cur_311', 'ICP', 'Internet Computer', 'ICP', 'ctyp_2'),
  ('cur_312', 'KAS', 'Kaspa', 'KAS', 'ctyp_2'),
  ('cur_313', 'LEO', 'LEO Token', 'LEO', 'ctyp_2'),
  ('cur_314', 'LINK', 'Chainlink', 'LINK', 'ctyp_2'),
  ('cur_315', 'LTC', 'Litecoin', 'Ł', 'ctyp_2'),
  ('cur_316', 'NEAR', 'NEAR Protocol', 'NEAR', 'ctyp_2'),
  ('cur_317', 'PEPE', 'Pepe', 'PEPE', 'ctyp_2'),
  ('cur_318', 'SHIB', 'Shiba Inu', 'SHIB', 'ctyp_2'),
  ('cur_319', 'SOL', 'Solana', '◎', 'ctyp_2'),
  ('cur_320', 'SUI', 'Sui', 'SUI', 'ctyp_2'),
  ('cur_321', 'TON', 'Toncoin', 'TON', 'ctyp_2'),
  ('cur_322', 'TRX', 'TRON', 'TRX', 'ctyp_2'),
  ('cur_323', 'UNI', 'Uniswap', '🦄', 'ctyp_2'),
  ('cur_324', 'USDC', 'USD Coin', 'USDC', 'ctyp_2'),
  ('cur_325', 'USDT', 'Tether', '₮', 'ctyp_2'),
  ('cur_326', 'VET', 'VeChain', 'VET', 'ctyp_2'),
  ('cur_327', 'XLM', 'Stellar', '*', 'ctyp_2'),
  ('cur_328', 'XRP', 'XRP', '✕', 'ctyp_2');
