PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_exchange_rates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`base_currency` text(3) DEFAULT 'EUR' NOT NULL,
	`target_currency` text(3) NOT NULL,
	`rate` real NOT NULL,
	`lastUpdated` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_exchange_rates`("id", "base_currency", "target_currency", "rate", "lastUpdated") SELECT "id", "base_currency", "target_currency", "rate", "lastUpdated" FROM `exchange_rates`;--> statement-breakpoint
DROP TABLE `exchange_rates`;--> statement-breakpoint
ALTER TABLE `__new_exchange_rates` RENAME TO `exchange_rates`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `base_target_idx` ON `exchange_rates` (`base_currency`,`target_currency`);--> statement-breakpoint
ALTER TABLE `expenses` ADD `custom_split_data` text;