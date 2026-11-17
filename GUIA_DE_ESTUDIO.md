# Guía de estudio

## Tarea 1 · Base del proyecto

### 1. Instalar y arrancar

**Qué se hizo.** Se creó una app con Next.js App Router y TypeScript estricto. `package.json` indica qué dependencias y comandos usa el proyecto. `pnpm-lock.yaml` registra las versiones resueltas para que el equipo instale las mismas dependencias. En `tsconfig.json`, `@/` apunta a `src/`. Por ejemplo, `@/components/ui/card` apunta al componente que se usa en el inicio.

**Cómo comprobarlo.** Seguí el [arranque local del README](README.md#arranque-local). Al ejecutar `pnpm dev`, Next.js muestra la dirección donde se puede abrir la app. Ejecutá `pnpm build` para comprobar que el código compila con la configuración de producción.

### 2. Seguir la página inicial

**Qué se hizo.** Al abrir `/`, Next.js ejecuta [la página inicial](src/app/%28privado%29/page.tsx). [El layout raíz](src/app/layout.tsx) define el idioma y carga [los estilos globales](src/app/globals.css). Tailwind convierte clases como `px-6` en estilos. El prefijo `sm:` aplica otro estilo a partir del ancho configurado para ese tamaño.

**Cómo comprobarlo.** Con `pnpm dev` abierto, visitá `http://localhost:3000` e iniciá sesión. Achicá la ventana y fijate cómo se ajusta la tarjeta. [El componente Card](src/components/ui/card.tsx) contiene los estilos compartidos de la tarjeta de shadcn/ui. `components.json` indica dónde van los componentes y cuál es el CSS del proyecto.

### 3. Configurar la conexión

**Qué se hizo.** [La conexión del servidor](src/db/index.ts) inicializa Drizzle con la dirección de `DATABASE_URL`. Con el valor `file:local.db`, el controlador libSQL trabaja sobre un archivo SQLite de la computadora. [Drizzle Kit](drizzle.config.ts) lee la misma variable al ejecutar sus comandos. `.env.example` se comparte como plantilla y `.env` queda en cada computadora.

**Cómo comprobarlo.** Copiá `.env.example` a `.env` como indica el README y ejecutá `pnpm db:migrate`. Debería aparecer `local.db` en la raíz. La conexión ya está preparada para que la use el código del servidor cuando se agregue el acceso en la tarea 2.

### 4. Seguir el esquema hasta la base

**Qué se hizo.** [El esquema](src/db/schema.ts) describe la tabla `usuarios` en TypeScript. Por ejemplo, `email: text().notNull().unique()` exige un email y hace que la base rechace duplicados. Drizzle Kit usa ese esquema para generar SQL, y la base aplica ese SQL al migrar.

**Cómo comprobarlo.** Abrí la migración inicial de [la carpeta de migraciones](drizzle/) y buscá `CREATE TABLE` y el índice único del email. App nueva: ejecutá `pnpm db:migrate` para aplicar las migraciones ya publicadas. Cambio de esquema: editá el esquema, ejecutá `pnpm db:generate`, revisá el SQL generado y después ejecutá `pnpm db:migrate`. Si repetís `pnpm db:migrate` sin cambios, Drizzle reconoce las migraciones ya aplicadas.

### Cómo se extenderá la estructura

La interfaz vive en `src/app/` y `src/components/`; la conexión y las tablas viven en `src/db/`. A medida que se implementen los módulos, los servicios en `src/services/` concentrarán las reglas y usarán Drizzle para acceder a la base. Los Route Handlers en `src/app/api/` atenderán las solicitudes HTTP y llamarán a esos servicios.

### Practicar para la defensa

1. Cambiá el título visible en `src/app/(privado)/page.tsx`, guardá y comprobá el cambio en el navegador con `pnpm dev`. Ubicá también en qué archivo se define el título de la pestaña.
2. Encontrá la restricción de email único en el esquema y en la migración. Explicá por qué una validación en el formulario también necesita el respaldo de la base de datos.

## Tarea 2 · Acceso y usuarios

1. **Crear las cuentas.** Corré `pnpm db:migrate` y `pnpm db:seed`. La segunda migración crea `sesiones`. [El seed](scripts/seed.ts) lee la configuración, genera los valores locales faltantes y usa el servicio de usuarios para crear las dos cuentas iniciales. Buscá las contraseñas iniciales en `.env.local` y volvé a ejecutar el seed para comprobar que preserva los usuarios existentes.
2. **Seguir el formulario.** Al enviar `/login`, [la Server Action](src/app/actions.ts) le entrega el email y la contraseña al [servicio de autenticación](src/services/auth.ts). `POST /api/auth/login` usa el mismo servicio. Zod valida el cuerpo. bcrypt compara la contraseña ingresada con el hash guardado. Probá primero una contraseña incorrecta y después la correcta.
3. **Seguir la sesión.** Con las credenciales correctas, el servicio crea una sesión de ocho horas en SQLite. [El adaptador de solicitud](src/lib/auth-request.ts) firma su identificador y escribe la cookie `sesion`. Desde las herramientas del navegador podés ver la cookie marcada como `HttpOnly`. El valor identifica una sesión, mientras que el rol y el estado se obtienen de la base.
4. **Ubicar cada control.** [El proxy](src/proxy.ts) revisa la cookie al pedir una página protegida y redirige a `/login` si falta una sesión firmada válida. Las páginas y los adaptadores de API consultan la sesión en la base antes de continuar. [El servicio de usuarios](src/services/usuarios.ts) limita las operaciones de administración al rol `admin`. Los errores de la API se devuelven como JSON con un código y un mensaje.
5. **Seguir una revocación.** Al desactivar una cuenta, cambiar su contraseña o restablecerla, el servicio actualiza al usuario y elimina sus sesiones dentro de una transacción. Así la actualización y el cierre de las sesiones se aplican juntos. Al salir se elimina solo la sesión actual.

### Practicar para la defensa

1. Entrá como vendedor y ejecutá en la consola del navegador `await fetch("/api/usuarios").then(r => r.json())`. Buscá `SIN_PERMISO` en la respuesta y el estado `403` en la pestaña Red. Encontrá en el servicio el permiso que aplica aunque uses directamente la API.
2. Abrí una ventana normal como administrador y una ventana privada como vendedor. Desactivá al vendedor en `/usuarios`. Recargá la página del vendedor y comprobá que vuelve a `/login`. Reactivá la cuenta desde la ventana del administrador y verificá que requiere otro inicio de sesión.

## Tarea 3 · Productos, categorías y stock

1. **Preparar la base.** Ejecutá `pnpm db:migrate`. [La migración de stock](drizzle/0002_productos_stock.sql) agrega las tablas de categorías, productos y movimientos. SQLite guarda el precio en centavos y la existencia en unidades enteras.
2. **Seguir la solicitud.** Desde Productos, un administrador puede crear una categoría y dar de alta un producto. [Las acciones de la interfaz](src/app/actions.ts) y la API llaman a los mismos [servicios de productos](src/services/productos.ts). El servicio valida los datos y el rol. El alta empieza con cero unidades y llama a `moverStock()` si se cargó stock inicial.
3. **Proteger la existencia.** [`moverStock()`](src/services/stock.ts) convierte la cantidad en un cambio con signo. El `UPDATE` solo aplica el cambio si la existencia resultante es válida. Si un egreso supera el stock, la API devuelve `409 STOCK_INSUFICIENTE`. Si dos escrituras coinciden y SQLite informa un bloqueo temporal, se reintenta la transacción completa para volver a evaluar la condición.
4. **Registrar y consultar.** La misma transacción inserta el movimiento con la existencia que devolvió el `UPDATE`, el motivo y el usuario. Si el movimiento falla, se revierte la actualización. El historial de la ficha y el historial general leen esos registros. La baja cambia el estado del producto y conserva sus movimientos.

### Practicar para la defensa

1. Como administrador, creá una categoría y un producto con **5** unidades de stock inicial. En la ficha, comprobá que aparece un ingreso con motivo **Stock inicial** y existencia resultante **5**.
2. Registrá un egreso de **2** y luego intentá otro de **4**. La existencia debe quedar en **3** y el historial debe tener solo dos movimientos. Ubicá en el servicio la condición del `UPDATE` y explicá por qué el intento rechazado no agregó un renglón.

## Tarea 4 · Clientes y cuenta corriente

1. **Crear la base y el cliente.** Corré `pnpm db:migrate` y abrí Clientes. La migración de esta tarea agrega las tablas `clientes` y `movimientos_cuenta`. Cargá un DNI con puntos y buscalo sin puntos para comprobar que se usa el mismo número. Si intentás otra alta con el mismo tipo y número, la API devuelve `409 DOCUMENTO_DUPLICADO`.
2. **Ubicar la fuente del saldo.** En [el servicio de cuenta corriente](src/services/cuenta-corriente.ts), `importeConSigno` da signo positivo a los débitos y negativo a los créditos. La ficha y el listado suman esos valores. Un cliente recién creado tiene saldo cero porque todavía no tiene movimientos. El campo disponible indica el crédito que resta según el límite, con un mínimo de cero.
3. **Leer la cuenta en orden.** Para cada movimiento, el servicio añade su cambio al acumulado. Con un filtro desde una fecha, calcula primero lo que pasó antes de ese día en horario argentino y lo devuelve como `saldoAnterior`. El saldo de cada fila incluye su propio movimiento. El saldo de cierre de la cuenta filtrada puede diferir del saldo actual de la ficha.
4. **Vincular saldo y estado.** [El servicio de clientes](src/services/clientes.ts) calcula el saldo y actualiza el registro dentro de una misma transacción. Si hay saldo pendiente, devuelve `422 SALDO_PENDIENTE` al intentar desactivar al cliente o deshabilitarle la cuenta corriente.

### Practicar para la defensa

Usá este ejemplo para seguir el cálculo en el código. Los movimientos se originarán desde pagos y ventas en las próximas tareas.

| Fecha | Movimiento | Saldo acumulado |
| --- | --- | --- |
| 24/10/2026 | Débito de $10.000,00 | $10.000,00 |
| 25/10/2026 | Crédito de $3.000,00 | $7.000,00 |

Identificá dónde se calculan los **$7.000,00** y en qué unidad trabaja SQLite. Si filtrás desde el 25/10, `saldoAnterior` trae **$10.000,00**, el historial muestra el crédito de **$3.000,00** y el saldo de cierre queda en **$7.000,00**.
