"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { crearUsuarioAction, editarUsuarioAction, restablecerPasswordAction } from "@/app/actions";
import { altaUsuarioSchema, edicionUsuarioSchema } from "@/lib/schemas/usuarios";
import { Dialogo } from "./dialogo";
import { claseCampo } from "./estilos";
import { AvisoError, Campo, useFormulario } from "./formulario";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type UsuarioEditable = {
  id: number;
  nombre: string;
  email: string;
  rol: "admin" | "vendedor";
  activo: boolean;
};

export function NuevoUsuario() {
  return (
    <Dialogo etiqueta="Nuevo usuario" titulo="Nuevo usuario">
      {(cerrar) => <FormularioUsuario alGuardar={cerrar} />}
    </Dialogo>
  );
}

export function GestionarUsuario({ usuario, esPropio }: { usuario: UsuarioEditable; esPropio: boolean }) {
  const router = useRouter();
  const { ejecutar, enviando, error, limpiarError } = useFormulario();
  const [passwordTemporal, setPasswordTemporal] = useState<string | null>(null);

  function cambiarEstado(cerrar: () => void) {
    if (usuario.activo && !window.confirm(`¿Desactivar a ${usuario.nombre} y cerrar sus sesiones?`)) return;
    ejecutar(
      () => editarUsuarioAction(usuario.id, { activo: !usuario.activo }),
      () => {
        cerrar();
        router.refresh();
      },
    );
  }

  function restablecer() {
    if (!window.confirm(`¿Restablecer la contraseña de ${usuario.nombre} y cerrar sus sesiones?`)) return;
    ejecutar(
      () => restablecerPasswordAction(usuario.id),
      (datos) => setPasswordTemporal(datos.passwordTemporal),
    );
  }

  return (
    <Dialogo
      etiqueta="Gestionar"
      titulo="Gestionar usuario"
      ocupado={enviando}
      alCerrar={() => {
        if (esPropio && passwordTemporal) window.location.replace("/login");
        setPasswordTemporal(null);
        limpiarError();
      }}
    >
      {(cerrar) => passwordTemporal ? (
        <div role="status" className="grid gap-3 rounded-lg bg-exito-fondo p-4 text-exito">
          <p className="font-semibold">Contraseña temporal</p>
          <p className="text-sm">Copiala antes de cerrar. Se muestra una sola vez.</p>
          <code className="select-all break-all rounded-md bg-white px-3 py-2">{passwordTemporal}</code>
        </div>
      ) : (
        <div className="grid gap-5">
          <FormularioUsuario usuario={usuario} esPropio={esPropio} alGuardar={cerrar} bloqueado={enviando} />
          <div className="grid gap-3 border-t pt-4">
            <div className="flex flex-wrap gap-2">
              {!esPropio && (
                <Button
                  type="button" variant="outline"
                  disabled={enviando}
                  onClick={() => cambiarEstado(cerrar)}
                >
                  {usuario.activo ? "Desactivar" : "Activar"}
                </Button>
              )}
              <Button type="button" variant="outline" disabled={enviando} onClick={restablecer}>
                Restablecer contraseña
              </Button>
              {enviando && <p role="status" className="my-auto text-sm text-muted-foreground">Procesando…</p>}
            </div>
            <AvisoError error={error} />
          </div>
        </div>
      )}
    </Dialogo>
  );
}

function FormularioUsuario({
  usuario,
  esPropio = false,
  alGuardar,
  bloqueado = false,
}: {
  usuario?: UsuarioEditable;
  esPropio?: boolean;
  alGuardar: () => void;
  bloqueado?: boolean;
}) {
  const router = useRouter();
  const { enviar, enviando, error, errorCampo } = useFormulario();
  const idErrorRol = useId();
  const errorRol = errorCampo("rol");
  const accion = usuario ? editarUsuarioAction.bind(null, usuario.id) : crearUsuarioAction;
  const esquema = usuario ? edicionUsuarioSchema : altaUsuarioSchema;

  return (
    <form
      method="post"
      onSubmit={(event) =>
        enviar(event, esquema, accion, () => {
          alGuardar();
          router.refresh();
        })
      }
      noValidate
    >
      <fieldset className="grid min-w-0 gap-4" disabled={enviando || bloqueado}>
        <Campo
          etiqueta="Nombre"
          name="nombre"
          autoComplete="off"
          defaultValue={usuario?.nombre}
          error={errorCampo("nombre")}
          required
        />
        <Campo
          etiqueta="Email"
          name="email"
          type="email"
          autoComplete="off"
          defaultValue={usuario?.email}
          error={errorCampo("email")}
          required
        />
        <Label className="grid gap-1.5">
          Rol
          <select
            name="rol"
            className={claseCampo}
            defaultValue={usuario?.rol ?? "vendedor"}
            disabled={esPropio}
            aria-invalid={errorRol ? true : undefined}
            aria-describedby={errorRol ? idErrorRol : undefined}
          >
            <option value="vendedor">Vendedor</option>
            <option value="admin">Administrador</option>
          </select>
          {errorRol && <span id={idErrorRol} className="text-xs font-medium text-peligro">{errorRol}</span>}
        </Label>
        {!usuario && (
          <Campo
            etiqueta="Contraseña inicial"
            name="password"
            type="password"
            autoComplete="new-password"
            error={errorCampo("password")}
            required
          />
        )}
        <AvisoError error={error} />
        <div>
          <Button>
            {enviando ? "Guardando…" : usuario ? "Guardar cambios" : "Crear usuario"}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
