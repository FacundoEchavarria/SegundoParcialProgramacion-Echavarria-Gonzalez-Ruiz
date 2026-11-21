"use client";

import { Button } from "@/components/ui/button";
import { cambiarPasswordAction, loginAction, logoutAction } from "@/app/actions";
import { cambioPasswordSchema, loginSchema } from "@/lib/schemas/usuarios";
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
      <Button type="submit" disabled={enviando}>
        {enviando ? "Ingresando…" : "Ingresar"}
      </Button>
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
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando…" : "Guardar contraseña"}
        </Button>
      </div>
    </form>
  );
}

export function CerrarSesion() {
  const { ejecutar, enviando, error } = useFormulario();

  return (
    <div className="grid justify-items-start gap-2 sm:justify-items-end">
      <Button
        type="button"
        variant="outline"
        onClick={() => ejecutar(logoutAction, () => window.location.replace("/login?salida=1"))}
        disabled={enviando}
      >
        {enviando ? "Saliendo…" : "Cerrar sesión"}
      </Button>
      <AvisoError error={error} />
    </div>
  );
}
