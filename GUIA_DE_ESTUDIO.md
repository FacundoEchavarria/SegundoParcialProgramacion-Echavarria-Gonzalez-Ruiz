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

Usá este ejemplo para seguir el cálculo en el código. La tarea 5 registra los créditos por pagos y la tarea 6 incorporará los débitos por ventas.

| Fecha | Movimiento | Saldo acumulado |
| --- | --- | --- |
| 24/10/2026 | Débito de $10.000,00 | $10.000,00 |
| 25/10/2026 | Crédito de $3.000,00 | $7.000,00 |

Identificá dónde se calculan los **$7.000,00** y en qué unidad trabaja SQLite. Si filtrás desde el 25/10, `saldoAnterior` trae **$10.000,00**, el historial muestra el crédito de **$3.000,00** y el saldo de cierre queda en **$7.000,00**.

## Tarea 5 · Pagos

1. **Migrar.** Corré `pnpm db:migrate`. [La migración de pagos](drizzle/0004_pagos.sql) crea la tabla `pagos` y agrega `pago_id` al historial. Los movimientos anteriores quedan sin recibo asociado.
2. **Seguir el formulario.** [Registrar pago](src/components/clientes/formulario-pago.tsx) convierte los pesos ingresados a centavos. La Server Action y la API llegan a [`registrarPago()`](src/services/pagos.ts), que vuelve a validar la entrada y consulta la deuda dentro de la transacción.
3. **Vincular el pago con el crédito.** El identificador del pago forma el número del recibo. La misma transacción guarda un movimiento de tipo `credito` por el importe pagado, con su `pagoId`. Si el crédito falla, se revierten el pago y la asignación del número.
4. **Leer el saldo y reimprimir.** La ficha sigue sumando débitos y restando créditos. El recibo conserva los nombres del cliente y del usuario junto con el saldo inmediatamente posterior al pago. El historial enlaza al recibo asociado.

### Practicar para la defensa

Usá una base local descartable. Por ejemplo, configurá `$env:DATABASE_URL = 'file:practica-pagos.db'` en PowerShell, corré `pnpm db:migrate`, `pnpm db:seed` y `pnpm dev` en esa terminal. Creá un cliente con cuenta corriente. Podés generar la deuda con una venta a cuenta de $10.000,00 como en la tarea 6. Para probar solo pagos, usá `pnpm exec drizzle-kit studio` en otra terminal con la misma variable para insertar un débito de prueba en `movimientos_cuenta`. Usá el ID del cliente, `tipo = debito`, `importe = 1000000` y `descripcion = Deuda de prueba`.

Volvé a la ficha y registrá un pago de **$3.000,00**. Comprobá que el recibo indique **$7.000,00** como saldo posterior y que el historial muestre el crédito con un enlace al recibo. Intentá registrar **$7.001,00**. La deuda debe seguir en **$7.000,00** y el historial debe conservar un solo crédito. Pagá los **$7.000,00** restantes y reabrí el primer recibo para comparar su saldo histórico con el saldo actual de la ficha.

## Tarea 6 · Ventas y confirmación

1. **Preparar la base.** Corré `pnpm db:migrate` y `pnpm dev`, e ingresá con un usuario de prueba. La migración agrega `facturas`, `factura_items` y referencias opcionales a factura en los dos historiales.
2. **Armar la venta.** En **Ventas**, elegí comprador, buscá productos, ajustá cantidades y elegí contado, tarjeta o cuenta corriente. El total que muestra el formulario se calcula con los precios consultados al armarlo. El alta rápida del comprador reutiliza la Server Action de clientes y conserva el borrador.
3. **Ver qué recibe el servidor.** [La ruta de API](src/app/api/facturas/route.ts) obtiene la sesión y llama a [`confirmarVenta()`](src/services/facturas.ts) con los identificadores, cantidades y datos del pago. El esquema rechaza precios o totales enviados por el navegador, renglones duplicados y campos extra de tarjeta.
4. **Seguir la transacción.** El servicio vuelve a leer productos, cliente y deuda. Calcula los subtotales en centavos con los precios vigentes, valida el pago y asigna el próximo número de factura. Guarda la factura y los renglones con los datos de emisión. Por cada renglón llama a [`moverStock()`](src/services/stock.ts) para descontar existencia y grabar su movimiento.
5. **Seguir el débito y la respuesta.** En una venta a cuenta se agrega un débito vinculado a la factura. Si algo falla, se revierte la transacción completa. Si se confirma, la pantalla muestra el número y total devueltos por el servidor, con vuelto o saldo posterior cuando corresponda.

