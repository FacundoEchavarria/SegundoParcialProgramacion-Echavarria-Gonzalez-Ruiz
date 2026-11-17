# Gestión comercial

Proyecto de Programación IV para gestionar ventas, stock y cuentas corrientes. Esta etapa incluye acceso, gestión de usuarios, catálogo, categorías e historial de stock.

## Arranque local

Requisitos: Git, Node.js 22 y pnpm 11.25.0. Con npm podés instalar esa versión con `npm install --global pnpm@11.25.0`.

```bash
git clone https://github.com/FacundoEchavarria/SegundoParcialProgramacion-Echavarria-Gonzalez-Ruiz.git
cd SegundoParcialProgramacion-Echavarria-Gonzalez-Ruiz
pnpm install --frozen-lockfile
cp .env.example .env
pnpm db:migrate
pnpm db:seed
pnpm dev
```

En PowerShell, reemplazá `cp .env.example .env` por `Copy-Item .env.example .env`. Abrí [localhost:3000](http://localhost:3000) e iniciá sesión con una de las cuentas locales.

| Rol | Email por defecto | Contraseña inicial |
| --- | --- | --- |
| Administrador | `admin@gestion.test` | Valor de `SEED_ADMIN_PASSWORD` en `.env.local`. |
| Vendedor | `vendedor@gestion.test` | Valor de `SEED_VENDEDOR_PASSWORD` en `.env.local`. |

El primer seed local genera las contraseñas y las guarda en el archivo ignorado `.env.local`. Guardá ese archivo en tu computadora. Si cambiás o restablecés una contraseña, el acceso usa la nueva y volver a ejecutar el seed conserva ese cambio.

## Variables de entorno

| Variable | Desarrollo local | Futuro despliegue |
| --- | --- | --- |
| `DATABASE_URL` | `file:local.db` crea el archivo SQLite en la raíz. | URL de la base de Turso. |
| `DATABASE_AUTH_TOKEN` | Vacía. | Token privado de Turso. |
| `SESSION_SECRET` | Se genera con `pnpm db:seed`. | Se configura por entorno con un secreto aleatorio de al menos 32 bytes. |

Podés personalizar las cuentas iniciales antes del primer seed con `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_VENDEDOR_EMAIL` y `SEED_VENDEDOR_PASSWORD`. Para ejecutar el seed en una base remota, configurá esos cuatro valores y `SESSION_SECRET` de forma explícita. Los secretos quedan fuera de Git.

Corré los comandos desde la raíz del proyecto. `pnpm db:migrate` aplica las migraciones pendientes. Cuando cambies el esquema, `pnpm db:generate` genera la migración para revisar y versionar. `pnpm lint` revisa el código y `pnpm build` compila la app para producción.

Para recorrer la arquitectura y practicar para la defensa, leé la [guía de estudio](GUIA_DE_ESTUDIO.md).
