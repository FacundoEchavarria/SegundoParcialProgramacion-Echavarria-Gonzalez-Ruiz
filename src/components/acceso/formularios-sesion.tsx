"use client";

import { cambiarPasswordAction, loginAction, loginDemoAction, logoutAction } from "@/app/actions";
import { cambioPasswordSchema, loginSchema } from "@/lib/schemas/usuarios";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvisoError, Campo, useFormulario } from "./formulario";

const nombresDemo = { admin: "Administrador", vendedor: "Vendedor" };

export function FormularioLogin({ rolesDemo }: { rolesDemo: (keyof typeof nombresDemo)[] }) {
  const { enviar, ejecutar, enviando, error, errorCampo } = useFormulario();

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
      <Button size="lg" className="h-11" disabled={enviando}>
        {enviando ? "Ingresando…" : "Ingresar"}
      </Button>
      {rolesDemo.length > 0 && (
        <fieldset className="grid gap-2 border-t pt-5">
          <legend className="float-left mb-3 w-full text-sm text-muted-foreground">O entrá en modo demo, sin escribir la contraseña:</legend>
          <div className="grid grid-cols-2 gap-2">
            {rolesDemo.map((rol) => (
              <Button key={rol} type="button" variant="outline" className="h-10" disabled={enviando}
                onClick={() => ejecutar(() => loginDemoAction(rol), () => window.location.replace("/"))}>
                {nombresDemo[rol]}
              </Button>
            ))}
          </div>
        </fieldset>
      )}
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
        <Button disabled={enviando}>
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
        <LogOut aria-hidden />
        {enviando ? "Saliendo…" : "Cerrar sesión"}
      </Button>
      <AvisoError error={error} />
    </div>
  );
}