### Practicar para la defensa

En una base de prueba, cargá un producto a **$5.000,00** con **3 unidades** y un cliente con cuenta corriente habilitada y límite de **$10.000,00**. Confirmá dos unidades a cuenta. El producto debe quedar con **1 unidad**, la ficha del cliente debe mostrar una factura reciente y el historial debe mostrar un débito de **$10.000,00**. Intentá venderle la última unidad a cuenta antes de cobrar: el límite debe impedirlo y el stock debe seguir en **1**. Registrá un pago de **$3.000,00** desde la ficha. La deuda debe quedar en **$7.000,00** y el recibo debe seguir su propia numeración.

## Tarea 7 · Facturas y anulaciones

1. **Consultar e imprimir.** Corré `pnpm db:migrate` para agregar los datos de anulación. Abrí **Ventas**, aplicá un filtro y entrá a una factura. El detalle lee los nombres, precios y cantidades guardados al confirmar. **Imprimir factura** muestra un comprobante interno con esos datos. El total emitido del listado suma las facturas emitidas de todas las páginas que coinciden con los filtros.
2. **Seguir el motivo.** El formulario de un administrador envía el identificador de la factura y el motivo a una Server Action. La API admite los mismos datos y ambos caminos llaman a [`anularFactura()`](src/services/facturas.ts). El servicio valida el motivo, confirma el permiso y cambia el estado solo si sigue emitida.
3. **Seguir las devoluciones.** Cada renglón repone el stock mediante [`moverStock()`](src/services/stock.ts). Si la venta fue a cuenta, el servicio acredita el total de la factura. Si el crédito supera la deuda actual, primero pide confirmar una devolución de caja por la diferencia. La API devuelve `409 DEVOLUCION_REQUERIDA` con el importe en centavos. El administrador vuelve a enviar el motivo y `importeDevuelto` con ese valor. El servidor vuelve a calcular el importe y registra el débito por la devolución, el crédito, el stock y la anulación en la misma transacción.

### Practicar para la defensa

Emití una venta a cuenta por **$10.000,00** para un cliente sin deuda previa. Registrá un pago de **$3.000,00** y solicitá la anulación con un motivo. El diálogo pide confirmar una devolución de **$3.000,00**. Después de confirmar, comprobá que las unidades vuelvan al stock, que el historial muestre la devolución y el crédito por **$10.000,00**, y que el saldo termine en **$0,00**. Abrí la factura anulada desde el historial y verificá su motivo y el importe devuelto. Corré `pnpm test` para probar este flujo con SQLite en memoria.

## Tarea 8 · Tablero, datos de prueba y publicación

1. **Ejecutar.** Instalá las dependencias con `pnpm install --frozen-lockfile`, copiá `.env.example` a `.env` y usá una base de prueba. Corré `pnpm db:migrate`, `pnpm db:seed` y `pnpm dev`. El [README](README.md) indica cómo entrar con cada rol y cómo publicar la demo en Turso y Vercel.
2. **Seguir una cifra del tablero.** Tanto **Inicio** como `GET /api/tablero` llaman a [`obtenerTablero()`](src/services/tablero.ts). Buscá cómo el servicio agrupa las facturas emitidas por fecha argentina, agrega ceros hasta completar los 30 días y calcula el ticket promedio. El ranking suma unidades de los renglones. La deuda se obtiene de los movimientos de cada cliente y solo suma los saldos positivos. Los gráficos reciben datos ya calculados.
3. **Seguir un dato de prueba.** Abrí [el seed](scripts/seed.ts) y seguí cómo llama a los servicios que también usa la aplicación. Buscá una venta del seed en **Ventas** y verificá que tenga movimientos de stock y, si se hizo a cuenta, un débito del cliente. Identificá cómo se excluye una anulada del tablero.

