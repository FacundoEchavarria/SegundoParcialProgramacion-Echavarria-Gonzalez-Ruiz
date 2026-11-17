"use client";

import { cambiarPasswordAction, loginAction, logoutAction } from "@/app/actions";
import { cambioPasswordSchema, loginSchema } from "@/lib/schemas/usuarios";
import { clasePrincipal, claseSecundaria } from "./estilos";
import { AvisoError, Campo, useFormulario } from "./formulario";

export function FormularioLogin() {
  const { enviar, enviando, error, errorCampo } = useFormulario();

  return (
    <form
      method="post"
      className="grid gap-4"
      onSubmit={(event) => enviar(event, loginSchema, loginAction, () => window.location.replace("/"))}
      noValidate
    >
      <Campo etiqueta="Email" name="email" type="email" autoComplete="username" error={errorCampo("email")} required />
      <Campo etiqueta="Contraseña" name="password" type="password" autoComplete="current-password" error={errorCampo("password")} required />
      <AvisoError error={error} />
      <button className={clasePrincipal} disabled={enviando}>
        {enviando ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}

export function FormularioPassword() {
  const { enviar, enviando, error, errorCampo } = useFormulario();

  return (
    <form
      method="post"
      className="grid gap-4"
      onSubmit={(event) =>
        enviar(event, cambioPasswordSchema, cambiarPasswordAction, () => window.location.replace("/login?cambio=1"))
      }
      noValidate
    >
      <Campo etiqueta="Contraseña actual" name="actual" type="password" autoComplete="current-password" error={errorCampo("actual")} required />
      <Campo etiqueta="Nueva contraseña" name="nueva" type="password" autoComplete="new-password" error={errorCampo("nueva")} required />
      <p className="text-sm text-muted-foreground">Usá al menos 8 caracteres. Al guardar, vas a volver a iniciar sesión.</p>
      <AvisoError error={error} />
      <div>
        <button className={clasePrincipal} disabled={enviando}>
          {enviando ? "Guardando…" : "Guardar contraseña"}
        </button>
      </div>
    </form>
  );
}

export function CerrarSesion() {
  const { ejecutar, enviando, error } = useFormulario();

  return (
    <div className="grid justify-items-start gap-2 sm:justify-items-end">
      <button
        type="button"
        className={claseSecundaria}
        onClick={() => ejecutar(logoutAction, () => window.location.replace("/login"))}
        disabled={enviando}
      >
        {enviando ? "Saliendo…" : "Cerrar sesión"}
      </button>
      <AvisoError error={error} />
    </div>
  );
}
