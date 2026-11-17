# Guía para agentes

## Alcance

- Usá `requerimientos.md` del material de la cátedra (`enunciados/tp5/requerimientos.md` en la carpeta de la materia) como guía principal. Si difiere del otro enunciado, seguí el documento de requerimientos. Usá los mockups para entender los flujos y diseñá una interfaz propia.
- Implementá la tarea pedida. Si un detalle parece ambiguo, consultá primero el requisito y el código relacionado.

## Código para la defensa

**Escribí código que cualquier integrante pueda leer, explicar y modificar durante la defensa en vivo. Usá nombres claros y mantené cada regla de negocio en un solo lugar. Cumplí toda la funcionalidad, las validaciones y los permisos del enunciado con la menor complejidad necesaria.**

- Poné las reglas, los permisos y las transacciones en servicios del dominio. Hacé que los Route Handlers y las Server Actions invoquen los mismos servicios. Compartí los esquemas de validación con los formularios.
- Dejá la conexión y el esquema en `src/db/`. Generá y versioná las migraciones de Drizzle. Conservá el historial de datos y mantené fuera de Git las bases locales, los tokens, las contraseñas y otros secretos.
- Preferí funciones directas y reutilizá las convenciones del proyecto. Agregá comentarios breves para explicar decisiones que el código por sí solo no muestra y citá el requisito en los servicios según el enunciado.

## Flujo de trabajo para las ocho tareas

1. Trabajá con un prompt por tarea. Retomá el contexto con este archivo, la [guía de estudio](GUIA_DE_ESTUDIO.md) y el historial de Git. Consultá los apartados relevantes del enunciado, empezá por el diff y seguí el código relacionado. Mostrá solo los resultados de comandos que hagan falta para decidir o verificar.
2. Aplicá `ponytail` durante la implementación. Sumá otras skills pertinentes y delegá trabajo adicional si es independiente y acotado. Pasá al subagente el objetivo, las rutas y las condiciones de cierre.
3. Cada vez que termines una tarea, encargale a un subagente una revisión con `ponytail-review`. El revisor debe leer el diff y el código relacionado, ejecutar una prueba del flujo principal o del riesgo más relevante e informar el veredicto, la evidencia y lo que quedó sin verificar.
4. Corregí los hallazgos aplicables y repetí las comprobaciones afectadas. Actualizá la guía con qué cambió, cómo funciona, dónde encontrarlo y cómo comprobarlo. Cerrá la tarea con un commit descriptivo.
