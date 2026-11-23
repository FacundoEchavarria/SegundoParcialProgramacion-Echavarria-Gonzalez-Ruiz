# Gestión comercial

Proyecto de Programación IV. El equipo Echavarría, González y Ruiz desarrolló un sistema de gestión comercial con accesos por rol, catálogo, stock, ventas, facturas, cuentas corrientes y tablero.

## Integrantes

- Facundo Echavarría Pacios
- Pablo Hernán González
- Marcos Benjamín Ruiz

**Demo pública:** [Abrir Gestión comercial](https://segundo-parcial-gestion-comercial.vercel.app/login).

En el login de la demo, elegí **Administrador** o **Vendedor** para entrar con la cuenta de prueba de ese rol.

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

El seed prepara 5 categorías, 30 productos, 10 clientes, 50 facturas emitidas y una anulada, además de pagos. Ejecutalo una vez sobre la base de demo para que las ventas queden repartidas en los 30 días previos. Si se interrumpe y detecta una carga parcial, restaurá el respaldo anterior o usá un archivo SQLite nuevo con otro nombre y volvé a migrar y sembrar.

## Variables de entorno

| Variable | Desarrollo local | Demo en Vercel y Turso |
| --- | --- | --- |
| `DATABASE_URL` | `file:local.db` crea el archivo SQLite en la raíz. | URL de la base de Turso. |
| `DATABASE_AUTH_TOKEN` | Vacía. | Token privado de Turso. |
| `SESSION_SECRET` | Se genera con `pnpm db:seed`. | Se configura por entorno con un secreto aleatorio de al menos 32 bytes. |

Para mostrar los botones **Administrador** y **Vendedor** de modo demo en el login, configurá `DEMO_ADMIN_EMAIL`, `DEMO_ADMIN_PASSWORD`, `DEMO_VENDEDOR_EMAIL` y `DEMO_VENDEDOR_PASSWORD` con cuentas existentes. Cada botón entra por el login normal con esas credenciales, que nunca llegan al navegador. Si falta una variable, el botón de ese rol no aparece. En el sitio publicado, cualquiera puede usarlos, así que activalos solo para la demo.

Podés personalizar las cuentas iniciales antes del primer seed con `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_VENDEDOR_EMAIL` y `SEED_VENDEDOR_PASSWORD`. Para el seed remoto configurá esos cuatro valores junto con las tres variables de la tabla en la terminal donde ejecutes los comandos. Compartí las contraseñas de la demo por privado.

Corré los comandos desde la raíz del proyecto. `pnpm db:migrate` aplica las migraciones pendientes. Cuando cambies el esquema, `pnpm db:generate` genera la migración para revisar y versionar. `pnpm lint` revisa el código y `pnpm build` compila la app para producción.

## Publicar la demo

1. Creá una base nueva en Turso para la entrega. Obtené su URL `libsql://...` y un token para esa base. Configurá las variables remotas en una terminal desde la raíz y ejecutá `pnpm db:migrate` seguido de `pnpm db:seed`. Verificá que se haya completado la carga. [Guía de Turso](https://github.com/tursodatabase/turso-docs/blob/main/quickstart.mdx)
2. Importá el repositorio en un proyecto nuevo de Vercel y seleccioná Next.js, la raíz del repo, Node.js 22 y `main` como rama de producción. Para usar la versión de pnpm fijada por el proyecto, configurá `npx --yes pnpm@11.25.0 install --frozen-lockfile` como comando de instalación y `npx --yes pnpm@11.25.0 build` como comando de compilación. [Repositorios Git en Vercel](https://vercel.com/docs/git) · [Gestores de paquetes](https://vercel.com/docs/package-managers)
3. En producción configurá `DATABASE_URL`, `DATABASE_AUTH_TOKEN` y `SESSION_SECRET` de la demo. Generá el secreto con `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"` y guardalo como variable privada. Las credenciales `SEED_*` se usan en la terminal al sembrar. [Variables de entorno en Vercel](https://vercel.com/docs/environment-variables)
4. Abrí la URL pública en una ventana privada y probá el ingreso con ambos roles, el tablero y el guion de defensa. Pegá en este README la URL pública verificada.

Para recorrer la arquitectura y practicar para la defensa, leé la [guía de estudio](GUIA_DE_ESTUDIO.md).
