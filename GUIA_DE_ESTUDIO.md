# Guía de estudio

## Tarea 1 · Base del proyecto

### 1. Instalar y arrancar

**Qué se hizo.** Se creó una app con Next.js App Router y TypeScript estricto. `package.json` indica qué dependencias y comandos usa el proyecto. `pnpm-lock.yaml` registra las versiones resueltas para que el equipo instale las mismas dependencias. En `tsconfig.json`, `@/` apunta a `src/`. Por ejemplo, `@/components/ui/card` apunta al componente que se usa en el inicio.

**Cómo comprobarlo.** Seguí el [arranque local del README](README.md#arranque-local). Al ejecutar `pnpm dev`, Next.js muestra la dirección donde se puede abrir la app. Ejecutá `pnpm build` para comprobar que el código compila con la configuración de producción.

### 2. Seguir la página inicial

**Qué se hizo.** Al abrir `/`, Next.js ejecuta [la página inicial](src/app/page.tsx). [El layout](src/app/layout.tsx) envuelve esa página, define el idioma y carga [los estilos globales](src/app/globals.css). Tailwind convierte clases como `px-6` en estilos. El prefijo `sm:` aplica otro estilo a partir del ancho configurado para ese tamaño.

**Cómo comprobarlo.** Con `pnpm dev` abierto, visitá `http://localhost:3000`. Achicá la ventana y fijate cómo se ajusta la tarjeta. [El componente Card](src/components/ui/card.tsx) contiene los estilos compartidos de la tarjeta de shadcn/ui. `components.json` indica dónde van los componentes y cuál es el CSS del proyecto.

### 3. Configurar la conexión

**Qué se hizo.** [La conexión del servidor](src/db/index.ts) inicializa Drizzle con la dirección de `DATABASE_URL`. Con el valor `file:local.db`, el controlador libSQL trabaja sobre un archivo SQLite de la computadora. [Drizzle Kit](drizzle.config.ts) lee la misma variable al ejecutar sus comandos. `.env.example` se comparte como plantilla y `.env` queda en cada computadora.

**Cómo comprobarlo.** Copiá `.env.example` a `.env` como indica el README y ejecutá `pnpm db:migrate`. Debería aparecer `local.db` en la raíz. La conexión ya está preparada para que la use el código del servidor cuando se agregue el acceso en la tarea 2.

### 4. Seguir el esquema hasta la base

**Qué se hizo.** [El esquema](src/db/schema.ts) describe la tabla `usuarios` en TypeScript. Por ejemplo, `email: text().notNull().unique()` exige un email y hace que la base rechace duplicados. Drizzle Kit usa ese esquema para generar SQL, y la base aplica ese SQL al migrar.

**Cómo comprobarlo.** Abrí la migración inicial de [la carpeta de migraciones](drizzle/) y buscá `CREATE TABLE` y el índice único del email. App nueva: ejecutá `pnpm db:migrate` para aplicar las migraciones ya publicadas. Cambio de esquema: editá el esquema, ejecutá `pnpm db:generate`, revisá el SQL generado y después ejecutá `pnpm db:migrate`. Si repetís `pnpm db:migrate` sin cambios, Drizzle reconoce las migraciones ya aplicadas.

### Cómo se extenderá la estructura

La interfaz vive en `src/app/` y `src/components/`; la conexión y las tablas viven en `src/db/`. A medida que se implementen los módulos, los servicios en `src/services/` concentrarán las reglas y usarán Drizzle para acceder a la base. Los Route Handlers en `src/app/api/` atenderán las solicitudes HTTP y llamarán a esos servicios.

### Practicar para la defensa

1. Cambiá el título visible en `src/app/page.tsx`, guardá y comprobá el cambio en el navegador con `pnpm dev`. Ubicá también en qué archivo se define el título de la pestaña.
2. Encontrá la restricción de email único en el esquema y en la migración. Explicá por qué una validación en el formulario también necesita el respaldo de la base de datos.
