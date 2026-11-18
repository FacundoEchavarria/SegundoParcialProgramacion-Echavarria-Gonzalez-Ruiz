CREATE TABLE `pagos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cliente_id` integer NOT NULL,
	`cliente_nombre` text NOT NULL,
	`usuario_id` integer NOT NULL,
	`usuario_nombre` text NOT NULL,
	`importe` integer NOT NULL,
	`medio` text NOT NULL,
	`observacion` text,
	`saldo_cliente` integer NOT NULL,
	`creado_en` integer NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "pagos_importe_valido" CHECK("pagos"."importe" > 0),
	CONSTRAINT "pagos_saldo_valido" CHECK("pagos"."saldo_cliente" >= 0),
	CONSTRAINT "pagos_medio_valido" CHECK("pagos"."medio" in ('efectivo', 'transferencia', 'tarjeta_debito'))
);
--> statement-breakpoint
ALTER TABLE `movimientos_cuenta` ADD `pago_id` integer REFERENCES pagos(id);--> statement-breakpoint
CREATE UNIQUE INDEX `movimientos_cuenta_pago_id_unique` ON `movimientos_cuenta` (`pago_id`);