### Guion de defensa de 10 minutos

| Minutos | Demostración | Qué explicar |
| --- | --- | --- |
| 0–2 | Ingresar como vendedor, mostrar el tablero y anotar el stock de un producto. | Cómo se calculan los indicadores y por qué dependen de facturas, stock y movimientos. |
| 2–4 | Vender una unidad a consumidor final en efectivo. Mostrar total, vuelto, factura y stock actualizado. | La API toma el precio guardado y confirma la factura y el descuento en una transacción. |
| 4–6 | Crear un cliente desde otra venta y habilitar su cuenta corriente. Confirmar la venta y mostrar el débito en su ficha. | El borrador se conserva y el servidor verifica stock y límite de crédito. |
| 6–8 | Registrar un pago parcial y abrir el recibo desde el historial. | El pago y el crédito se guardan juntos y el saldo sale del historial. |
| 8–10 | Entrar como administrador, anular la factura a cuenta con motivo y confirmar el importe de la devolución. Mostrar el stock repuesto, el saldo en cero y la factura anulada. | El servicio vuelve a calcular la devolución y registra juntos la anulación y los movimientos de stock y cuenta corriente. |

Para la parte de código, practicá ubicar en qué archivo está cada paso. Ensayá también un cambio pequeño, como ajustar el texto de una validación y comprobarlo en una base local de prueba.

### Demostrar las correcciones de interfaz

Abrí la aplicación con un ancho de 360 px. Usá **Menú** y comprobá que el módulo activo se distinga, también desde una pantalla interna. En **Nueva venta**, buscá un producto, agregalo con **Enter** y usá **Tab** para llegar a **Ir al pago**. Verificá que al activarlo el foco pase al selector de pago. Guardá un producto para ver el aviso de éxito y buscá un código inexistente para ver el estado vacío. En una factura o recibo, comprobá la fecha con año de cuatro dígitos y hora argentina.

### Páginas armadas solo con componentes

La consigna (§10.6) pide que las páginas no lleven etiquetas HTML sueltas. Todos los `page.tsx` y el layout privado se arman con componentes de shadcn/ui, con las primitivas de [maquetacion.tsx](src/components/maquetacion.tsx) (`Pila`, `Fila`, `Grilla`, `Texto`, `Titulo`) y con las piezas repetidas de [pagina.tsx](src/components/pagina.tsx):

- **Filtros:** `FormularioFiltros` (envía por GET, así los filtros quedan en la URL), `CampoFiltro`, `EntradaFiltro` (el `Input` de shadcn), `SelectorFiltro` (recibe las opciones como lista) y `CasillaFiltro`.
- **Datos:** `Dato` para un par etiqueta/valor de ficha, `Renglon` para los totales del comprobante, `Cifra` para los importes grandes y `Fecha` para las fechas con su valor ISO.
- **Otros:** `Desplegable` para la tabla de importes por día del tablero.

Además, [globals.css](src/app/globals.css) limita los estilos `dark:` de shadcn a la clase `.dark`. Como la app no tiene tema oscuro, los campos ya no se ven grises en una compu con modo oscuro.

**Cómo comprobarlo.** Abrí cualquier `page.tsx` de `src/app/(privado)` y verificá que todas las etiquetas empiecen con mayúscula. Filtrá **Productos** por categoría y «Solo bajo stock», y fijate que la URL guarde los filtros. **Para practicar:** agregá a **Facturas** un filtro nuevo con `CampoFiltro` y `SelectorFiltro`, sin escribir ningún `<select>`.
