"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type ComponentProps } from "react";
import { z } from "zod";
import {
  crearCategoriaAction,
  crearProductoAction,
  editarCategoriaAction,
  editarProductoAction,
  registrarMovimientoAction,
} from "@/app/actions";
import { Dialogo } from "@/components/acceso/dialogo";
import { claseCampo } from "@/components/acceso/estilos";
import { AvisoError, Campo, useFormulario } from "@/components/acceso/formulario";
import {
  altaCategoriaSchema,
  altaProductoSchema,
  edicionCategoriaSchema,
  edicionProductoSchema,
  motivosPorTipo,
  movimientoManualSchema,
} from "@/lib/schemas/productos";
import type { listarCategorias, obtenerProducto } from "@/services/productos";
import { aCentavos, aEntero, centavosComoDecimal } from "./campos";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Categoria = Awaited<ReturnType<typeof listarCategorias>>[number];
type Producto = Awaited<ReturnType<typeof obtenerProducto>>;
type TipoManual = keyof typeof motivosPorTipo;

function datosProducto(datos: Record<string, FormDataEntryValue>, categoriaActual?: number) {
  const { precio, categoriaId, stockMinimo, stockInicial, ...textos } = datos;
  const categoria = aEntero(categoriaId);
  return {
    ...textos,
    precio: aCentavos(precio),
    ...(categoria !== categoriaActual ? { categoriaId: categoria } : {}),
    stockMinimo: aEntero(stockMinimo),
    ...(stockInicial === undefined || stockInicial === "" ? {} : { stockInicial: aEntero(stockInicial) }),
  };
}

const altaProductoForm = z.preprocess((datos: Record<string, FormDataEntryValue>) => datosProducto(datos), altaProductoSchema);
const movimientoManualForm = z.preprocess(
  (datos: Record<string, FormDataEntryValue>) => ({ ...datos, cantidad: aEntero(datos.cantidad) }),
  movimientoManualSchema,
);

function Selector({
  etiqueta,
  error,
  ...props
}: Omit<ComponentProps<"select">, "className"> & { etiqueta: string; error?: string }) {
  const idError = useId();
  return (
    <Label className="grid min-w-0 gap-1.5">
      {etiqueta}
      <select
        {...props}
        className={claseCampo}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? idError : undefined}
      />
      {error && <span id={idError} className="text-xs font-medium text-peligro">{error}</span>}
    </Label>
  );
}

export function FormularioProducto({
  producto,
  categorias,
}: {
  producto?: Producto;
  categorias: Categoria[];
}) {
  const router = useRouter();
  const { enviar, enviando, error, errorCampo, limpiarError } = useFormulario();
  const titulo = producto ? "Editar producto" : "Nuevo producto";
  const accion = producto ? editarProductoAction.bind(null, producto.id) : crearProductoAction;
  const opciones = categorias.filter((categoria) => categoria.activa || categoria.id === producto?.categoria.id);
  const esquema = producto
    ? z.preprocess((datos: Record<string, FormDataEntryValue>) => datosProducto(datos, producto.categoria.id), edicionProductoSchema)
    : altaProductoForm;

  if (!producto && opciones.length === 0) {
    return <p className="text-sm text-muted-foreground">Creá o reactivá una categoría para dar de alta productos.</p>;
  }

  return (
    <Dialogo etiqueta={titulo} titulo={titulo} ocupado={enviando} alCerrar={limpiarError}>
      {(cerrar) => (
        <form
          method="post"
          noValidate
          onSubmit={(event) =>
            enviar(event, esquema, accion, () => {
              cerrar();
              router.refresh();
            })
          }
        >
          <fieldset className="grid min-w-0 gap-4" disabled={enviando}>
            <Campo etiqueta="Código" name="codigo" defaultValue={producto?.codigo} required error={errorCampo("codigo")} />
            <Campo
              etiqueta="Descripción"
              name="descripcion"
              defaultValue={producto?.descripcion}
              required
              error={errorCampo("descripcion")}
            />
            <Selector
              etiqueta="Categoría"
              name="categoriaId"
              defaultValue={producto?.categoria.id ?? ""}
              required
              error={errorCampo("categoriaId")}
            >
              <option value="" disabled>Seleccioná una categoría</option>
              {opciones.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}{categoria.activa ? "" : " (inactiva)"}
                </option>
              ))}
            </Selector>
            <Campo
              etiqueta="Precio en pesos"
              name="precio"
              inputMode="decimal"
              placeholder="Ej. 1200,50"
              defaultValue={producto ? centavosComoDecimal(producto.precio) : undefined}
              required
              error={errorCampo("precio")}
            />
            <Campo
              etiqueta="Stock mínimo"
              name="stockMinimo"
              inputMode="numeric"
              defaultValue={producto?.stockMinimo ?? 0}
              required
              error={errorCampo("stockMinimo")}
            />
            {!producto && (
              <Campo
                etiqueta="Stock inicial (opcional)"
                name="stockInicial"
                inputMode="numeric"
                error={errorCampo("stockInicial")}
              />
            )}
            <AvisoError error={error} />
            <div>
              <Button>
                {enviando ? "Guardando…" : producto ? "Guardar cambios" : "Crear producto"}
              </Button>
            </div>
          </fieldset>
        </form>
      )}
    </Dialogo>
  );
}

