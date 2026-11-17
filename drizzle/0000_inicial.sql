CREATE TABLE `usuarios` (
	`id` integer PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`rol` text NOT NULL,
	`activo` integer DEFAULT true NOT NULL,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT "usuarios_rol_valido" CHECK("usuarios"."rol" in ('admin', 'vendedor'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usuarios_email_unique` ON `usuarios` (`email`);