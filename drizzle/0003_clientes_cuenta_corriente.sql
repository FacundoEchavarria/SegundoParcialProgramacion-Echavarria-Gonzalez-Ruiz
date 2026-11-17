CREATE TABLE `clientes` (
	`id` integer PRIMARY KEY NOT NULL,
	`tipo_doc` text NOT NULL,
	`nro_doc` text NOT NULL,
	`nombre` text NOT NULL,
	`nombre_busqueda` text NOT NULL,
	`domicilio` text,
	`telefono` text,
	`email` text,
	`cuenta_corriente` integer DEFAULT false NOT NULL,
	`limite_credito` integer,
	`activo` integer DEFAULT true NOT NULL,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT "clientes_tipo_doc_valido" CHECK("clientes"."tipo_doc" in ('DNI', 'CUIT')),
	CONSTRAINT "clientes_limite_valido" CHECK("clientes"."limite_credito" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `clientes_documento_unique` ON `clientes` (`tipo_doc`,`nro_doc`);--> statement-breakpoint
CREATE TABLE `movimientos_cuenta` (
	`id` integer PRIMARY KEY NOT NULL,
	`cliente_id` integer NOT NULL,
	`tipo` text NOT NULL,
	`importe` integer NOT NULL,
	`descripcion` text NOT NULL,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "movimientos_cuenta_tipo_valido" CHECK("movimientos_cuenta"."tipo" in ('debito', 'credito')),
	CONSTRAINT "movimientos_cuenta_importe_valido" CHECK("movimientos_cuenta"."importe" > 0)
);
--> statement-breakpoint
CREATE INDEX `movimientos_cuenta_cliente_fecha_idx` ON `movimientos_cuenta` (`cliente_id`,`creado_en`);