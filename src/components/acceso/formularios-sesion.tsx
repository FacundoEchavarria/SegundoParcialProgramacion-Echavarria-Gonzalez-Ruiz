"use client";

import { cambiarPasswordAction, loginAction, loginDemoAction, logoutAction } from "@/app/actions";
import { cambioPasswordSchema, loginSchema } from "@/lib/schemas/usuarios";
import { clasePrincipal, claseSecundaria } from "./estilos";
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
      <button className={clasePrincipal} disabled={enviando}>
        {enviando ? "Ingresando…" : "Ingresar"}
      </button>
      {rolesDemo.length > 0 && (
        <fieldset className="grid gap-2">
          <legend className="mb-2 w-full border-t pt-4 text-sm text-muted-foreground">O entrá en modo demo, sin escribir la contraseña:</legend>
          <div className="grid grid-cols-2 gap-2">
            {rolesDemo.map((rol) => (
              <button key={rol} type="button" className={claseSecundaria} disabled={enviando}
                onClick={() => ejecutar(() => loginDemoAction(rol), () => window.location.replace("/"))}>
                {nombresDemo[rol]}
              </button>
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
