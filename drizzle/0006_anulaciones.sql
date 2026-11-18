ALTER TABLE `facturas` ADD `anulada_en` integer;--> statement-breakpoint
ALTER TABLE `facturas` ADD `anulada_por_id` integer REFERENCES usuarios(id);--> statement-breakpoint
ALTER TABLE `facturas` ADD `anulada_por_nombre` text;--> statement-breakpoint
ALTER TABLE `facturas` ADD `motivo_anulacion` text;