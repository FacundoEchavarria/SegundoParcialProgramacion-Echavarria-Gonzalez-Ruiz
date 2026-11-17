# Gestión comercial

Proyecto de Programación IV para gestionar ventas, stock y cuentas corrientes. La base del proyecto incluye una página inicial y el primer esquema de datos para usuarios.

## Arranque local

Requisitos: Git, Node.js 22 y pnpm 11.25.0. Con npm podés instalar esa versión con `npm install --global pnpm@11.25.0`.

```bash
git clone https://github.com/FacundoEchavarria/SegundoParcialProgramacion-Echavarria-Gonzalez-Ruiz.git
cd SegundoParcialProgramacion-Echavarria-Gonzalez-Ruiz
pnpm install --frozen-lockfile
cp .env.example .env
pnpm db:migrate
pnpm dev
```

En PowerShell, reemplazá `cp .env.example .env` por `Copy-Item .env.example .env`. Abrí [localhost:3000](http://localhost:3000).

## Variables de entorno

| Variable | Desarrollo local | Futuro despliegue |
| --- | --- | --- |
| `DATABASE_URL` | `file:local.db` crea el archivo SQLite en la raíz. | URL de la base de Turso. |
| `DATABASE_AUTH_TOKEN` | Vacía. | Token privado de Turso. |

Corré los comandos desde la raíz del proyecto. `pnpm db:migrate` aplica las migraciones pendientes. Cuando cambies el esquema, `pnpm db:generate` genera la migración para revisar y versionar. `pnpm lint` revisa el código y `pnpm build` compila la app para producción.

Para recorrer la arquitectura y practicar para la defensa, leé la [guía de estudio](GUIA_DE_ESTUDIO.md).
