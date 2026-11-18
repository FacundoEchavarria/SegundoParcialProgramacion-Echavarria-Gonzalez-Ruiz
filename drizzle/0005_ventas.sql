CREATE TABLE `factura_items` (
	`id` integer PRIMARY KEY NOT NULL,
	`factura_id` integer NOT NULL,
	`producto_id` integer NOT NULL,
	`codigo` text NOT NULL,
	`descripcion` text NOT NULL,
	`cantidad` integer NOT NULL,
	`precio_unitario` integer NOT NULL,
	`subtotal` integer NOT NULL,
	`creado_en` integer NOT NULL,
	FOREIGN KEY (`factura_id`) REFERENCES `facturas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "factura_items_importes_validos" CHECK(
    "factura_items"."cantidad" > 0 and "factura_items"."precio_unitario" > 0
    and "factura_items"."subtotal" = "factura_items"."cantidad" * "factura_items"."precio_unitario"
  )
);
--> statement-breakpoint
CREATE UNIQUE INDEX `factura_items_producto_unique` ON `factura_items` (`factura_id`,`producto_id`);--> statement-breakpoint
CREATE TABLE `facturas` (
	`id` integer PRIMARY KEY NOT NULL,
	`punto_venta` integer NOT NULL,
	`numero` integer NOT NULL,
	`creado_en` integer NOT NULL,
	`estado` text DEFAULT 'emitida' NOT NULL,
	`usuario_id` integer NOT NULL,
	`usuario_nombre` text NOT NULL,
	`cliente_id` integer,
	`cliente_nombre` text,
	`cliente_tipo_doc` text,
	`cliente_nro_doc` text,
	`cliente_domicilio` text,
	`total` integer NOT NULL,
	`forma_pago` text NOT NULL,
	`monto_recibido` integer,
	`tarjeta_tipo` text,
	`tarjeta_marca` text,
	`tarjeta_ultimos4` text,
	`saldo_cliente` integer,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "facturas_importes_validos" CHECK(
    "facturas"."total" > 0 and ("facturas"."monto_recibido" is null or "facturas"."monto_recibido" >= "facturas"."total")
  ),
	CONSTRAINT "facturas_estado_valido" CHECK("facturas"."estado" in ('emitida', 'anulada')),
	CONSTRAINT "facturas_forma_pago_valida" CHECK("facturas"."forma_pago" in ('contado', 'tarjeta', 'cuenta_corriente'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `facturas_punto_venta_numero_unique` ON `facturas` (`punto_venta`,`numero`);--> statement-breakpoint
CREATE INDEX `facturas_cliente_fecha_idx` ON `facturas` (`cliente_id`,`creado_en`);--> statement-breakpoint
ALTER TABLE `movimientos_cuenta` ADD `factura_id` integer REFERENCES facturas(id);--> statement-breakpoint
ALTER TABLE `movimientos_stock` ADD `factura_id` integer REFERENCES facturas(id);