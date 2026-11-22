import { FormularioPassword } from "@/components/acceso/formularios-sesion";
import { Grilla, Titulo } from "@/components/maquetacion";
import { EncabezadoPagina, Panel } from "@/components/pagina";
import { requirePageUser } from "@/lib/auth-request";

export const metadata = { title: "Mi perfil | Gestión comercial" };

export default async function Perfil() {
  const usuario = await requirePageUser();

  return (
    <Grilla gap="lg" className="max-w-lg">
      <EncabezadoPagina titulo="Mi perfil" descripcion={<span className="break-all">{usuario.email}</span>} />
      <Panel className="grid gap-5 p-5 sm:p-7">
        <Titulo nivel={2}>Cambiar contraseña</Titulo>
        <FormularioPassword />
      </Panel>
    </Grilla>
  );
}
