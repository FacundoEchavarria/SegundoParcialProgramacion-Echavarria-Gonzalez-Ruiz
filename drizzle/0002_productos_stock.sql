CREATE TABLE `categorias` (
	`id` integer PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`activa` integer DEFAULT true NOT NULL,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categorias_nombre_unique` ON `categorias` (`nombre`);--> statement-breakpoint
CREATE TABLE `movimientos_stock` (
	`id` integer PRIMARY KEY NOT NULL,
	`producto_id` integer NOT NULL,
	`usuario_id` integer NOT NULL,
	`tipo` text NOT NULL,
	`cantidad` integer NOT NULL,
	`existencia_resultante` integer NOT NULL,
	`motivo` text NOT NULL,
	`observacion` text,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "movimientos_stock_cantidad_valida" CHECK(
    ("movimientos_stock"."tipo" in ('ingreso', 'anulacion') and "movimientos_stock"."cantidad" > 0)
    or ("movimientos_stock"."tipo" in ('egreso', 'venta') and "movimientos_stock"."cantidad" < 0)
  )
);
--> statement-breakpoint
CREATE INDEX `movimientos_stock_producto_fecha_idx` ON `movimientos_stock` (`producto_id`,`creado_en`);--> statement-breakpoint
CREATE INDEX `movimientos_stock_fecha_idx` ON `movimientos_stock` (`creado_en`);--> statement-breakpoint
CREATE TABLE `productos` (
	`id` integer PRIMARY KEY NOT NULL,
	`codigo` text NOT NULL,
	`descripcion` text NOT NULL,
	`categoria_id` integer NOT NULL,
	`precio` integer NOT NULL,
	`existencia` integer DEFAULT 0 NOT NULL,
	`stock_minimo` integer NOT NULL,
	`activo` integer DEFAULT true NOT NULL,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`categoria_id`) REFERENCES `categorias`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "productos_importes_validos" CHECK("productos"."precio" > 0 and "productos"."stock_minimo" >= 0),
	CONSTRAINT "productos_existencia_valida" CHECK("productos"."existencia" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `productos_codigo_unique` ON `productos` (`codigo`);--> statement-breakpoint
CREATE INDEX `productos_categoria_idx` ON `productos` (`categoria_id`);