export function FormularioCategoria({ categoria }: { categoria?: Categoria }) {
  const router = useRouter();
  const { enviar, enviando, error, errorCampo, limpiarError } = useFormulario();
  const titulo = categoria ? "Editar categoría" : "Nueva categoría";
  const accion = categoria ? editarCategoriaAction.bind(null, categoria.id) : crearCategoriaAction;

  return (
    <Dialogo etiqueta={categoria ? "Editar" : titulo} titulo={titulo} ocupado={enviando} alCerrar={limpiarError}>
      {(cerrar) => (
        <form
          method="post"
          noValidate
          onSubmit={(event) =>
            enviar(event, categoria ? edicionCategoriaSchema : altaCategoriaSchema, accion, () => {
              cerrar();
              router.refresh();
            })
          }
        >
          <fieldset className="grid min-w-0 gap-4" disabled={enviando}>
            <Campo
              etiqueta="Nombre"
              name="nombre"
              defaultValue={categoria?.nombre}
              required
              error={errorCampo("nombre")}
            />
            <AvisoError error={error} />
            <div>
              <Button>
                {enviando ? "Guardando…" : categoria ? "Guardar cambios" : "Crear categoría"}
              </Button>
            </div>
          </fieldset>
        </form>
      )}
    </Dialogo>
  );
}

type Entidad = { producto: Producto; categoria?: never } | { producto?: never; categoria: Categoria };

export function CambiarEstado({ producto, categoria }: Entidad) {
  const router = useRouter();
  const { ejecutar, enviando, error, limpiarError } = useFormulario();
  const activo = producto ? producto.activo : categoria.activa;
  const verbo = activo ? "Desactivar" : "Reactivar";
  const titulo = producto ? `${verbo} producto` : `${verbo} categoría`;
  const nombre = producto ? producto.codigo : categoria.nombre;

  return (
    <Dialogo etiqueta={verbo} titulo={titulo} ocupado={enviando} alCerrar={limpiarError}>
      {(cerrar) => (
        <form
          method="post"
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            function actualizar() {
              if (producto) return editarProductoAction(producto.id, { activo: !activo });
              return editarCategoriaAction(categoria.id, { activa: !activo });
            }
            ejecutar<unknown>(actualizar, () => {
              cerrar();
              router.refresh();
            });
          }}
        >
          <p>¿Querés {verbo.toLowerCase()} {nombre}?</p>
          <AvisoError error={error} />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant={activo ? "destructive" : "default"} disabled={enviando}>
              {enviando ? "Guardando…" : `Confirmar ${activo ? "desactivación" : "reactivación"}`}
            </Button>
            <Button type="button" variant="outline" disabled={enviando} onClick={cerrar}>Cancelar</Button>
          </div>
        </form>
      )}
    </Dialogo>
  );
}

export function FormularioMovimiento({ productoId }: { productoId: number }) {
  const router = useRouter();
  const { enviar, enviando, error, errorCampo, limpiarError } = useFormulario();
  const [tipo, setTipo] = useState<TipoManual>("ingreso");

  return (
    <Dialogo
      etiqueta="Registrar movimiento"
      titulo="Registrar movimiento manual"
      ocupado={enviando}
      alCerrar={() => {
        setTipo("ingreso");
        limpiarError();
      }}
    >
      {(cerrar) => (
        <form
          method="post"
          noValidate
          onSubmit={(event) =>
            enviar(event, movimientoManualForm, registrarMovimientoAction.bind(null, productoId), () => {
              cerrar();
              router.refresh();
            })
          }
        >
          <fieldset className="grid min-w-0 gap-4" disabled={enviando}>
            <Selector
              etiqueta="Tipo"
              name="tipo"
              value={tipo}
              error={errorCampo("tipo")}
              onChange={(event) => {
                setTipo(event.target.value === "egreso" ? "egreso" : "ingreso");
                limpiarError();
              }}
            >
              <option value="ingreso">Ingreso</option>
              <option value="egreso">Egreso</option>
            </Selector>
            <Campo
              etiqueta="Cantidad"
              name="cantidad"
              inputMode="numeric"
              required
              error={errorCampo("cantidad")}
            />
            <Selector key={tipo} etiqueta="Motivo" name="motivo" required defaultValue="" error={errorCampo("motivo")}>
              <option value="" disabled>Seleccioná un motivo</option>
              {motivosPorTipo[tipo].map((motivo) => <option key={motivo}>{motivo}</option>)}
            </Selector>
            <Campo etiqueta="Observación (opcional)" name="observacion" error={errorCampo("observacion")} />
            <AvisoError error={error} />
            <div>
              <Button>{enviando ? "Guardando…" : "Registrar movimiento"}</Button>
            </div>
          </fieldset>
        </form>
      )}
    </Dialogo>
  );
}
